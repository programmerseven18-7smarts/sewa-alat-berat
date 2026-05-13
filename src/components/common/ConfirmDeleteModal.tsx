"use client";

import { Modal } from "@/components/ui/modal";

type ConfirmDeleteModalProps = {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  message?: string;
  hiddenFields?: Record<string, string | number | undefined>;
  formAction?: (formData: FormData) => void | Promise<void>;
  onClose: () => void;
};

export default function ConfirmDeleteModal({
  isOpen,
  title = "Hapus Data",
  itemName,
  message,
  hiddenFields,
  formAction,
  onClose,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      className="mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto p-0"
    >
      <form action={formAction} onSubmit={onClose} className="p-6">
        {hiddenFields &&
          Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={String(value ?? "")} />
          ))}

        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {message ||
            `Yakin ingin menghapus ${itemName ? `"${itemName}"` : "data ini"}? Data yang dihapus tidak bisa dikembalikan.`}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600"
          >
            Hapus
          </button>
        </div>
      </form>
    </Modal>
  );
}
