"use client";

import Badge from "@/components/ui/badge/Badge";
import MasterDataTable from "@/components/master/MasterDataTable";
import {
  createDriverAction,
  deleteDriverAction,
  updateDriverAction,
} from "@/lib/masters/actions";

export type DriverRow = {
  id: number;
  kode: string;
  nama: string;
  noKtp: string | null;
  telepon: string | null;
  noSim: string | null;
  status: string;
};

type DriverMasterProps = {
  data: DriverRow[];
};

const statusOptions = [
  { value: "Aktif", label: "Aktif" },
  { value: "Nonaktif", label: "Nonaktif" },
];

export default function DriverMaster({ data }: DriverMasterProps) {
  return (
    <MasterDataTable
      title="Master Driver"
      description="Kelola data driver untuk mobilisasi dan demobilisasi alat berat."
      addLabel="Tambah Driver"
      searchPlaceholder="Cari kode, nama, KTP, telepon, SIM, atau status..."
      data={data}
      searchFields={["kode", "nama", "noKtp", "telepon", "noSim", "status"]}
      getItemName={(item) => item.nama}
      fields={[
        { name: "kode", label: "Kode", placeholder: "DRV-001" },
        { name: "nama", label: "Nama", placeholder: "Nama driver" },
        { name: "noKtp", label: "No. KTP", placeholder: "Nomor KTP" },
        { name: "telepon", label: "Telepon", placeholder: "0812..." },
        { name: "noSim", label: "No. SIM", placeholder: "B1-001" },
        {
          name: "status",
          label: "Status",
          type: "select",
          placeholder: "Pilih status",
          options: statusOptions,
        },
      ]}
      columns={[
        {
          header: "Kode",
          className: "font-mono text-xs font-semibold text-brand-600 dark:text-brand-400",
          render: (item) => item.kode,
        },
        {
          header: "Nama",
          className: "font-medium text-gray-800 dark:text-white/90",
          render: (item) => item.nama,
        },
        {
          header: "No. KTP",
          className: "font-mono text-xs text-gray-500 dark:text-gray-400",
          render: (item) => item.noKtp || "-",
        },
        {
          header: "Telepon",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.telepon || "-",
        },
        {
          header: "No. SIM",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.noSim || "-",
        },
        {
          header: "Status",
          render: (item) => (
            <Badge size="sm" color={item.status === "Aktif" ? "success" : "warning"}>
              {item.status}
            </Badge>
          ),
        },
      ]}
      createAction={createDriverAction}
      updateAction={updateDriverAction}
      deleteAction={deleteDriverAction}
    />
  );
}
