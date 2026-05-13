"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckLineIcon, ChevronDownIcon } from "@/icons";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const selectedOption = options.find((option) => option.value === selectedValue);
  const filteredOptions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return options;

    return options.filter((option) =>
      `${option.label} ${option.value}`.toLowerCase().includes(keyword)
    );
  }, [options, query]);

  const selectOption = (value: string) => {
    setSelectedValue(value);
    onChange(value);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-left text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-800 ${
          selectedOption
            ? "text-gray-800 dark:text-white/90"
            : "text-gray-400 dark:text-gray-400"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="min-w-0 truncate">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDownIcon
          className={`size-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-100 p-2 dark:border-gray-800">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari pilihan..."
              className="h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 text-sm text-gray-800 outline-hidden placeholder:text-gray-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1" role="listbox">
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => selectOption(option.value)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                role="option"
                aria-selected={option.value === selectedValue}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {option.value === selectedValue && (
                  <CheckLineIcon className="size-4 shrink-0 text-brand-500" />
                )}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <p className="px-3 py-3 text-sm text-gray-400">Pilihan tidak ditemukan</p>
            )}
          </div>
        </div>
      )}

      <select
        className="sr-only"
        tabIndex={-1}
        value={selectedValue}
        onChange={(event) => selectOption(event.target.value)}
        aria-hidden="true"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
