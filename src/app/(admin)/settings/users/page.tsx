import type { Metadata } from "next";
import sql from "@/lib/db";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/db";

export const metadata: Metadata = { title: "Manajemen User | Sistem Sewa Alat Berat" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const data = await sql`SELECT * FROM users ORDER BY created_at DESC`;

  const roleColor = (r: string): "success" | "warning" | "error" | "info" => {
    if (r === "admin") return "error";
    if (r === "manager") return "warning";
    if (r === "finance") return "success";
    return "info";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">Manajemen User</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Kelola akun pengguna sistem</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          Tambah User
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              {["Nama", "Username", "Email", "Role", "Terdaftar", "Aksi"].map((h) => (
                <TableCell key={h} isHeader className="py-3 px-4 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap">{h}</TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {(data as Record<string, unknown>[]).map((u) => (
              <TableRow key={String(u.id)} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <TableCell className="py-3 px-4 font-medium text-gray-800 dark:text-white/90 text-theme-sm">{String(u.nama)}</TableCell>
                <TableCell className="py-3 px-4 font-mono text-xs text-brand-600 dark:text-brand-400">{String(u.username)}</TableCell>
                <TableCell className="py-3 px-4 text-gray-500 dark:text-gray-400 text-theme-sm">{String(u.email || "-")}</TableCell>
                <TableCell className="py-3 px-4"><Badge size="sm" color={roleColor(String(u.role))}>{String(u.role)}</Badge></TableCell>
                <TableCell className="py-3 px-4 text-gray-400 text-theme-sm whitespace-nowrap">{u.created_at ? formatDate(String(u.created_at)) : "-"}</TableCell>
                <TableCell className="py-3 px-4">
                  <button className="rounded p-1 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-400">{data.length} user terdaftar</p>
        </div>
      </div>
    </div>
  );
}
