import type { Metadata } from "next";
import MaintenancePartMaster from "@/components/maintenance/MaintenancePartMaster";
import WorkOrderMaster from "@/components/maintenance/WorkOrderMaster";
import { requirePageAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Work Order Maintenance | Sistem Sewa Alat Berat",
};

export const dynamic = "force-dynamic";

const toDateInput = (date: Date | null) => {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

export default async function WorkOrderPage() {
  await requirePageAccess("work_order_maintenance");

  const [data, units, suppliers, parts, spareparts] = await Promise.all([
    prisma.maintenanceOrder.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        noWo: true,
        unitId: true,
        tipe: true,
        tanggalMulai: true,
        tanggalSelesai: true,
        hmService: true,
        deskripsi: true,
        mekanik: true,
        supplierId: true,
        status: true,
        totalBiaya: true,
        catatan: true,
        unit: {
          select: {
            kodeLambung: true,
            merk: true,
            model: true,
          },
        },
        supplier: {
          select: {
            nama: true,
          },
        },
        _count: {
          select: {
            maintenanceParts: true,
          },
        },
      },
    }),
    prisma.equipmentUnit.findMany({
      orderBy: { kodeLambung: "asc" },
      select: {
        id: true,
        kodeLambung: true,
        merk: true,
        model: true,
      },
    }),
    prisma.supplier.findMany({
      orderBy: { nama: "asc" },
      select: {
        id: true,
        nama: true,
      },
    }),
    prisma.maintenancePart.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        maintenanceOrderId: true,
        sparepartId: true,
        namaPart: true,
        supplierNama: true,
        harga: true,
        qty: true,
        satuan: true,
        total: true,
        fotoUrl: true,
        maintenanceOrder: {
          select: {
            noWo: true,
          },
        },
        sparepart: {
          select: {
            kode: true,
            nama: true,
          },
        },
      },
    }),
    prisma.sparepart.findMany({
      orderBy: { nama: "asc" },
      select: {
        id: true,
        kode: true,
        nama: true,
        satuan: true,
        stok: true,
        hargaSatuan: true,
      },
    }),
  ]);

  return (
    <div className="space-y-5">
      <WorkOrderMaster
        units={units.map((unit) => ({
          id: unit.id,
          label: `${unit.kodeLambung} (${unit.merk} ${unit.model})`,
        }))}
        suppliers={suppliers.map((supplier) => ({
          id: supplier.id,
          label: supplier.nama,
        }))}
        data={data.map((order) => ({
          id: order.id,
          noWo: order.noWo,
          unitId: order.unitId,
          unitLabel: `${order.unit.kodeLambung} (${order.unit.merk} ${order.unit.model})`,
          tipe: order.tipe,
          tanggalMulai: toDateInput(order.tanggalMulai),
          tanggalSelesai: toDateInput(order.tanggalSelesai),
          hmService: order.hmService != null ? Number(order.hmService) : null,
          deskripsi: order.deskripsi,
          mekanik: order.mekanik,
          supplierId: order.supplierId,
          supplierName: order.supplier?.nama ?? null,
          status: order.status,
          totalBiaya: Number(order.totalBiaya),
          catatan: order.catatan,
          partCount: order._count.maintenanceParts,
        }))}
      />

      <MaintenancePartMaster
        workOrders={data.map((order) => ({
          id: order.id,
          label: `${order.noWo} - ${order.unit.kodeLambung}`,
        }))}
        spareparts={spareparts.map((part) => ({
          id: part.id,
          label: `${part.kode} - ${part.nama} (${Number(part.stok).toLocaleString("id-ID")} ${part.satuan || ""}, ${Number(part.hargaSatuan).toLocaleString("id-ID")})`,
        }))}
        data={parts.map((part) => ({
          id: part.id,
          maintenanceOrderId: part.maintenanceOrderId,
          workOrderNo: part.maintenanceOrder.noWo,
          sparepartId: part.sparepartId,
          sparepartLabel: part.sparepart ? `${part.sparepart.kode} - ${part.sparepart.nama}` : null,
          namaPart: part.namaPart,
          supplierNama: part.supplierNama,
          harga: Number(part.harga),
          qty: Number(part.qty),
          satuan: part.satuan,
          total: Number(part.total),
          fotoUrl: part.fotoUrl,
        }))}
      />
    </div>
  );
}
