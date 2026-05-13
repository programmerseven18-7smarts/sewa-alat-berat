export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approval"
  | "print"
  | "export";

export type DefaultRoleCode = "SUPER_ADMIN" | "ADMIN" | "FINANCE" | "OPERASIONAL";

export type PermissionResource = {
  module: string;
  moduleLabel: string;
  key: string;
  name: string;
  actions: PermissionAction[];
};

export const permissionActions: { key: PermissionAction; label: string }[] = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "approval", label: "Approval" },
  { key: "print", label: "Print" },
  { key: "export", label: "Export" },
];

export const permissionResources: PermissionResource[] = [
  {
    module: "DASHBOARD",
    moduleLabel: "Dashboard",
    key: "dashboard",
    name: "Dashboard",
    actions: ["view"],
  },
  {
    module: "TRANSAKSI_SEWA",
    moduleLabel: "Transaksi Sewa",
    key: "permintaan_sewa",
    name: "Permintaan Sewa",
    actions: ["view", "create", "edit", "delete", "approval", "export"],
  },
  {
    module: "TRANSAKSI_SEWA",
    moduleLabel: "Transaksi Sewa",
    key: "penawaran_sewa",
    name: "Penawaran Sewa",
    actions: ["view", "create", "edit", "delete", "approval", "print", "export"],
  },
  {
    module: "TRANSAKSI_SEWA",
    moduleLabel: "Transaksi Sewa",
    key: "kontrak_sewa",
    name: "Kontrak Sewa",
    actions: ["view", "create", "edit", "delete", "approval", "print", "export"],
  },
  {
    module: "OPERASIONAL",
    moduleLabel: "Operasional",
    key: "mobilisasi",
    name: "Mobilisasi / Demobilisasi",
    actions: ["view", "create", "edit", "delete", "print", "export"],
  },
  {
    module: "OPERASIONAL",
    moduleLabel: "Operasional",
    key: "jadwal_unit",
    name: "Jadwal Unit",
    actions: ["view", "create", "edit", "export"],
  },
  {
    module: "OPERASIONAL",
    moduleLabel: "Operasional",
    key: "timesheet",
    name: "Timesheet / Laporan Harian",
    actions: ["view", "create", "edit", "delete", "approval", "export"],
  },
  {
    module: "OPERASIONAL",
    moduleLabel: "Operasional",
    key: "bbm",
    name: "Konsumsi BBM",
    actions: ["view", "create", "edit", "delete", "export"],
  },
  {
    module: "OPERASIONAL",
    moduleLabel: "Operasional",
    key: "status_unit",
    name: "Status Unit",
    actions: ["view", "edit", "export"],
  },
  {
    module: "KEUANGAN",
    moduleLabel: "Keuangan",
    key: "invoice",
    name: "Invoice",
    actions: ["view", "create", "edit", "delete", "print", "export"],
  },
  {
    module: "KEUANGAN",
    moduleLabel: "Keuangan",
    key: "pembayaran",
    name: "Pembayaran",
    actions: ["view", "create", "edit", "delete", "print", "export"],
  },
  {
    module: "KEUANGAN",
    moduleLabel: "Keuangan",
    key: "kwitansi",
    name: "Kwitansi",
    actions: ["view", "create", "edit", "delete", "print", "export"],
  },
  {
    module: "KEUANGAN",
    moduleLabel: "Keuangan",
    key: "piutang",
    name: "Piutang",
    actions: ["view", "edit", "export"],
  },
  {
    module: "KEUANGAN",
    moduleLabel: "Keuangan",
    key: "kas_bank",
    name: "Kas & Bank",
    actions: ["view", "create", "edit", "delete", "export"],
  },
  {
    module: "MAINTENANCE",
    moduleLabel: "Maintenance",
    key: "work_order_maintenance",
    name: "Work Order Maintenance",
    actions: ["view", "create", "edit", "delete", "approval", "print", "export"],
  },
  {
    module: "MAINTENANCE",
    moduleLabel: "Maintenance",
    key: "jadwal_service",
    name: "Jadwal Service",
    actions: ["view", "create", "edit", "export"],
  },
  {
    module: "MAINTENANCE",
    moduleLabel: "Maintenance",
    key: "riwayat_maintenance",
    name: "Riwayat Maintenance",
    actions: ["view", "export"],
  },
  {
    module: "MAINTENANCE",
    moduleLabel: "Maintenance",
    key: "biaya_maintenance",
    name: "Biaya Maintenance",
    actions: ["view", "create", "edit", "export"],
  },
  {
    module: "PENJUALAN_UNIT",
    moduleLabel: "Penjualan Unit",
    key: "penjualan_unit",
    name: "Penjualan Unit",
    actions: ["view", "create", "edit", "delete", "approval", "print", "export"],
  },
  {
    module: "PENJUALAN_UNIT",
    moduleLabel: "Penjualan Unit",
    key: "hpp_unit",
    name: "HPP Unit",
    actions: ["view", "create", "edit", "print", "export"],
  },
  {
    module: "MASTER_DATA",
    moduleLabel: "Master Data",
    key: "master_unit",
    name: "Unit Alat Berat",
    actions: ["view", "create", "edit", "delete", "export"],
  },
  {
    module: "MASTER_DATA",
    moduleLabel: "Master Data",
    key: "kategori_alat",
    name: "Kategori Alat",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    module: "MASTER_DATA",
    moduleLabel: "Master Data",
    key: "tarif_sewa",
    name: "Tarif Sewa",
    actions: ["view", "create", "edit", "delete", "export"],
  },
  {
    module: "MASTER_DATA",
    moduleLabel: "Master Data",
    key: "customer",
    name: "Customer",
    actions: ["view", "create", "edit", "delete", "export"],
  },
  {
    module: "MASTER_DATA",
    moduleLabel: "Master Data",
    key: "lokasi_proyek",
    name: "Lokasi Proyek",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    module: "MASTER_DATA",
    moduleLabel: "Master Data",
    key: "operator",
    name: "Operator",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    module: "MASTER_DATA",
    moduleLabel: "Master Data",
    key: "driver",
    name: "Driver",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    module: "MASTER_DATA",
    moduleLabel: "Master Data",
    key: "supplier",
    name: "Supplier",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    module: "MASTER_DATA",
    moduleLabel: "Master Data",
    key: "sparepart",
    name: "Sparepart",
    actions: ["view", "create", "edit", "delete", "export"],
  },
  {
    module: "LAPORAN",
    moduleLabel: "Laporan",
    key: "laporan_pendapatan",
    name: "Laporan Pendapatan",
    actions: ["view", "export"],
  },
  {
    module: "LAPORAN",
    moduleLabel: "Laporan",
    key: "laporan_utilisasi_unit",
    name: "Laporan Utilisasi Unit",
    actions: ["view", "export"],
  },
  {
    module: "LAPORAN",
    moduleLabel: "Laporan",
    key: "laporan_kontrak",
    name: "Laporan Kontrak",
    actions: ["view", "export"],
  },
  {
    module: "LAPORAN",
    moduleLabel: "Laporan",
    key: "laporan_piutang",
    name: "Laporan Piutang",
    actions: ["view", "export"],
  },
  {
    module: "LAPORAN",
    moduleLabel: "Laporan",
    key: "laporan_maintenance",
    name: "Laporan Maintenance",
    actions: ["view", "export"],
  },
  {
    module: "LAPORAN",
    moduleLabel: "Laporan",
    key: "laporan_hpp_unit",
    name: "Laporan HPP Unit",
    actions: ["view", "export"],
  },
  {
    module: "PENGATURAN",
    moduleLabel: "Pengaturan",
    key: "pengguna",
    name: "Pengguna",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    module: "PENGATURAN",
    moduleLabel: "Pengaturan",
    key: "role_permission",
    name: "Role & Permission",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    module: "PENGATURAN",
    moduleLabel: "Pengaturan",
    key: "template_dokumen",
    name: "Template Dokumen",
    actions: ["view", "edit"],
  },
  {
    module: "PENGATURAN",
    moduleLabel: "Pengaturan",
    key: "audit_log",
    name: "Audit Log",
    actions: ["view", "export"],
  },
];

export const defaultRoles: {
  code: DefaultRoleCode;
  name: string;
  description: string;
}[] = [
  {
    code: "SUPER_ADMIN",
    name: "Owner",
    description: "Akses penuh ke seluruh fitur sistem.",
  },
  {
    code: "ADMIN",
    name: "Admin",
    description: "Mengelola operasional harian, master data, dan transaksi sewa.",
  },
  {
    code: "FINANCE",
    name: "Finance",
    description: "Mengelola invoice, pembayaran, piutang, kas bank, dan laporan keuangan.",
  },
  {
    code: "OPERASIONAL",
    name: "Operasional",
    description: "Mengelola unit, mobilisasi, timesheet, BBM, status unit, dan maintenance.",
  },
];

export const makePermissionCode = (resourceKey: string, action: PermissionAction) => {
  const resource = permissionResources.find((item) => item.key === resourceKey);

  if (!resource) {
    throw new Error(`Unknown permission resource: ${resourceKey}`);
  }

  return `${resource.module.toLowerCase()}.${resource.key}.${action}`;
};

export const allPermissionCodes = permissionResources.flatMap((resource) =>
  resource.actions.map((action) => makePermissionCode(resource.key, action))
);

const grant = (resourceKey: string, actions: PermissionAction[]) =>
  actions.map((action) => makePermissionCode(resourceKey, action));

const viewExport = (resourceKey: string) => grant(resourceKey, ["view", "export"]);
const viewCreateEdit = (resourceKey: string) => grant(resourceKey, ["view", "create", "edit"]);
const fullCrud = (resourceKey: string) => grant(resourceKey, ["view", "create", "edit", "delete"]);

export const defaultRolePermissionCodesByCode: Record<DefaultRoleCode, string[]> = {
  SUPER_ADMIN: allPermissionCodes,
  ADMIN: [
    ...grant("dashboard", ["view"]),
    ...grant("permintaan_sewa", ["view", "create", "edit", "delete", "approval", "export"]),
    ...grant("penawaran_sewa", ["view", "create", "edit", "delete", "approval", "print", "export"]),
    ...grant("kontrak_sewa", ["view", "create", "edit", "delete", "approval", "print", "export"]),
    ...grant("mobilisasi", ["view", "create", "edit", "delete", "print", "export"]),
    ...viewCreateEdit("jadwal_unit"),
    ...grant("timesheet", ["view", "create", "edit", "approval", "export"]),
    ...fullCrud("bbm"),
    ...grant("status_unit", ["view", "edit", "export"]),
    ...grant("invoice", ["view", "print", "export"]),
    ...grant("pembayaran", ["view", "export"]),
    ...grant("kwitansi", ["view", "print", "export"]),
    ...viewExport("piutang"),
    ...grant("kas_bank", ["view"]),
    ...grant("work_order_maintenance", ["view", "create", "edit", "delete", "approval", "print", "export"]),
    ...viewCreateEdit("jadwal_service"),
    ...viewExport("riwayat_maintenance"),
    ...viewCreateEdit("biaya_maintenance"),
    ...grant("penjualan_unit", ["view", "create", "edit", "approval", "print", "export"]),
    ...grant("hpp_unit", ["view", "create", "edit", "print", "export"]),
    ...fullCrud("master_unit"),
    ...fullCrud("kategori_alat"),
    ...fullCrud("tarif_sewa"),
    ...fullCrud("customer"),
    ...fullCrud("lokasi_proyek"),
    ...fullCrud("operator"),
    ...fullCrud("driver"),
    ...fullCrud("supplier"),
    ...fullCrud("sparepart"),
    ...viewExport("laporan_pendapatan"),
    ...viewExport("laporan_utilisasi_unit"),
    ...viewExport("laporan_kontrak"),
    ...viewExport("laporan_piutang"),
    ...viewExport("laporan_maintenance"),
    ...viewExport("laporan_hpp_unit"),
    ...viewCreateEdit("pengguna"),
    ...grant("template_dokumen", ["view", "edit"]),
    ...grant("audit_log", ["view"]),
  ],
  FINANCE: [
    ...grant("dashboard", ["view"]),
    ...grant("kontrak_sewa", ["view", "print", "export"]),
    ...grant("invoice", ["view", "create", "edit", "delete", "print", "export"]),
    ...grant("pembayaran", ["view", "create", "edit", "delete", "print", "export"]),
    ...grant("kwitansi", ["view", "create", "edit", "delete", "print", "export"]),
    ...grant("piutang", ["view", "edit", "export"]),
    ...fullCrud("kas_bank"),
    ...grant("customer", ["view", "export"]),
    ...grant("master_unit", ["view", "export"]),
    ...viewExport("laporan_pendapatan"),
    ...viewExport("laporan_piutang"),
    ...viewExport("laporan_hpp_unit"),
  ],
  OPERASIONAL: [
    ...grant("dashboard", ["view"]),
    ...grant("kontrak_sewa", ["view", "print", "export"]),
    ...grant("mobilisasi", ["view", "create", "edit", "delete", "print", "export"]),
    ...viewCreateEdit("jadwal_unit"),
    ...grant("timesheet", ["view", "create", "edit", "approval", "export"]),
    ...fullCrud("bbm"),
    ...grant("status_unit", ["view", "edit", "export"]),
    ...grant("work_order_maintenance", ["view", "create", "edit", "delete", "approval", "print", "export"]),
    ...viewCreateEdit("jadwal_service"),
    ...viewExport("riwayat_maintenance"),
    ...viewCreateEdit("biaya_maintenance"),
    ...grant("master_unit", ["view", "edit", "export"]),
    ...grant("customer", ["view"]),
    ...grant("lokasi_proyek", ["view"]),
    ...viewCreateEdit("operator"),
    ...viewCreateEdit("driver"),
    ...grant("supplier", ["view"]),
    ...viewCreateEdit("sparepart"),
    ...viewExport("laporan_utilisasi_unit"),
    ...viewExport("laporan_kontrak"),
    ...viewExport("laporan_maintenance"),
  ],
};

export const hasPermission = (permissions: string[], permission?: string) => {
  if (!permission) return true;
  return permissions.includes(permission);
};
