"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, RotateCcw, Save, Loader2, X, AlertCircle, Info, Edit2 } from "lucide-react";

type Category = "과일" | "구근류";

const COMMISSIONS: Record<Category, number> = {
  "과일": 11.66,
  "구근류": 8.36,
};

interface RowData {
  id: string;
  date: string | number;
  item: string;
  option: string;
  supplyPrice: number | "";
  sellPrice: number | "";
  quantity: number | "";
}

type MarginRecord = {
  id?: string;
  month: string;
  tabName: string;
  data: {
    rows?: RowData[];
    adSpend?: number | "";
    category?: Category;
  };
};

type MarginRecordData = MarginRecord["data"];

const generateId = () => Math.random().toString(36).substring(2, 9);
const getCurrentMonthStr = () => new Date().toISOString().slice(0, 7);

// Modal UI Component
function CustomModal({
  isOpen,
  title,
  message,
  type,
  inputValue,
  setInputValue,
  onConfirm,
  onCancel,
  isLoading
}: {
  isOpen: boolean;
  title: string;
  message: string;
  type: "alert" | "confirm" | "prompt";
  inputValue?: string;
  setInputValue?: (val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4 transition-opacity">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 transform transition-all">
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            {type === "alert" ? <Info className="text-blue-500 h-6 w-6" /> : <AlertCircle className="text-yellow-500 h-6 w-6" />}
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">{message}</p>

          {type === "prompt" && setInputValue && (
            <input
              type="text"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !isLoading) onConfirm(); }}
              className="w-full mb-2 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder="여기에 입력하세요..."
            />
          )}

          <div className="flex gap-3 justify-end mt-4">
            {type !== "alert" && (
              <button
                disabled={isLoading}
                onClick={onCancel}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            )}
            <button
              disabled={isLoading || (type === "prompt" && !inputValue?.trim())}
              onClick={onConfirm}
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarginCalculator() {
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonthStr());
  const [tabs, setTabs] = useState<string[]>(["기본 데이터"]);
  const [currentTab, setCurrentTab] = useState<string>("기본 데이터");
  const [monthDataCache, setMonthDataCache] = useState<MarginRecord[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [category, setCategory] = useState<Category>("과일");
  const [adSpend, setAdSpend] = useState<number | "">("");

  const [rows, setRows] = useState<RowData[]>([
    {
      id: generateId(),
      date: "",
      item: "",
      option: "",
      supplyPrice: "",
      sellPrice: "",
      quantity: 1,
    },
  ]);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "alert" | "confirm" | "prompt";
    inputValue: string;
    onConfirm: (val?: string) => void;
  }>({
    isOpen: false, title: "", message: "", type: "alert", inputValue: "", onConfirm: () => { }
  });

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const showAlert = (title: string, message: string) => {
    setModalConfig({ isOpen: true, title, message, type: "alert", inputValue: "", onConfirm: closeModal });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalConfig({
      isOpen: true, title, message, type: "confirm", inputValue: "",
      onConfirm: () => { onConfirm(); closeModal(); }
    });
  };

  const showPrompt = (title: string, message: string, defaultValue: string, onConfirm: (val: string) => void) => {
    setModalConfig({
      isOpen: true, title, message, type: "prompt", inputValue: defaultValue,
      onConfirm: () => { /* will be handled directly in the button click reading the state */ }
    });
    // For prompt, we override onConfirm to pass the input value
    setModalConfig(prev => ({
      ...prev,
      onConfirm: () => {
        if (prev.inputValue.trim()) {
          onConfirm(prev.inputValue.trim());
          closeModal();
        }
      }
    }));
  };

  // Sync Input Value changes for prompt
  const setModalInputValue = (val: string) => {
    setModalConfig(prev => ({
      ...prev, inputValue: val, onConfirm: () => {
        if (val.trim()) {
          //@ts-ignore - dynamic scoping trick
          prev.originalOnConfirm ? prev.originalOnConfirm(val.trim()) : null;
        }
      }
    }));
  };

  const normalizeRecord = (record: any): MarginRecord => ({
    id: record.id,
    month: record.month,
    tabName: record.tabName ?? record.tab_name,
    data: record.data ?? {},
  });


  useEffect(() => {
    const loadMonthData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/margin-records`);
        if (res.ok) {
          const result = await res.json();
          const records = (result.records ?? [])
            .map(normalizeRecord)
            .filter((r: MarginRecord) => r.month === currentMonth);

          setMonthDataCache(records);

          if (records.length > 0) {
            const loadedTabs = records
              .map((r: MarginRecord) => r.tabName)
              .filter(Boolean);
            setTabs(loadedTabs);
            setCurrentTab(loadedTabs[0]);
          } else {
            setTabs(["기본 데이터"]);
            setCurrentTab("기본 데이터");
          }
        }
      } catch (err) {
        console.error("Failed to load month records:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadMonthData();
  }, [currentMonth]);

  useEffect(() => {
    const currentRecord = monthDataCache.find((r) => r.tabName === currentTab);
    if (currentRecord && currentRecord.data) {
      setRows(currentRecord.data.rows || []);
      setAdSpend(currentRecord.data.adSpend ?? "");
      setCategory(currentRecord.data.category || "과일");
    } else {
      setRows([{ id: generateId(), date: "", item: "", option: "", supplyPrice: "", sellPrice: "", quantity: 1 }]);
      setAdSpend("");
      setCategory("과일");
    }
  }, [currentTab, monthDataCache]);

  const handleResetState = () => {
    setRows([{ id: generateId(), date: "", item: "", option: "", supplyPrice: "", sellPrice: "", quantity: 1 }]);
    setAdSpend("");
    setCategory("과일");
  };

  const handleReset = () => {
    showConfirm("초기화", "현재 탭의 데이터를 초기화하시겠습니까?", handleResetState);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = { rows, adSpend, category };
      const res = await fetch("/api/margin-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: currentMonth, tabName: currentTab, data }),
      });

      if (res.ok) {
        setMonthDataCache(prev => {
          const idx = prev.findIndex((r) => r.tabName === currentTab);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { month: currentMonth, tabName: currentTab, data };
            return copy;
          }
          return [...prev, { month: currentMonth, tabName: currentTab, data }];
        });
        showAlert("저장 완료", "데이터가 성공적으로 저장되었습니다.");
      } else {
        const errData = await res.json().catch(() => ({}));
        showAlert("저장 실패", `저장에 실패했습니다: ${errData.details || errData.error || res.status}`);
      }
    } catch (err: any) {
      console.error(err);
      showAlert("오류", `오류가 발생했습니다: ${err.message || String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const execAddTab = async (name: string) => {
    if (tabs.includes(name)) {
      showAlert("중복된 탭", "이미 같은 이름의 탭이 존재합니다.");
      return;
    }

    setTabs([...tabs, name]);
    setCurrentTab(name);

    const emptyData: MarginRecordData = {
      rows: [{ id: generateId(), date: "", item: "", option: "", supplyPrice: "", sellPrice: "", quantity: 1 }],
      adSpend: "",
      category: "과일"
    };

    try {
      setIsLoading(true);
      const res = await fetch("/api/margin-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: currentMonth, tabName: name, data: emptyData }),
      });

      if (res.ok) {
        setMonthDataCache(prev => [...prev, { month: currentMonth, tabName: name, data: emptyData }]);
      } else {
        const errData = await res.json().catch(() => ({}));
        showAlert("저장 경고", `탭은 생성되었으나 서버 저장에 실패했습니다. (${errData.details || errData.error || res.status})`);
      }
    } catch (err: any) {
      console.error("Failed to auto-save new tab:", err);
      showAlert("오류", `서버 통신 오류로 탭 저장에 실패했습니다: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTabClick = () => {
    setModalConfig({
      isOpen: true, title: "새로운 탭 추가", message: "생성할 탭의 이름을 입력하세요. (예: 사과, 귤)",
      type: "prompt", inputValue: "",
      onConfirm: () => {
        // Tricky closure, need to read current state
      }
    });

    // To cleanly capture the prompt input:
    const onConfirmCallback = (val: string) => { execAddTab(val); closeModal(); };
    setModalConfig(prev => ({ ...prev, onConfirm: onConfirmCallback, originalOnConfirm: onConfirmCallback } as any));
  };


  const execRenameTab = async (oldName: string, parsedName: string) => {
    if (tabs.includes(parsedName)) {
      showAlert("중복된 이름", "이미 존재하는 탭 이름입니다.");
      return;
    }

    const isSavedInDB = monthDataCache.some((r) => r.tabName === oldName);

    if (!isSavedInDB) {
      setTabs(prev => prev.map(t => t === oldName ? parsedName : t));
      if (currentTab === oldName) setCurrentTab(parsedName);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/margin-records", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: currentMonth, oldTabName: oldName, newTabName: parsedName }),
      });

      if (res.ok) {
        setTabs(prev => prev.map(t => t === oldName ? parsedName : t));
        setMonthDataCache(prev => prev.map(r => r.tabName === oldName ? { ...r, tabName: parsedName } : r));
        if (currentTab === oldName) {
          setCurrentTab(parsedName);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        showAlert("변경 실패", `이름 변경에 실패했습니다: ${errData.details || errData.error || res.status}`);
      }
    } catch (err: any) {
      console.error(err);
      showAlert("오류", `이름 변경 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameTabClick = (e: React.MouseEvent, oldName: string) => {
    e.stopPropagation();
    const onConfirmCallback = (val?: string) => {
      if (val && val !== oldName) execRenameTab(oldName, val);
      closeModal();
    };

    setModalConfig({
      isOpen: true, title: "탭 이름 변경", message: `'${oldName}' 탭의 새 이름을 입력하세요:`,
      type: "prompt", inputValue: oldName,
      onConfirm: onConfirmCallback,
      //@ts-ignore
      originalOnConfirm: onConfirmCallback
    });
  };

  const execDeleteTab = async (tabNameToDelete: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/margin-records?month=${currentMonth}&tabName=${tabNameToDelete}`, {
        method: "DELETE"
      });
      if (res.ok || res.status === 404) {
        const newTabs = tabs.filter(t => t !== tabNameToDelete);
        setTabs(newTabs);
        setMonthDataCache(prev => prev.filter(r => r.tabName !== tabNameToDelete));

        if (currentTab === tabNameToDelete) {
          setCurrentTab(newTabs.length > 0 ? newTabs[0] : "");
          if (newTabs.length === 0) {
            setTabs(["기본 데이터"]);
            setCurrentTab("기본 데이터");
          }
        }
      } else {
        showAlert("삭제 실패", "탭 삭제 연동에 실패했습니다.");
      }
    } catch (error: any) {
      console.error(error);
      showAlert("오류", `삭제 중 오류 발생: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTabClick = (e: React.MouseEvent, tabNameToDelete: string) => {
    e.stopPropagation();
    showConfirm("탭 삭제", `'${tabNameToDelete}' 탭을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.`, () => execDeleteTab(tabNameToDelete));
  };

  const commissionRate = COMMISSIONS[category] / 100;

  const handleAddRow = () => {
    setRows([...rows, { id: generateId(), date: "", item: "", option: "", supplyPrice: "", sellPrice: "", quantity: 1 }]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length === 1) return;
    setRows(rows.filter((row) => row.id !== id));
  };

  const updateRow = (id: string, field: keyof RowData, value: string | number) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const num = (val: number | "") => (val === "" ? 0 : val);

  const calculateTabNetProfit = (tabRows: RowData[], tabAdSpend: number | "", tabCategory: Category) => {
    const commRate = COMMISSIONS[tabCategory] / 100;
    let tabTotalProfit = 0;
    tabRows.forEach(row => {
      const sp = num(row.supplyPrice);
      const selp = num(row.sellPrice);
      const q = num(row.quantity);
      const margin = selp > 0 ? selp * (1 - commRate) - sp : 0;
      tabTotalProfit += margin * q;
    });
    return tabTotalProfit - (num(tabAdSpend) * 1.1);
  };

  const totalMonthNetProfit = useMemo(() => {
    let sum = 0;
    monthDataCache.forEach(record => {
      if (record.tabName !== currentTab) {
        sum += calculateTabNetProfit(record.data.rows || [], record.data.adSpend ?? "", record.data.category || "과일");
      }
    });
    sum += calculateTabNetProfit(rows, adSpend, category);
    return sum;
  }, [monthDataCache, currentTab, rows, adSpend, category]);

  const calculatedRows = useMemo(() => {
    return rows.map((row) => {
      const sp = num(row.supplyPrice);
      const selp = num(row.sellPrice);
      const q = num(row.quantity);

      const margin = selp > 0 ? selp * (1 - commissionRate) - sp : 0;
      const marginRate = selp > 0 ? margin / selp : 0;
      const profit = margin * q;

      return { ...row, margin, marginRate, profit };
    });
  }, [rows, commissionRate]);

  const totalProfit = useMemo(() => calculatedRows.reduce((acc, row) => acc + row.profit, 0), [calculatedRows]);
  const netProfit = totalProfit - (num(adSpend) * 1.1);

  const formatCurrency = (val: number) => new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(val);
  const formatPercent = (val: number) => (val * 100).toFixed(2) + "%";

  return (
    <>
      <CustomModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        inputValue={modalConfig.inputValue}
        setInputValue={setModalInputValue}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
        isLoading={isLoading || isSaving}
      />

      <div className="mx-auto w-full max-w-7xl relative">
        {/* Month & Tab Navigation */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              월 선택
            </label>

            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="block rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div className="flex flex-wrap flex-1 gap-2 items-center md:ml-6 w-full relative">
            {tabs.map((tab) => (
              <div key={tab} className="relative group flex items-center">
                <button
                  onClick={() => setCurrentTab(tab)}
                  onDoubleClick={(e) => handleRenameTabClick(e, tab)}
                  title="더블클릭하여 이름 변경"
                  className={`flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${currentTab === tab
                    ? "bg-green-100 text-green-800 border-2 border-green-500"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-transparent"
                    }`}
                >
                  {tab}
                </button>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteTabClick(e, tab)}
                    className="absolute -top-1 -right-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-100 text-red-600 group-hover:flex hover:bg-red-200 shadow-sm z-10"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
                {/* Mobile rename icon hint since double-click is hard on touch */}
                <button
                  onClick={(e) => handleRenameTabClick(e, tab)}
                  className="hidden md:hidden group-hover:flex absolute -bottom-2 right-1 h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm z-10"
                >
                  <Edit2 size={10} />
                </button>
              </div>
            ))}
            <button
              onClick={handleAddTabClick}
              className="flex items-center justify-center rounded-full border border-dashed border-gray-400 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              title="새로운 탭 추가"
            >
              <Plus size={16} />
            </button>
          </div>

          <div>
            {isLoading && <Loader2 className="animate-spin text-green-600 w-5 h-5" />}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 overflow-x-auto relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            </div>
          )}

          <div className="mb-6 flex flex-col justify-between space-y-4 md:flex-row md:items-start md:space-y-0">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-green-700 mb-1">과일 마진 계산기</h2>
              <p className="text-sm text-gray-500">카테고리 비율을 선택하면 마진이 자동 계산됩니다.</p>
            </div>

            <div className="flex flex-col items-end space-y-4">
              <div className="rounded-xl bg-orange-50 px-5 py-3 border border-orange-200 text-right shadow-sm w-full sm:w-auto">
                <p className="text-xs font-semibold text-orange-600 mb-1">[{currentMonth}] 전체 탭 순이익 합계</p>
                <p className="text-2xl font-extrabold text-[#d93a26]">{formatCurrency(totalMonthNetProfit)}</p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">카테고리 비율</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  >
                    <option value="과일">과일 ({COMMISSIONS["과일"]}%)</option>
                    <option value="구근류">구근류 ({COMMISSIONS["구근류"]}%)</option>
                  </select>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving || isLoading}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 whitespace-nowrap transition-colors"
                  title="현재 보고있는 탭의 데이터를 서버에 저장합니다"
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  현재 탭 저장
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 whitespace-nowrap transition-colors"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 min-h-[200px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#a3d16b]">
                <tr>
                  <th scope="col" className="px-3 py-3 font-semibold text-gray-900 border-r border-[#96c161]">판매일자</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-gray-900 border-r border-[#96c161]">품목</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-gray-900 border-r border-[#96c161]">옵션</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-gray-900 border-r border-[#96c161]">공급가</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-gray-900 border-r border-[#96c161]">판매가</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-white bg-[#f1a42b] border-r border-[#d99426]">마진</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-white bg-[#f1a42b] border-r border-[#d99426]">마진율</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-gray-900 border-r border-[#96c161]">판매량</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-white bg-[#f1a42b] border-r border-[#d99426]">수익</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-gray-900 bg-[#a3d16b] w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-[#ebf5df]">
                {calculatedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#e0edd2] transition-colors">
                    <td className="whitespace-nowrap px-1 py-1 border-r border-gray-200/50">
                      <div className="flex items-center justify-center">
                        <input type="number" min="1" max="31" value={row.date} onChange={(e) => updateRow(row.id, "date", e.target.value)} className="block w-12 rounded border-0 bg-transparent py-1.5 text-center text-gray-900 shadow-none focus:ring-0 sm:text-sm" />
                        <span className="text-gray-500 text-sm pr-1">일</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-1 py-1 border-r border-gray-200/50">
                      <input type="text" value={row.item} onChange={(e) => updateRow(row.id, "item", e.target.value)} className="block w-24 md:w-full rounded border-0 bg-transparent py-1.5 text-gray-900 shadow-none focus:ring-0 sm:text-sm" placeholder="품목" />
                    </td>
                    <td className="whitespace-nowrap px-1 py-1 border-r border-gray-200/50">
                      <input type="text" value={row.option} onChange={(e) => updateRow(row.id, "option", e.target.value)} className="block w-24 md:w-full rounded border-0 bg-transparent py-1.5 text-gray-900 shadow-none focus:ring-0 sm:text-sm" placeholder="옵션" />
                    </td>
                    <td className="whitespace-nowrap px-1 py-1 border-r border-gray-200/50">
                      <input type="number" value={row.supplyPrice} onChange={(e) => updateRow(row.id, "supplyPrice", e.target.value ? Number(e.target.value) : "")} className="block w-24 md:w-full rounded border-0 bg-transparent py-1.5 text-gray-900 shadow-none focus:ring-0 sm:text-sm text-right" placeholder="0" />
                    </td>
                    <td className="whitespace-nowrap px-1 py-1 border-r border-gray-200/50 bg-[#e3ecda]">
                      <input type="number" value={row.sellPrice} onChange={(e) => updateRow(row.id, "sellPrice", e.target.value ? Number(e.target.value) : "")} className="block w-24 md:w-full rounded border-0 bg-transparent py-1.5 text-gray-900 shadow-none focus:ring-0 sm:text-sm text-right" placeholder="0" />
                    </td>
                    <td className="whitespace-nowrap px-3 py-1 text-right text-sm font-medium text-gray-900 bg-[#f7c06a] border-r border-[#e8b15d]">
                      {formatCurrency(row.margin)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-1 text-right text-sm font-medium text-gray-900 bg-[#f7c06a] border-r border-[#e8b15d]">
                      {formatPercent(row.marginRate)}
                    </td>
                    <td className="whitespace-nowrap px-1 py-1 border-r border-gray-200/50">
                      <input type="number" min="1" value={row.quantity} onChange={(e) => updateRow(row.id, "quantity", e.target.value ? Number(e.target.value) : "")} className="block w-16 md:w-full rounded border-0 bg-transparent py-1.5 text-gray-900 shadow-none focus:ring-0 sm:text-sm text-right" />
                    </td>
                    <td className="whitespace-nowrap px-3 py-1 text-right text-sm font-medium text-gray-900 bg-[#f7c06a] border-r border-[#e8b15d]">
                      {formatCurrency(row.profit)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-1 text-center">
                      <button onClick={() => handleRemoveRow(row.id)} disabled={rows.length === 1} className="text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center">
            <button onClick={handleAddRow} className="mb-4 md:mb-0 inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700">
              <Plus className="-ml-1 mr-2 h-4 w-4" /> 항목 추가
            </button>

            <div className="w-full md:w-auto overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody className="divide-y divide-gray-200 bg-white">
                  <tr>
                    <th scope="row" className="bg-[#fdf3cd] px-4 py-2 text-left text-sm font-medium text-gray-900 w-24">총수익</th>
                    <td className="bg-[#f7c06a] px-4 py-2 text-right text-sm font-bold text-gray-900 w-32 border-l border-[#e8b15d]">{formatCurrency(totalProfit)}</td>
                  </tr>
                  <tr>
                    <th scope="row" className="bg-[#fdf3cd] px-4 py-2 text-left text-sm font-medium text-gray-900 flex items-center h-full min-h-[44px]">광고비</th>
                    <td className="bg-[#f7c06a] p-0 border-l border-[#e8b15d]">
                      <input type="number" value={adSpend} onChange={(e) => setAdSpend(e.target.value ? Number(e.target.value) : "")} className="block w-full h-full min-h-[44px] border-0 bg-transparent py-2 px-4 text-right font-medium text-gray-900 shadow-none focus:ring-0 sm:text-sm" placeholder="0" />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="bg-[#fdf3cd] px-4 py-2 text-left text-sm font-medium text-gray-900">순이익</th>
                    <td className="bg-[#f7c06a] px-4 py-2 text-right text-sm font-extrabold text-[#d93a26] border-l border-[#e8b15d]">{formatCurrency(netProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
