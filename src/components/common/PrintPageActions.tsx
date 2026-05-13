"use client";

import Link from "next/link";

type PrintPageActionsProps = {
  backHref: string;
};

export default function PrintPageActions({ backHref }: PrintPageActionsProps) {
  return (
    <div className="mx-auto mb-6 flex w-full max-w-4xl items-center justify-between gap-3 print:hidden">
      <Link
        href={backHref}
        className="inline-flex h-10 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        Kembali
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-10 items-center rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        Cetak
      </button>
    </div>
  );
}
