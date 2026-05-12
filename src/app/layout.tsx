import type { Metadata } from "next";
import { Outfit } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Sistem Sewa Alat Berat", template: "%s | Sewa Alat Berat" },
  description: "Sistem manajemen operasional penyewaan alat berat - monitoring unit, kontrak, invoice, dan maintenance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="bg-gray-50 dark:bg-gray-900">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
