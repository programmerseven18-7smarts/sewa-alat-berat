import SignInForm from "@/components/auth/SignInForm";
import { getCurrentUser } from "@/lib/auth/session";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Masuk | Sistem Sewa Alat Berat",
  description: "Masuk ke sistem sewa alat berat",
};

export default async function SignIn() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return <SignInForm />;
}
