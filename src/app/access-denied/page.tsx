"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

export default function AccessDeniedPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">접근 권한이 없습니다</h1>
        <h1 className="hidden text-2xl font-bold text-gray-900">
          접근 권한이 없습니다
        </h1>
        <p className="text-gray-600">
          현재 계정은 이 사이트를 이용할 수 없습니다.
          <br />
          이용 가능한 사이트에서 다시 로그인해주세요.
        </p>
        <p className="hidden text-gray-600">
          이 계정은 현재 사이트에 접근할 수 없습니다.
          <br />
          다른 계정으로 로그인해주세요.
        </p>
        <button
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
          className="mt-6 w-full rounded-md bg-gray-900 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          다른 계정으로 로그인
        </button>
        <button
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
          className="hidden mt-6 w-full rounded-md bg-gray-900 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          다른 계정으로 로그인
        </button>
      </div>
    </div>
  );
}
