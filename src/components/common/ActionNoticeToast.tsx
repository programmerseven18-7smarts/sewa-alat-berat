"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type NoticeType = "success" | "error" | "warning" | "info";

const noticeStyle: Record<
  NoticeType,
  { title: string; border: string; background: string; text: string }
> = {
  success: {
    title: "Berhasil",
    border: "border-success-500",
    background: "bg-success-50 dark:bg-success-500/15",
    text: "text-success-700 dark:text-success-300",
  },
  error: {
    title: "Gagal",
    border: "border-error-500",
    background: "bg-error-50 dark:bg-error-500/15",
    text: "text-error-700 dark:text-error-300",
  },
  warning: {
    title: "Perhatian",
    border: "border-warning-500",
    background: "bg-warning-50 dark:bg-warning-500/15",
    text: "text-warning-700 dark:text-warning-300",
  },
  info: {
    title: "Info",
    border: "border-blue-light-500",
    background: "bg-blue-light-50 dark:bg-blue-light-500/15",
    text: "text-blue-light-700 dark:text-blue-light-300",
  },
};

const isNoticeType = (value: string | null): value is NoticeType =>
  value === "success" || value === "error" || value === "warning" || value === "info";

export default function ActionNoticeToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice");
  const message = searchParams.get("noticeMessage");
  const type = isNoticeType(notice) ? notice : null;
  const style = type ? noticeStyle[type] : null;

  const cleanUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("notice");
    params.delete("noticeMessage");
    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!type || !message) return;

    const cleanTimer = window.setTimeout(() => {
      router.replace(cleanUrl, { scroll: false });
    }, 4500);

    return () => {
      window.clearTimeout(cleanTimer);
    };
  }, [cleanUrl, message, router, type]);

  if (!type || !message || !style) return null;

  return (
    <div className="fixed right-4 top-20 z-[999999] w-[calc(100vw-2rem)] max-w-md">
      <div className={`rounded-xl border-l-4 ${style.border} ${style.background} p-4 shadow-lg ring-1 ring-black/5`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${style.text}`}>{style.title}</p>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{message}</p>
          </div>
          <button
            type="button"
            onClick={() => router.replace(cleanUrl, { scroll: false })}
            className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
