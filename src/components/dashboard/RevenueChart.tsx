"use client";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"];

interface MonthlyData {
  bulan: number;
  tahun: number;
  total: string;
}

export default function RevenueChart({ data }: { data: MonthlyData[] }) {
  const categories: string[] = [];
  const values: number[] = [];

  // Build last 12 months
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    categories.push(`${MONTHS[m - 1]} ${y}`);
    const found = data.find((r) => r.bulan === m && r.tahun === y);
    values.push(found ? Math.round(Number(found.total) / 1_000_000) : 0);
  }

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 220,
      toolbar: { show: false },
      animations: { enabled: true },
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: "45%", borderRadius: 4, borderRadiusApplication: "end" },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 3, colors: ["transparent"] },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "11px" } },
    },
    yaxis: {
      title: { text: "Juta (Rp)" },
      labels: { formatter: (v) => `${v}Jt` },
    },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      y: { formatter: (val) => `Rp ${val.toLocaleString("id-ID")} Jt` },
    },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Pendapatan Bulanan</h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">dalam Juta Rupiah</span>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <ReactApexChart options={options} series={[{ name: "Pendapatan", data: values }]} type="bar" height={220} />
        </div>
      </div>
    </div>
  );
}
