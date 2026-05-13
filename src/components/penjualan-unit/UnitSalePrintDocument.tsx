import PrintPageActions from "@/components/common/PrintPageActions";
import { formatDate, formatRupiah } from "@/lib/utils";

export type UnitSalePrintData = {
  noLaporan: string;
  tanggal: Date;
  unit: {
    kodeLambung: string;
    merk: string;
    model: string;
    tahun: number | null;
    noPolisi: string | null;
    noChassis: string | null;
    noMesin: string | null;
    status: string;
    categoryName: string | null;
  };
  hppPembelian: number;
  biayaPerbaikan: number;
  biayaMekanik: number;
  biayaCat: number;
  biayaLas: number;
  biayaKebersihan: number;
  totalHpp: number;
  hargaJual: number | null;
  labaRugi: number | null;
  catatan: string | null;
};

type UnitSalePrintDocumentProps = {
  backHref: string;
  title: string;
  subtitle: string;
  report: UnitSalePrintData;
};

const costRows = [
  ["HPP Pembelian", "hppPembelian"],
  ["Biaya Perbaikan", "biayaPerbaikan"],
  ["Biaya Mekanik", "biayaMekanik"],
  ["Biaya Cat", "biayaCat"],
  ["Biaya Las", "biayaLas"],
  ["Biaya Kebersihan", "biayaKebersihan"],
] as const;

export default function UnitSalePrintDocument({
  backHref,
  title,
  subtitle,
  report,
}: UnitSalePrintDocumentProps) {
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 text-gray-800 print:bg-white print:px-0 print:py-0">
      <PrintPageActions backHref={backHref} />

      <section className="mx-auto w-full max-w-4xl bg-white p-8 shadow-sm ring-1 ring-gray-200 print:max-w-none print:p-0 print:shadow-none print:ring-0">
        <header className="flex flex-col gap-6 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-xl font-bold text-white">
              S
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Sewa Alat Berat</h1>
            <p className="mt-1 max-w-md text-sm text-gray-500">{subtitle}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{report.noLaporan}</p>
            <p className="mt-2 text-sm text-gray-500">Tanggal: {formatDate(report.tanggal)}</p>
          </div>
        </header>

        <div className="grid gap-6 border-b border-gray-200 py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Unit</p>
            <h2 className="mt-2 text-lg font-bold text-gray-900">
              {report.unit.kodeLambung} - {report.unit.merk} {report.unit.model}
            </h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>Kategori: {report.unit.categoryName || "-"}</p>
              <p>Tahun: {report.unit.tahun || "-"}</p>
              <p>Status: {report.unit.status}</p>
              <p>No. Polisi: {report.unit.noPolisi || "-"}</p>
              <p>No. Chassis: {report.unit.noChassis || "-"}</p>
              <p>No. Mesin: {report.unit.noMesin || "-"}</p>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 print:bg-white">
            <p className="text-xs font-semibold uppercase text-gray-500">Ringkasan</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total HPP</span>
                <span className="font-semibold text-gray-900">{formatRupiah(report.totalHpp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Harga Jual</span>
                <span className="font-semibold text-gray-900">
                  {report.hargaJual != null ? formatRupiah(report.hargaJual) : "-"}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="font-bold text-gray-900">Laba / Rugi</span>
                <span className={`font-bold ${(report.labaRugi ?? 0) >= 0 ? "text-success-600" : "text-error-600"}`}>
                  {report.labaRugi != null ? formatRupiah(report.labaRugi) : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto py-6">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-300 text-xs uppercase text-gray-500">
                <th className="py-3 pr-4">Komponen Biaya</th>
                <th className="py-3 text-right">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {costRows.map(([label, key]) => (
                <tr key={key} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-800">{label}</td>
                  <td className="py-3 text-right font-semibold text-gray-800">{formatRupiah(report[key])}</td>
                </tr>
              ))}
              <tr className="border-b border-gray-200">
                <td className="py-4 pr-4 text-base font-bold text-gray-900">Total HPP</td>
                <td className="py-4 text-right text-base font-bold text-gray-900">{formatRupiah(report.totalHpp)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid gap-8 border-t border-gray-200 pt-6 md:grid-cols-2">
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-800">Catatan</p>
            <p className="mt-1">{report.catatan || "-"}</p>
          </div>
          <div className="text-center text-sm text-gray-700">
            <p>Dibuat oleh,</p>
            <div className="h-24" />
            <p className="font-semibold text-gray-900">Admin</p>
          </div>
        </div>
      </section>
    </main>
  );
}
