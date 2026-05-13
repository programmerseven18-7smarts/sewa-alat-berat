"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import MasterRecordModal, {
  type MasterRecordData,
  type MasterRecordField,
} from "@/components/master/MasterRecordModal";

type MasterFormAction = (formData: FormData) => void | Promise<void>;
type MasterRecord = {
  id: number;
  [key: string]: string | number | null | undefined;
};

export type MasterDataColumn<T extends MasterRecord> = {
  header: string;
  className?: string;
  render: (item: T) => ReactNode;
};

type MasterDataTableProps<T extends MasterRecord> = {
  title: string;
  description: string;
  addLabel: string;
  searchPlaceholder: string;
  data: T[];
  columns: MasterDataColumn<T>[];
  fields: MasterRecordField[];
  searchFields: (keyof T)[];
  getItemName: (item: T) => string;
  createAction: MasterFormAction;
  updateAction: MasterFormAction;
  deleteAction: MasterFormAction;
};

const toInitialValues = <T extends MasterRecord>(item: T | null): MasterRecordData | undefined => {
  if (!item) return undefined;
  return Object.fromEntries(Object.entries(item)) as MasterRecordData;
};

export default function MasterDataTable<T extends MasterRecord>({
  title,
  description,
  addLabel,
  searchPlaceholder,
  data,
  columns,
  fields,
  searchFields,
  getItemName,
  createAction,
  updateAction,
  deleteAction,
}: MasterDataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [deleteItem, setDeleteItem] = useState<T | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filteredData = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return data;

    return data.filter((item) =>
      searchFields.some((field) =>
        String(item[field] ?? "").toLowerCase().includes(keyword)
      )
    );
  }, [data, query, searchFields]);

  const openCreate = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const openEdit = (item: T) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 border-b border-gray-100 p-4 dark:border-gray-800 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 lg:w-auto"
        >
          <PlusIcon className="size-4" />
          {addLabel}
        </button>
      </div>

      <div className="border-b border-gray-100 p-4 dark:border-gray-800 sm:p-6">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>
      </div>

      <div className="space-y-3 p-4 dark:border-gray-800 sm:p-6 lg:hidden">
        {filteredData.map((item, index) => (
          <article
            key={item.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-gray-100 pb-3 dark:border-gray-800">
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">No {index + 1}</p>
                <h4 className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
                  {getItemName(item)}
                </h4>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-brand-50 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-brand-500/10"
                  aria-label={`Edit ${getItemName(item)}`}
                >
                  <PencilIcon className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteItem(item)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10"
                  aria-label={`Hapus ${getItemName(item)}`}
                >
                  <TrashBinIcon className="size-4" />
                </button>
              </div>
            </div>

            <dl className="space-y-3">
              {columns.map((column) => (
                <div key={column.header} className="grid grid-cols-[112px_1fr] gap-3">
                  <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">{column.header}</dt>
                  <dd className={`min-w-0 break-words text-sm text-gray-700 dark:text-gray-300 ${column.className || ""} whitespace-normal`}>
                    {column.render(item)}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
        {filteredData.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400 dark:border-gray-800">
            Data tidak ditemukan
          </div>
        )}
      </div>

      <div className="hidden max-w-full overflow-x-auto lg:block">
        <div className="min-w-[860px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  No
                </TableCell>
                {columns.map((column) => (
                  <TableCell
                    key={column.header}
                    isHeader
                    className={`px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 ${column.className || ""}`}
                  >
                    {column.header}
                  </TableCell>
                ))}
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Aksi
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredData.map((item, index) => (
                <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                    {index + 1}
                  </TableCell>
                  {columns.map((column) => (
                    <TableCell key={column.header} className={`px-5 py-4 text-theme-sm ${column.className || ""}`}>
                      {column.render(item)}
                    </TableCell>
                  ))}
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded p-2 text-gray-500 hover:bg-brand-50 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-brand-500/10"
                        aria-label={`Edit ${getItemName(item)}`}
                      >
                        <PencilIcon className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteItem(item)}
                        className="rounded p-2 text-gray-500 hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10"
                        aria-label={`Hapus ${getItemName(item)}`}
                      >
                        <TrashBinIcon className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="px-5 py-10 text-center text-sm text-gray-400">
                    Data tidak ditemukan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="border-t border-gray-100 p-4 dark:border-gray-800 sm:p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Menampilkan {filteredData.length} dari {data.length} data
        </p>
      </div>

      <MasterRecordModal
        key={`${selectedItem?.id || "new"}-${isFormOpen ? "open" : "closed"}`}
        isOpen={isFormOpen}
        title={selectedItem ? `Edit ${title}` : addLabel}
        description="Perubahan akan langsung digunakan oleh modul terkait."
        fields={fields}
        initialValues={toInitialValues(selectedItem)}
        hiddenFields={selectedItem ? { id: selectedItem.id } : undefined}
        formAction={selectedItem ? updateAction : createAction}
        onClose={closeForm}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteItem}
        itemName={deleteItem ? getItemName(deleteItem) : undefined}
        hiddenFields={{ id: deleteItem?.id }}
        formAction={deleteAction}
        onClose={() => setDeleteItem(null)}
      />
    </div>
  );
}
