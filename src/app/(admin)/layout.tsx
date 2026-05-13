import { redirect } from "next/navigation";
import AdminShell from "@/layout/AdminShell";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
