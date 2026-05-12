"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import { ArrowUpIcon, ArrowDownIcon } from "@/icons";
import { formatRupiah } from "@/lib/db";

interface DashboardStats {
  unitStats: { on_duty: string; stand_by: string; break_down: string; maintenance: string; total: string };
  contractStats: { aktif: string; total: string };
  invoiceStats: { piutang: string; pendapatan_bulan_ini: string };
  paymentStats: { penerimaan_bulan_ini: string };
}

const MetricCard = ({
  icon,
  label,
  value,
  sub,
  badge,
  badgeColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  badge?: string;
  badgeColor?: "success" | "warning" | "error" | "info";
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
      {icon}
    </div>
    <div className="flex items-end justify-between mt-5">
      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{value}</h4>
        {sub && <span className="text-xs text-gray-400 dark:text-gray-500">{sub}</span>}
      </div>
      {badge && badgeColor && (
        <Badge color={badgeColor}>
          {badgeColor === "success" ? <ArrowUpIcon /> : <ArrowDownIcon />}
          {badge}
        </Badge>
      )}
    </div>
  </div>
);

export default function DashboardMetrics({ stats }: { stats: DashboardStats }) {
  const { unitStats, contractStats, invoiceStats, paymentStats } = stats;
  const utilization = unitStats.total
    ? Math.round((Number(unitStats.on_duty) / Number(unitStats.total)) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
      <MetricCard
        icon={
          <svg className="text-brand-500 size-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        }
        label="Kontrak Aktif"
        value={String(contractStats.aktif)}
        sub={`dari ${contractStats.total} total kontrak`}
        badge={`${utilization}% utilisasi`}
        badgeColor="success"
      />
      <MetricCard
        icon={
          <svg className="text-success-500 size-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 7v4h1v4h-3V7h2zm-2-5H7c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H17c1.1 0 2-.9 2-2V7l-6-6zm4 17H7V4h7v5h5v10z"/>
          </svg>
        }
        label="Pendapatan Bulan Ini"
        value={formatRupiah(Number(invoiceStats.pendapatan_bulan_ini))}
        sub="dari invoice terbit"
      />
      <MetricCard
        icon={
          <svg className="text-warning-500 size-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
          </svg>
        }
        label="Piutang Outstanding"
        value={formatRupiah(Number(invoiceStats.piutang))}
        sub="belum terbayar"
        badge="perlu tindak lanjut"
        badgeColor="warning"
      />
      <MetricCard
        icon={
          <svg className="text-error-500 size-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        }
        label="Unit Alat Berat"
        value={String(unitStats.total)}
        sub={`On Duty: ${unitStats.on_duty} | Break Down: ${unitStats.break_down}`}
      />
    </div>
  );
}
