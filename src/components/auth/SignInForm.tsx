"use client";

import { useActionState, useState } from "react";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon, InfoIcon } from "@/icons";
import { signInAction } from "@/lib/auth/actions";

const initialState = {
  error: undefined,
  email: undefined,
};

const demoAccounts = [
  { role: "Owner", email: "owner@sewa-alat.local", password: "Owner@Sewa123" },
  { role: "Admin", email: "admin@sewa-alat.local", password: "Admin@Sewa123" },
  { role: "Finance", email: "finance@sewa-alat.local", password: "Finance@Sewa123" },
  { role: "Operasional", email: "operasional@sewa-alat.local", password: "Operasional@Sewa123" },
];

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [remember, setRemember] = useState(false);
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <div className="w-full max-w-[460px]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-500">
              <span className="text-2xl font-bold text-white">S</span>
            </div>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Masuk ke Sewa Alat
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gunakan akun yang sudah terdaftar untuk mengakses dashboard.
            </p>
          </div>

          <form action={formAction}>
            <div className="space-y-6">
              {state.error && (
                <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm font-medium text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
                  {state.error}
                </div>
              )}

              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  name="email"
                  placeholder="owner@sewa-alat.local"
                  type="email"
                  defaultValue={state.email}
                  disabled={isPending}
                />
              </div>

              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                    aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={remember} onChange={setRemember} disabled={isPending} />
                  {remember && <input type="hidden" name="remember" value="on" />}
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Ingat saya
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
              >
                {isPending ? "Memproses..." : "Masuk"}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setShowDemoAccounts((current) => !current)}
              className="mx-auto flex items-center gap-2 text-sm font-medium text-brand-500 hover:text-brand-600"
              aria-expanded={showDemoAccounts}
            >
              <InfoIcon className="size-5" />
              Akun demo
            </button>

            {showDemoAccounts && (
              <div className="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-white/[0.04]">
                <p className="mb-3 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  User dan password demo
                </p>
                <div className="space-y-3">
                  {demoAccounts.map((account) => (
                    <div key={account.email} className="grid grid-cols-[90px_1fr] gap-3 text-sm">
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {account.role}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {account.email} / {account.password}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
