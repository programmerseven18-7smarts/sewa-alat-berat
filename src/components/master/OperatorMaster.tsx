"use client";

import Badge from "@/components/ui/badge/Badge";
import MasterDataTable from "@/components/master/MasterDataTable";
import {
  createOperatorAction,
  deleteOperatorAction,
  updateOperatorAction,
} from "@/lib/masters/actions";

export type OperatorUnitOption = {
  id: number;
  label: string;
};

export type OperatorRow = {
  id: number;
  kode: string;
  nama: string;
  noKtp: string | null;
  telepon: string | null;
  simType: string | null;
  simNo: string | null;
  status: string;
  unitId: number | null;
  unitLabel: string | null;
};

type OperatorMasterProps = {
  data: OperatorRow[];
  units: OperatorUnitOption[];
};

const statusOptions = [
  { value: "Aktif", label: "Aktif" },
  { value: "Nonaktif", label: "Nonaktif" },
];

export default function OperatorMaster({ data, units }: OperatorMasterProps) {
  const unitOptions = units.map((unit) => ({
    value: String(unit.id),
    label: unit.label,
  }));

  return (
    <MasterDataTable
      title="Master Operator"
      description="Kelola data operator alat berat dan unit penugasannya."
      addLabel="Tambah Operator"
      searchPlaceholder="Cari kode, nama, KTP, telepon, SIM, unit, atau status..."
      data={data}
      searchFields={["kode", "nama", "noKtp", "telepon", "simType", "simNo", "status", "unitLabel"]}
      getItemName={(item) => item.nama}
      fields={[
        { name: "kode", label: "Kode", placeholder: "OP-001" },
        { name: "nama", label: "Nama", placeholder: "Nama operator" },
        { name: "noKtp", label: "No. KTP", placeholder: "Nomor KTP" },
        { name: "telepon", label: "Telepon", placeholder: "0812..." },
        { name: "simType", label: "Tipe SIM/SIO", placeholder: "SIO / B2" },
        { name: "simNo", label: "No. SIM/SIO", placeholder: "SIO-001" },
        {
          name: "unitId",
          label: "Unit Ditugaskan",
          type: "select",
          placeholder: "Pilih unit",
          options: unitOptions,
        },
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
          header: "SIM/SIO",
          className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
          render: (item) => item.simType ? `${item.simType}${item.simNo ? ` - ${item.simNo}` : ""}` : "-",
        },
        {
          header: "Unit Ditugaskan",
          className: "text-gray-500 dark:text-gray-400",
          render: (item) => item.unitLabel || "-",
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
      createAction={createOperatorAction}
      updateAction={updateOperatorAction}
      deleteAction={deleteOperatorAction}
    />
  );
}
