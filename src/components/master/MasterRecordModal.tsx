"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import DatePicker from "@/components/form/date-picker";
import FileUploadPreview from "@/components/form/FileUploadPreview";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";

type FieldType = "text" | "number" | "email" | "date" | "select" | "image" | "file";

export type MasterRecordField = {
  name: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  accept?: string;
  colSpan?: "full";
  readOnly?: boolean;
};

export type MasterRecordValue = string | number | undefined | null;
export type MasterRecordData = Record<string, MasterRecordValue>;

type MasterRecordModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  fields: MasterRecordField[];
  initialValues?: MasterRecordData;
  hiddenFields?: Record<string, MasterRecordValue>;
  formAction?: (formData: FormData) => void | Promise<void>;
  onClose: () => void;
};

export default function MasterRecordModal({
  isOpen,
  title,
  description,
  fields,
  initialValues,
  hiddenFields,
  formAction,
  onClose,
}: MasterRecordModalProps) {
  const initialSelectValues = useMemo(() => {
    return fields.reduce<Record<string, string>>((acc, field) => {
      if (field.type === "select") {
        acc[field.name] = String(initialValues?.[field.name] ?? "");
      }
      return acc;
    }, {});
  }, [fields, initialValues]);

  const [selectValues, setSelectValues] = useState(initialSelectValues);

  useEffect(() => {
    setSelectValues(initialSelectValues);
  }, [initialSelectValues]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!formAction) {
      event.preventDefault();
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      className="mx-4 max-h-[90vh] w-full max-w-3xl overflow-hidden p-0"
    >
      <form action={formAction} onSubmit={handleSubmit} className="flex max-h-[90vh] flex-col">
        {hiddenFields &&
          Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={String(value ?? "")} />
          ))}

        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className={field.colSpan === "full" ? "md:col-span-2" : ""}>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <>
                    <Select
                      options={field.options || []}
                      placeholder={field.placeholder || `Pilih ${field.label.toLowerCase()}`}
                      defaultValue={selectValues[field.name] || ""}
                      onChange={(value) =>
                        setSelectValues((current) => ({ ...current, [field.name]: value }))
                      }
                    />
                    <input type="hidden" name={field.name} value={selectValues[field.name] || ""} />
                  </>
                ) : field.type === "date" ? (
                  <DatePicker
                    id={`modal-${field.name}`}
                    name={field.name}
                    placeholder={field.placeholder || "Pilih tanggal"}
                    defaultDate={String(initialValues?.[field.name] ?? "")}
                  />
                ) : field.type === "image" || field.type === "file" ? (
                  <FileUploadPreview
                    name={field.name}
                    kind={field.type}
                    accept={field.accept || (field.type === "image" ? "image/*" : undefined)}
                    placeholder={field.placeholder || (field.type === "image" ? "Upload gambar" : "Upload dokumen")}
                    defaultValue={initialValues?.[field.name]}
                  />
                ) : (
                  <Input
                    name={field.name}
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    defaultValue={initialValues?.[field.name] ?? undefined}
                    readOnly={field.readOnly}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Simpan
          </button>
        </div>
      </form>
    </Modal>
  );
}
