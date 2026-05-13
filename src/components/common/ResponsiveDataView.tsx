import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

type ResponsiveDataColumn<T> = {
  header: string;
  className?: string;
  render: (item: T, index: number) => ReactNode;
};

type ResponsiveDataViewProps<T> = {
  data: T[];
  columns: ResponsiveDataColumn<T>[];
  getKey: (item: T, index: number) => string | number;
  getTitle: (item: T, index: number) => ReactNode;
  emptyMessage: string;
  minWidth?: number;
  footer?: ReactNode;
};

export default function ResponsiveDataView<T>({
  data,
  columns,
  getKey,
  getTitle,
  emptyMessage,
  minWidth = 860,
  footer,
}: ResponsiveDataViewProps<T>) {
  return (
    <>
      <div className="space-y-3 p-4 lg:hidden">
        {data.map((item, index) => (
          <article
            key={getKey(item, index)}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className="mb-3 border-b border-gray-100 pb-3 dark:border-gray-800">
              <p className="text-xs font-medium uppercase text-gray-400">Data {index + 1}</p>
              <div className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
                {getTitle(item, index)}
              </div>
            </div>
            <dl className="space-y-3">
              {columns.map((column) => (
                <div key={column.header} className="grid grid-cols-[112px_1fr] gap-3">
                  <dt className="text-xs font-medium text-gray-400 dark:text-gray-500">{column.header}</dt>
                  <dd className={`min-w-0 break-words text-sm text-gray-700 dark:text-gray-300 ${column.className || ""} whitespace-normal`}>
                    {column.render(item, index)}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
        {data.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400 dark:border-gray-800">
            {emptyMessage}
          </div>
        )}
      </div>

      <div className="hidden max-w-full overflow-x-auto lg:block">
        <div style={{ minWidth }}>
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.header}
                    isHeader
                    className={`px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400 ${column.className || ""}`}
                  >
                    {column.header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.map((item, index) => (
                <TableRow key={getKey(item, index)} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  {columns.map((column) => (
                    <TableCell key={column.header} className={`px-4 py-3 text-theme-sm ${column.className || ""}`}>
                      {column.render(item, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="px-4 py-10 text-center text-sm text-gray-400">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {footer}
    </>
  );
}
