"use client";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface UnitStats {
  on_duty: string;
  stand_by: string;
  break_down: string;
  maintenance: string;
  total: string;
}

export default function UnitStatusChart({ stats }: { stats: UnitStats }) {
  const series = [
    Number(stats.on_duty),
    Number(stats.stand_by),
    Number(stats.break_down),
    Number(stats.maintenance),
  ];

  const options: ApexOptions = {
    chart: { type: "donut", fontFamily: "Outfit, sans-serif" },
    colors: ["#465fff", "#22c55e", "#ef4444", "#f59e0b"],
    labels: ["On Duty", "Stand By", "Break Down", "Maintenance"],
    legend: { position: "bottom", fontFamily: "Outfit" },
    dataLabels: { enabled: true, formatter: (val: number) => `${Math.round(val)}%` },
    tooltip: { y: { formatter: (val) => `${val} unit` } },
    plotOptions: {
      pie: { donut: { size: "65%", labels: {
        show: true,
        total: { show: true, label: "Total Unit", formatter: () => String(stats.total) },
      }}},
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Status Unit Alat Berat</h3>
      <ReactApexChart options={options} series={series} type="donut" height={260} />
    </div>
  );
}
