"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  LayoutTemplate,
  Calculator,
  Settings,
  MessageSquare,
  Archive,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, status, signOut } = useAuth();

  if (status === "loading") {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const isAdmin = profile?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
            <p className="mt-2 text-gray-600">
              환영합니다, {profile?.name ?? profile?.email ?? "사용자"}님
            </p>
          </div>
          <button
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            로그아웃
          </button>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            // 잼스 href="/thumbnail-editor"
            href="https://gemini.google.com/gem/1IWR0Irn4jzmH3COBgncT93beU863blPb?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700">
              <ImageIcon size={32} />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">썸네일 제작</h2>
            <p className="text-gray-600">
              AI를 사용하여 상품용 썸네일 이미지를 생성합니다.
            </p>
          </Link>

          <Link
            href="/detail-editor"
            className="group block rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-green-500 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-lg bg-green-50 p-3 text-green-600 group-hover:bg-green-100 group-hover:text-green-700">
              <LayoutTemplate size={32} />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">상세페이지 제작</h2>
            <p className="text-gray-600">
              Figma 템플릿과 AI를 결합하여 상세페이지를 생성합니다.
            </p>
          </Link>

          <Link
            href="/detail-projects"
            className="group block rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-indigo-500 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-lg bg-indigo-50 p-3 text-indigo-600 group-hover:bg-indigo-100 group-hover:text-indigo-700">
              <Archive size={32} />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">상세페이지 저장함</h2>
            <p className="text-gray-600">
              다른 이름으로 저장한 상세페이지를 불러오고 여러 캔버스를 관리합니다.
            </p>
          </Link>

          <Link
            // /cs-responder
            href="https://gemini.google.com/gem/1U00KqNWmka3i1TajKWeEbXiXe3sHrmm3?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700">
              <MessageSquare size={32} />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">CS 응답기</h2>
            <p className="text-gray-600">
              AI가 고객 문의에 맞는 응답 메시지를 작성합니다.
            </p>
          </Link>

          <Link
            href="/margin-calculator"
            className="group block rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-yellow-500 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-lg bg-yellow-50 p-3 text-yellow-600 group-hover:bg-yellow-100 group-hover:text-yellow-700">
              <Calculator size={32} />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">마진 계산기</h2>
            <p className="text-gray-600">
              수수료와 가격 정보를 반영해 상품 마진을 계산합니다.
            </p>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="hidden group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
            >
              <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                <Settings size={32} />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">관리자 페이지</h2>
              <p className="text-gray-600">
                회원 승인과 권한 관리 기능을 제공합니다.
              </p>
            </Link>
          )}
          {/* 건드리지말 것 */}
          {/* <Link
            href="/dashboard/api-keys"
            className="group block rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
          >
            <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700">
              <Key size={32} />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">API 키 관리</h2>
            <p className="text-gray-600">
              Gemini API 키를 저장하고 관리합니다.
            </p>
          </Link> */}
        </div>
      </div>
    </div>
  );
}
