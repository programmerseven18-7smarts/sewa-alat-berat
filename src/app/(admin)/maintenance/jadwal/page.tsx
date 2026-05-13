import type { Metadata } from "next";
import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import Badge from "@/components/ui/badge/Badge";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Jadwal Service | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const getServiceStatus = (currentHm: number | null, lastHm: number | null) => {
  if (currentHm == null) return { label: "HM Belum Ada", color: "info" as const, hmUntil: null };
  if (lastHm == null) return { label: "Belum Pernah Service", color: "error" as const, hmUntil: null };

  const nextService = lastHm + 250;
  const hmUntil = nextService - currentHm;

  if (hmUntil <= 0) return { label: "Jatuh Tempo", color: "error" as const, hmUntil };
  if (hmUntil <= 50) return { label: "Segera Service", color: "warning" as const, hmUntil };
  return { label: "Normal", color: "success" as const, hmUntil };
};

const unitStatusColor = (status: string) => {
  if (status === "Stand By") return "success";
  if (status === "On Duty") return "info";
  if (status === "Break Down") return "error";
  return "warning";
};

export default async function JadwalPage() {
  await requirePageAccess("jadwal_service");

  const [units, reportHm] = await Promise.all([
    prisma.equipmentUnit.findMany({
      orderBy: { kodeLambung: "asc" },
      select: {
        id: true,
        kodeLambung: true,
        merk: true,
        model: true,
        status: true,
        currentHm: true,
        category: {
          select: {
            nama: true,
          },
        },
        maintenanceOrders: {
          where: {
            status: "Done",
          },
          orderBy: [{ tanggalSelesai: "desc" }, { createdAt: "desc" }],
          take: 1,
          select: {
            hmService: true,
            tanggalSelesai: true,
            tipe: true,
          },
        },
      },
    }),
    prisma.dailyReport.groupBy({
      by: ["unitId"],
      _max: {
        hmAkhir: true,
      },
    }),
  ]);

  const hmByUnit = new Map(reportHm.map((row) => [row.unitId, row._max.hmAkhir]));
  const rows = units.map((unit) => {
    const latestService = unit.maintenanceOrders[0] ?? null;
    const currentHm = Number(hmByUnit.get(unit.id) ?? unit.currentHm ?? 0) || null;
    const lastHm = latestService?.hmService != null ? Number(latestService.hmService) : null;
    const service = getServiceStatus(currentHm, lastHm);

    return {
      ...unit,
      currentHm,
      latestService,
      lastHm,
      nextServiceHm: lastHm != null ? lastHm + 250 : null,
      service,
    };
  });

  const summary = {
    overdue: rows.filter((row) => row.service.color === "error").length,
    warning: rows.filter((row) => row.service.color === "warning").length,
    normal: rows.filter((row) => row.service.color === "success").length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Jadwal Service / Maintenance</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Pantau jadwal service berkala berdasarkan HM unit dan work order selesai.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-error-200 bg-error-50 px-5 py-4 text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
          <p className="text-xs font-medium opacity-80">Jatuh Tempo</p>
          <p className="mt-1 text-2xl font-bold">{summary.overdue} unit</p>
        </div>
        <div className="rounded-2xl border border-warning-200 bg-warning-50 px-5 py-4 text-warning-700 dark:border-warning-800 dark:bg-warning-900/20 dark:text-warning-400">
          <p className="text-xs font-medium opacity-80">Segera Service</p>
          <p className="mt-1 text-2xl font-bold">{summary.warning} unit</p>
        </div>
        <div className="rounded-2xl border border-success-200 bg-success-50 px-5 py-4 text-success-700 dark:border-success-800 dark:bg-success-900/20 dark:text-success-400">
          <p className="text-xs font-medium opacity-80">Normal</p>
          <p className="mt-1 text-2xl font-bold">{summary.normal} unit</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <ResponsiveDataView
          data={rows}
          getKey={(row) => row.id}
          getTitle={(row) => `${row.kodeLambung} - ${row.merk} ${row.model}`}
          emptyMessage="Tidak ada jadwal service."
          minWidth={980}
          columns={[
            {
              header: "Unit",
              render: (row) => (
                <>
                  <p className="font-semibold text-gray-800 dark:text-white/90">{row.kodeLambung}</p>
                  <p className="text-xs text-gray-400">{row.merk} {row.model}</p>
                </>
              ),
            },
            { header: "Kategori", className: "text-gray-500 dark:text-gray-400", render: (row) => row.category?.nama ?? "-" },
            { header: "Status Unit", render: (row) => <Badge size="sm" color={unitStatusColor(row.status)}>{row.status}</Badge> },
            { header: "HM Terakhir", className: "font-mono text-gray-500 dark:text-gray-400", render: (row) => row.lastHm != null ? `${row.lastHm} HM` : "-" },
            { header: "Tgl Service Terakhir", className: "text-gray-500 dark:text-gray-400", render: (row) => row.latestService?.tanggalSelesai ? formatDate(row.latestService.tanggalSelesai) : "-" },
            { header: "HM Saat Ini", className: "font-mono font-semibold text-gray-800 dark:text-white/90", render: (row) => row.currentHm != null ? `${row.currentHm} HM` : "-" },
            { header: "HM Berikutnya", className: "font-mono text-gray-500 dark:text-gray-400", render: (row) => row.nextServiceHm != null ? `${row.nextServiceHm} HM` : "-" },
            {
              header: "Sisa HM",
              className: "font-mono",
              render: (row) => row.service.hmUntil != null ? (
                <span className={row.service.hmUntil <= 0 ? "font-bold text-error-600" : row.service.hmUntil <= 50 ? "font-semibold text-warning-600" : "text-success-600"}>
                  {row.service.hmUntil <= 0 ? `${Math.abs(row.service.hmUntil)} HM lewat` : `${row.service.hmUntil} HM`}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              ),
            },
            { header: "Jadwal", render: (row) => <Badge size="sm" color={row.service.color}>{row.service.label}</Badge> },
          ]}
        />
        <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <p className="text-sm text-gray-400">{rows.length} unit terpantau</p>
        </div>
      </div>
    </div>
  );
}
