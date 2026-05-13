"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { CloseIcon, DownloadIcon, FileIcon } from "@/icons";

type FileUploadPreviewProps = {
  name: string;
  defaultValue?: string | number | null;
  accept?: string;
  placeholder?: string;
  kind?: "image" | "file";
  maxSizeMb?: number;
};

const isImageValue = (value: string) =>
  value.startsWith("data:image/") || /\.(avif|gif|jpe?g|png|webp|svg)$/i.test(value.split("?")[0]);

export default function FileUploadPreview({
  name,
  defaultValue,
  accept,
  placeholder = "Upload file",
  kind = "file",
  maxSizeMb = 2,
}: FileUploadPreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(String(defaultValue ?? ""));
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const canPreviewImage = useMemo(
    () => Boolean(value) && (kind === "image" || isImageValue(value)),
    [kind, value]
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Ukuran file maksimal ${maxSizeMb}MB.`);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setValue(String(reader.result ?? ""));
      setFileName(file.name);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const clearValue = () => {
    setValue("");
    setFileName("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={value} />

      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/60 p-3 dark:border-gray-700 dark:bg-white/[0.03]">
        {value ? (
          <div className="flex gap-3">
            {canPreviewImage ? (
              <img
                src={value}
                alt={fileName || "Preview upload"}
                className="h-20 w-24 shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
              />
            ) : (
              <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900">
                <FileIcon className="size-7" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                {fileName || (canPreviewImage ? "Gambar tersimpan" : "Dokumen tersimpan")}
              </p>
              <p className="mt-1 line-clamp-2 break-all text-xs text-gray-500 dark:text-gray-400">
                {value.startsWith("data:") ? "File disimpan dari upload lokal." : value}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex h-8 items-center rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 hover:bg-white dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                >
                  Ganti
                </button>
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-700 hover:bg-white dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                >
                  <DownloadIcon className="size-3.5" />
                  Buka
                </a>
                <button
                  type="button"
                  onClick={clearValue}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-error-200 px-3 text-xs font-semibold text-error-600 hover:bg-error-50 dark:border-error-500/30 dark:text-error-300 dark:hover:bg-error-500/10"
                >
                  <CloseIcon className="size-3" />
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex min-h-24 w-full flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-5 text-center transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500/50 dark:hover:bg-brand-500/10"
          >
            <FileIcon className="size-7 text-gray-400" />
            <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              {placeholder}
            </span>
            <span className="mt-1 text-xs text-gray-400">
              Maks. {maxSizeMb}MB
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="sr-only"
      />

      <input
        type="url"
        value={value.startsWith("data:") ? "" : value}
        onChange={(event) => {
          setValue(event.target.value);
          setFileName("");
          setError("");
        }}
        placeholder="Atau tempel URL file..."
        className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
      />

      {error && <p className="text-xs text-error-500">{error}</p>}
    </div>
  );
}
