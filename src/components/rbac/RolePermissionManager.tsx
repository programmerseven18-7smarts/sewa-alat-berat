"use client";

import { useMemo, useState } from "react";
import ResponsiveDataView from "@/components/common/ResponsiveDataView";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { LockIcon } from "@/icons";
import {
  makePermissionCode,
  permissionActions,
  permissionResources,
  type PermissionAction,
} from "@/lib/access-control";
import {
  resetDefaultRolePermissionsAction,
  updateRolePermissionsAction,
} from "@/lib/roles/actions";

export type RoleRow = {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string | null;
  userCount: number;
  permissionCodes: string[];
};

type RolePermissionManagerProps = {
  roles: RoleRow[];
};

const countRoleResources = (permissionCodes: string[]) =>
  new Set(permissionCodes.map((code) => code.split(".").slice(0, 2).join("."))).size;

export default function RolePermissionManager({ roles }: RolePermissionManagerProps) {
  const [permissionRole, setPermissionRole] = useState<RoleRow | null>(null);

  const selectedPermissionCodes = useMemo(
    () => new Set(permissionRole?.permissionCodes ?? []),
    [permissionRole]
  );
  const isSuperAdmin = permissionRole?.kode === "SUPER_ADMIN";

  const isChecked = (resourceKey: string, action: PermissionAction) => {
    const code = makePermissionCode(resourceKey, action);
    return isSuperAdmin || selectedPermissionCodes.has(code);
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Daftar Role
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Role dibuat ramping dulu: Owner, Admin, Finance, dan Operasional.
            </p>
          </div>
        </div>

        <ResponsiveDataView
          data={roles}
          getKey={(role) => role.id}
          getTitle={(role) => role.nama}
          emptyMessage="Belum ada role."
          minWidth={980}
          columns={[
            { header: "No", className: "text-gray-500 dark:text-gray-400", render: (_role, index) => index + 1 },
            {
              header: "Role",
              render: (role) => (
                <>
                  <p className="font-medium text-gray-800 dark:text-white/90">{role.nama}</p>
                  <p className="max-w-[420px] text-xs text-gray-500 dark:text-gray-400">{role.deskripsi || "-"}</p>
                </>
              ),
            },
            {
              header: "Kode",
              render: (role) => (
                <span className="inline-flex rounded-md bg-gray-100 px-2.5 py-1 text-theme-xs font-semibold text-gray-700 dark:bg-white/[0.06] dark:text-gray-300">
                  {role.kode}
                </span>
              ),
            },
            { header: "User", className: "font-semibold text-gray-800 dark:text-white/90", render: (role) => role.userCount },
            { header: "Resource", className: "font-semibold text-gray-800 dark:text-white/90", render: (role) => countRoleResources(role.permissionCodes) },
            {
              header: "Permission",
              render: (role) => (
                <Badge size="sm" color={role.kode === "SUPER_ADMIN" ? "error" : "success"}>
                  {role.permissionCodes.length} akses
                </Badge>
              ),
            },
            {
              header: "Aksi",
              render: (role) => (
                <button
                  type="button"
                  onClick={() => setPermissionRole(role)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                >
                  <LockIcon className="size-4" />
                  Hak Akses
                </button>
              ),
            },
          ]}
        />
      </div>

      <PermissionModal
        role={permissionRole}
        selectedPermissionCodes={selectedPermissionCodes}
        isSuperAdmin={isSuperAdmin}
        onClose={() => setPermissionRole(null)}
        isChecked={isChecked}
      />
    </>
  );
}

function PermissionModal({
  role,
  selectedPermissionCodes,
  isSuperAdmin,
  onClose,
  isChecked,
}: {
  role: RoleRow | null;
  selectedPermissionCodes: Set<string>;
  isSuperAdmin: boolean;
  onClose: () => void;
  isChecked: (resourceKey: string, action: PermissionAction) => boolean;
}) {
  return (
    <Modal
      isOpen={!!role}
      onClose={onClose}
      showCloseButton={false}
      className="mx-4 max-h-[90vh] w-full max-w-6xl overflow-hidden p-0"
    >
      <form
        action={updateRolePermissionsAction}
        onSubmit={onClose}
        className="flex max-h-[90vh] flex-col"
      >
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Kelola Hak Akses
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Role:{" "}
            <span className="font-medium text-gray-800 dark:text-white/90">
              {role?.nama}
            </span>{" "}
            <span className="font-mono text-xs text-gray-500">({role?.kode})</span>
          </p>
        </div>

        {role && <input type="hidden" name="roleId" value={role.id} />}

        <div className="max-h-[calc(90vh-160px)] overflow-auto px-6 py-5">
          {isSuperAdmin && (
            <div className="mb-4 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-300">
              SUPER_ADMIN selalu memiliki semua akses. Checklist dikunci agar akses penuh tidak terhapus.
            </div>
          )}
          <div className="space-y-4">
            {permissionResources.map((resource, index) => {
              const showModule = index === 0 || permissionResources[index - 1].module !== resource.module;

              return (
                <div key={resource.key} className="space-y-3">
                  {showModule && (
                    <div className="rounded-lg bg-gray-50 px-4 py-3 text-theme-xs font-semibold text-gray-600 dark:bg-white/[0.03] dark:text-gray-300">
                      MODUL: {resource.moduleLabel.toUpperCase()}
                    </div>
                  )}
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-white/[0.05]">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white/90">{resource.name}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                      {permissionActions.map((action) => {
                        const allowed = resource.actions.includes(action.key);
                        const permissionCode = allowed ? makePermissionCode(resource.key, action.key) : "";

                        return (
                          <label
                            key={action.key}
                            className={`flex min-h-11 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
                              allowed
                                ? "border-gray-200 text-gray-700 dark:border-gray-800 dark:text-gray-300"
                                : "border-gray-100 text-gray-300 dark:border-white/[0.04] dark:text-gray-600"
                            }`}
                          >
                            <span>{action.label}</span>
                            {allowed ? (
                              <input
                                type="checkbox"
                                name="permissionCodes"
                                value={permissionCode}
                                defaultChecked={
                                  isChecked(resource.key, action.key) ||
                                  selectedPermissionCodes.has(permissionCode)
                                }
                                disabled={isSuperAdmin}
                                className="h-5 w-5 cursor-pointer rounded-md border-gray-300 text-brand-500 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700"
                              />
                            ) : (
                              <span>-</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          {role && (
            <button
              type="submit"
              formAction={resetDefaultRolePermissionsAction}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            >
              Reset Default
            </button>
          )}
          <div className="ml-auto flex gap-3">
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
              disabled={isSuperAdmin}
            >
              Simpan Hak Akses
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
