import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";
import {
  defaultRolePermissionCodesByCode,
  defaultRoles,
  permissionResources,
} from "../src/lib/access-control";
import { hashPassword } from "../src/lib/auth/password";

neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL ?? "" }),
});

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

const createDailyReportOnce = async (data: Parameters<typeof prisma.dailyReport.create>[0]["data"]) => {
  const exists = await prisma.dailyReport.findFirst({
    where: {
      unitId: data.unitId,
      tanggal: data.tanggal,
      aktivitas: data.aktivitas,
    },
  });

  if (!exists) {
    await prisma.dailyReport.create({ data });
  }
};

const createFuelLogOnce = async (data: Parameters<typeof prisma.fuelLog.create>[0]["data"]) => {
  const exists = await prisma.fuelLog.findFirst({
    where: {
      unitId: data.unitId,
      contractId: data.contractId,
      tanggal: data.tanggal,
      supplier: data.supplier,
    },
  });

  if (!exists) {
    await prisma.fuelLog.create({ data });
  }
};

const createAuditLogOnce = async (data: Parameters<typeof prisma.auditLog.create>[0]["data"]) => {
  const exists = await prisma.auditLog.findFirst({
    where: {
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
    },
  });

  if (!exists) {
    await prisma.auditLog.create({ data });
  }
};

async function seedRbac() {
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  const permissionRows = permissionResources.flatMap((resource) =>
    resource.actions.map((action) => ({
      kode: `${resource.module.toLowerCase()}.${resource.key}.${action}`,
      modul: resource.module,
      aksi: action,
      deskripsi: `${action} ${resource.name}`,
    })),
  );

  await prisma.permission.createMany({
    data: permissionRows,
    skipDuplicates: true,
  });

  const permissions = await prisma.permission.findMany({
    select: { id: true, kode: true },
  });
  const permissionByCode = new Map(permissions.map((permission) => [permission.kode, permission.id]));

  for (const roleSeed of defaultRoles) {
    const role = await prisma.role.create({
      data: {
        kode: roleSeed.code,
        nama: roleSeed.name,
        deskripsi: roleSeed.description,
      },
    });

    const rolePermissionCodes = defaultRolePermissionCodesByCode[roleSeed.code];
    await prisma.rolePermission.createMany({
      data: rolePermissionCodes
        .map((code) => permissionByCode.get(code))
        .filter((permissionId): permissionId is number => Boolean(permissionId))
        .map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
      skipDuplicates: true,
    });
  }

  const roleByCode = new Map(
    (await prisma.role.findMany({ select: { id: true, kode: true } })).map((role) => [role.kode, role.id]),
  );

  const users = [
    {
      nama: "Owner",
      username: "owner",
      email: "owner@sewa-alat.local",
      roleCode: "SUPER_ADMIN",
      password: process.env.SEED_OWNER_PASSWORD ?? "Owner@Sewa123",
    },
    {
      nama: "Administrator",
      username: "admin",
      email: "admin@sewa-alat.local",
      roleCode: "ADMIN",
      password: process.env.SEED_ADMIN_PASSWORD ?? "Admin@Sewa123",
    },
    {
      nama: "Finance",
      username: "finance",
      email: "finance@sewa-alat.local",
      roleCode: "FINANCE",
      password: process.env.SEED_FINANCE_PASSWORD ?? "Finance@Sewa123",
    },
    {
      nama: "Operasional",
      username: "operasional",
      email: "operasional@sewa-alat.local",
      roleCode: "OPERASIONAL",
      password: process.env.SEED_OPERASIONAL_PASSWORD ?? "Operasional@Sewa123",
    },
  ] as const;

  for (const userSeed of users) {
    const roleId = roleByCode.get(userSeed.roleCode);

    if (!roleId) {
      throw new Error(`Role ${userSeed.roleCode} belum tersedia`);
    }

    const user = await prisma.user.upsert({
      where: { username: userSeed.username },
      update: {
        nama: userSeed.nama,
        email: userSeed.email,
        passwordHash: await hashPassword(userSeed.password),
        role: userSeed.roleCode,
        status: "Aktif",
      },
      create: {
        nama: userSeed.nama,
        username: userSeed.username,
        email: userSeed.email,
        passwordHash: await hashPassword(userSeed.password),
        role: userSeed.roleCode,
        status: "Aktif",
      },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId,
      },
    });
  }
}

async function seedMasters() {
  await prisma.equipmentCategory.createMany({
    data: [
      { kode: "EXC", nama: "Excavator", deskripsi: "Excavator bucket dan breaker" },
      { kode: "BLD", nama: "Bulldozer", deskripsi: "Dozer dan alat grading" },
      { kode: "DT", nama: "Dump Truck", deskripsi: "Dump truck Hino dan armada angkut" },
      { kode: "SL", nama: "Self Loader", deskripsi: "Self loader dan crane" },
      { kode: "WL", nama: "Wheel Loader", deskripsi: "Wheel loader untuk loading material" },
      { kode: "GRD", nama: "Motor Grader", deskripsi: "Grader untuk pekerjaan perataan jalan" },
      { kode: "VIB", nama: "Vibro Roller", deskripsi: "Vibro roller untuk pemadatan" },
      { kode: "TLS", nama: "Tools Additional", deskripsi: "Attachment dan perlengkapan tambahan" },
    ],
    skipDuplicates: true,
  });

  await prisma.projectLocation.createMany({
    data: [
      {
        kode: "LOC-BKS",
        nama: "Pool Bekasi",
        alamat: "Mustika Jaya, Bekasi",
        kota: "Bekasi",
        provinsi: "Jawa Barat",
        picNama: "Admin Pool",
        picTelepon: "081200000001",
      },
      {
        kode: "LOC-KAUBUN",
        nama: "Project Kaubun",
        alamat: "Kaubun",
        kota: "Kutai Timur",
        provinsi: "Kalimantan Timur",
        picNama: "Bpk. Rohmat",
        picTelepon: "081200000002",
      },
      {
        kode: "LOC-CBTG",
        nama: "Metland Cibitung",
        alamat: "Metland Cibitung",
        kota: "Bekasi",
        provinsi: "Jawa Barat",
        picNama: "Ko Jeki",
        picTelepon: "081200000003",
      },
      {
        kode: "LOC-KRW",
        nama: "Project Karawang Industrial",
        alamat: "Kawasan Industri Surya Cipta",
        kota: "Karawang",
        provinsi: "Jawa Barat",
        picNama: "Ibu Sinta",
        picTelepon: "081200000006",
      },
      {
        kode: "LOC-SNTL",
        nama: "Project Sentul Selatan",
        alamat: "Jl. Raya Sentul Selatan",
        kota: "Bogor",
        provinsi: "Jawa Barat",
        picNama: "Bpk. Dani",
        picTelepon: "081200000007",
      },
      {
        kode: "LOC-MRWL",
        nama: "Project Morowali",
        alamat: "Kawasan Industri Morowali",
        kota: "Morowali",
        provinsi: "Sulawesi Tengah",
        picNama: "Bpk. Wawan",
        picTelepon: "081200000008",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.customer.createMany({
    data: [
      {
        kode: "CUST-001",
        nama: "ADHI - ACSET, KSO",
        picNama: "Site Admin",
        telepon: "0210000001",
        email: "admin@adhi-acset.local",
        alamat: "Proyek Tol Jakarta - Cikampek II Selatan",
        kota: "Bekasi",
        npwp: "00.000.000.0-000.000",
      },
      {
        kode: "CUST-002",
        nama: "Bpk. Rohmat",
        picNama: "Rohmat",
        telepon: "081200000004",
        alamat: "Jl. Binjai, Kadungan Jaya, Kaubun",
        kota: "Kaubun",
      },
      {
        kode: "CUST-003",
        nama: "Ko Jeki",
        picNama: "Ko Jeki",
        telepon: "081200000005",
        alamat: "Metland Cikarang",
        kota: "Bekasi",
      },
      {
        kode: "CUST-004",
        nama: "PT Bumi Konstruksi Mandiri",
        picNama: "Ibu Sinta",
        telepon: "0210000004",
        email: "project@bumikonstruksi.local",
        alamat: "Kawasan Industri Surya Cipta",
        kota: "Karawang",
        npwp: "01.234.567.8-901.000",
      },
      {
        kode: "CUST-005",
        nama: "PT Nusantara Mining Service",
        picNama: "Bpk. Wawan",
        telepon: "081200000009",
        email: "ops@nusantaramining.local",
        alamat: "Kawasan Industri Morowali",
        kota: "Morowali",
        npwp: "02.345.678.9-012.000",
      },
      {
        kode: "CUST-006",
        nama: "PT Cipta Beton Nusantara",
        picNama: "Bpk. Dani",
        telepon: "0210000006",
        email: "admin@ciptabeton.local",
        alamat: "Sentul Selatan",
        kota: "Bogor",
        npwp: "03.456.789.0-123.000",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.supplier.createMany({
    data: [
      { kode: "SUP-QIU", nama: "QIU PARTS", picNama: "Sales QIU", telepon: "081300000001" },
      { kode: "SUP-SATRIA", nama: "TB. Satria Baja", picNama: "Admin Toko", telepon: "081300000002" },
      { kode: "SUP-AUTOSEAT", nama: "AUTO SEAT", picNama: "Admin", telepon: "081300000003" },
      { kode: "SUP-SOLAR", nama: "PT Solar Industri Prima", picNama: "Rani", telepon: "081300000004", email: "sales@solarprima.local" },
      { kode: "SUP-HYD", nama: "Hydraulic Center Bekasi", picNama: "Agus", telepon: "081300000005" },
      { kode: "SUP-TYRE", nama: "Jaya Ban Alat Berat", picNama: "Maman", telepon: "081300000006" },
    ],
    skipDuplicates: true,
  });

  const [categories, locations, suppliers] = await Promise.all([
    prisma.equipmentCategory.findMany(),
    prisma.projectLocation.findMany(),
    prisma.supplier.findMany(),
  ]);
  const category = Object.fromEntries(categories.map((item) => [item.kode, item]));
  const location = Object.fromEntries(locations.map((item) => [item.kode, item]));
  const supplier = Object.fromEntries(suppliers.map((item) => [item.kode, item]));

  await prisma.sparepart.createMany({
    data: [
      {
        kode: "SP-PLAT4M",
        nama: "Plat 4M",
        satuan: "LEMBAR",
        hargaSatuan: 1220000,
        stok: 4,
        supplierId: supplier["SUP-SATRIA"].id,
      },
      {
        kode: "SP-LAMPU-HINO",
        nama: "Lampu Ekor Hino 500",
        satuan: "PCS",
        hargaSatuan: 450000,
        stok: 8,
        supplierId: supplier["SUP-QIU"].id,
      },
      {
        kode: "SP-KACA-FILM",
        nama: "Kaca Film",
        satuan: "LEMBAR",
        hargaSatuan: 1100000,
        stok: 2,
        supplierId: supplier["SUP-QIU"].id,
      },
      {
        kode: "SP-FILTER-EXC",
        nama: "Filter Set Excavator PC200",
        satuan: "SET",
        hargaSatuan: 1850000,
        stok: 6,
        supplierId: supplier["SUP-QIU"].id,
      },
      {
        kode: "SP-SEAL-HYD",
        nama: "Seal Kit Hydraulic Cylinder",
        satuan: "SET",
        hargaSatuan: 2750000,
        stok: 3,
        supplierId: supplier["SUP-HYD"].id,
      },
      {
        kode: "SP-BAN-DT",
        nama: "Ban Dump Truck 11.00 R20",
        satuan: "PCS",
        hargaSatuan: 4200000,
        stok: 10,
        supplierId: supplier["SUP-TYRE"].id,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.bankAccount.createMany({
    data: [
      {
        namaBank: "Bank Mandiri",
        cabang: "Bekasi",
        noRekening: "1670007424012",
        atasNama: "DIVA KUSUMA PUTRI",
        isDefault: true,
      },
      {
        namaBank: "Bank Mandiri",
        cabang: "Samarinda",
        noRekening: "1480094747576",
        atasNama: "MAHAKAM GEMILANG MANDIRI",
        isDefault: false,
      },
      {
        namaBank: "BCA",
        cabang: "Bekasi",
        noRekening: "8899001122",
        atasNama: "PT SEWA ALAT BERAT NUSANTARA",
        isDefault: false,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.equipmentUnit.createMany({
    data: [
      {
        kodeLambung: "EXC-001",
        categoryId: category["EXC"].id,
        merk: "Komatsu",
        model: "PC 200",
        tahun: 2020,
        status: "On Duty",
        locationId: location["LOC-CBTG"].id,
        tarifHarian: 485000,
        tarifBulanan: 97000000,
        currentHm: 2350,
      },
      {
        kodeLambung: "BLD-001",
        categoryId: category["BLD"].id,
        merk: "Komatsu",
        model: "D31P",
        tahun: 2019,
        status: "Stand By",
        locationId: location["LOC-KAUBUN"].id,
        tarifHarian: 380000,
        tarifBulanan: 76000000,
        currentHm: 1840,
      },
      {
        kodeLambung: "DT-005",
        categoryId: category["DT"].id,
        merk: "Hino",
        model: "500",
        tahun: 2022,
        noChassis: "MJEFN8JN2NJX10730",
        noMesin: "J08EWDJ11192",
        status: "Maintenance",
        locationId: location["LOC-BKS"].id,
        tarifHarian: 2500000,
        tarifBulanan: 55000000,
      },
      {
        kodeLambung: "DT-009",
        categoryId: category["DT"].id,
        merk: "Hino",
        model: "500",
        tahun: 2022,
        noChassis: "MJEFM8JN1NJX39553",
        noMesin: "J08EWKJ12874",
        status: "Break Down",
        locationId: location["LOC-BKS"].id,
        tarifHarian: 2500000,
        tarifBulanan: 55000000,
      },
      {
        kodeLambung: "SL-001",
        categoryId: category["SL"].id,
        merk: "Hino",
        model: "Self Loader",
        tahun: 2021,
        status: "Stand By",
        locationId: location["LOC-BKS"].id,
        tarifHarian: 3500000,
        tarifBulanan: 70000000,
      },
      {
        kodeLambung: "EXC-002",
        categoryId: category["EXC"].id,
        merk: "Hitachi",
        model: "ZX 200",
        tahun: 2021,
        noPolisi: "B 9021 ZX",
        status: "On Duty",
        locationId: location["LOC-KRW"].id,
        tarifHarian: 510000,
        tarifBulanan: 102000000,
        currentHm: 1288,
      },
      {
        kodeLambung: "EXC-003",
        categoryId: category["EXC"].id,
        merk: "Sany",
        model: "SY215C",
        tahun: 2023,
        noPolisi: "B 9033 SY",
        status: "Stand By",
        locationId: location["LOC-BKS"].id,
        tarifHarian: 525000,
        tarifBulanan: 105000000,
        currentHm: 420,
      },
      {
        kodeLambung: "BLD-002",
        categoryId: category["BLD"].id,
        merk: "Caterpillar",
        model: "D6R",
        tahun: 2018,
        status: "On Duty",
        locationId: location["LOC-MRWL"].id,
        tarifHarian: 455000,
        tarifBulanan: 91000000,
        currentHm: 4020,
      },
      {
        kodeLambung: "WL-001",
        categoryId: category["WL"].id,
        merk: "Liugong",
        model: "856H",
        tahun: 2020,
        status: "Stand By",
        locationId: location["LOC-SNTL"].id,
        tarifHarian: 390000,
        tarifBulanan: 78000000,
        currentHm: 2110,
      },
      {
        kodeLambung: "GRD-001",
        categoryId: category["GRD"].id,
        merk: "Komatsu",
        model: "GD511A",
        tahun: 2017,
        status: "Maintenance",
        locationId: location["LOC-BKS"].id,
        tarifHarian: 430000,
        tarifBulanan: 86000000,
        currentHm: 5125,
      },
      {
        kodeLambung: "VIB-001",
        categoryId: category["VIB"].id,
        merk: "Sakai",
        model: "SV512D",
        tahun: 2021,
        status: "Stand By",
        locationId: location["LOC-KRW"].id,
        tarifHarian: 295000,
        tarifBulanan: 59000000,
        currentHm: 980,
      },
      {
        kodeLambung: "DT-010",
        categoryId: category["DT"].id,
        merk: "Hino",
        model: "500",
        tahun: 2022,
        noPolisi: "B 9010 DT",
        status: "On Duty",
        locationId: location["LOC-KRW"].id,
        tarifHarian: 2500000,
        tarifBulanan: 55000000,
        currentHm: 0,
      },
    ],
    skipDuplicates: true,
  });

  const units = await prisma.equipmentUnit.findMany();
  const unit = Object.fromEntries(units.map((item) => [item.kodeLambung, item]));

  await prisma.operator.createMany({
    data: [
      {
        kode: "OP-001",
        nama: "Anhar",
        noKtp: "3275000000000001",
        telepon: "081400000001",
        simType: "SIO",
        simNo: "SIO-001",
        status: "Aktif",
        unitId: unit["EXC-001"].id,
      },
      {
        kode: "OP-002",
        nama: "Budi",
        telepon: "081400000002",
        simType: "SIO",
        simNo: "SIO-002",
        status: "Aktif",
        unitId: unit["BLD-001"].id,
      },
      {
        kode: "OP-003",
        nama: "Slamet Riyadi",
        telepon: "081400000003",
        simType: "SIO",
        simNo: "SIO-003",
        status: "Aktif",
        unitId: unit["EXC-002"].id,
      },
      {
        kode: "OP-004",
        nama: "Yusuf Maulana",
        telepon: "081400000004",
        simType: "SIO",
        simNo: "SIO-004",
        status: "Aktif",
        unitId: unit["BLD-002"].id,
      },
      {
        kode: "OP-005",
        nama: "Hendra Saputra",
        telepon: "081400000005",
        simType: "SIO",
        simNo: "SIO-005",
        status: "Aktif",
        unitId: unit["WL-001"].id,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.driver.createMany({
    data: [
      {
        kode: "DRV-001",
        nama: "Dedi",
        noKtp: "3275000000000002",
        telepon: "081500000001",
        noSim: "B1-001",
        status: "Aktif",
      },
      {
        kode: "DRV-002",
        nama: "Rahman",
        noKtp: "3275000000000003",
        telepon: "081500000002",
        noSim: "B2-002",
        status: "Aktif",
      },
      {
        kode: "DRV-003",
        nama: "Taufik",
        noKtp: "3275000000000004",
        telepon: "081500000003",
        noSim: "B2-003",
        status: "Aktif",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.rentalRate.deleteMany();
  await prisma.rentalRate.createMany({
    data: [
      { categoryId: category["EXC"].id, nama: "Excavator Bucket", satuan: "Jam", tarif: 485000, minimum: 8 },
      { categoryId: category["EXC"].id, nama: "Excavator Breaker", satuan: "Jam", tarif: 690000, minimum: 8 },
      { categoryId: category["BLD"].id, nama: "Bulldozer D31P", satuan: "Jam", tarif: 380000, minimum: 200 },
      { categoryId: category["BLD"].id, nama: "Bulldozer D6R", satuan: "Jam", tarif: 455000, minimum: 200 },
      { categoryId: category["DT"].id, nama: "Dump Truck Hino 500", satuan: "Hari", tarif: 2500000, minimum: 1 },
      { categoryId: category["WL"].id, nama: "Wheel Loader 856H", satuan: "Jam", tarif: 390000, minimum: 8 },
      { categoryId: category["GRD"].id, nama: "Motor Grader GD511A", satuan: "Jam", tarif: 430000, minimum: 8 },
      { categoryId: category["VIB"].id, nama: "Vibro Roller SV512D", satuan: "Hari", tarif: 2950000, minimum: 1 },
    ],
  });
}

async function seedTransactions() {
  const [customers, units, operators, drivers, locations, banks] = await Promise.all([
    prisma.customer.findMany(),
    prisma.equipmentUnit.findMany(),
    prisma.operator.findMany(),
    prisma.driver.findMany(),
    prisma.projectLocation.findMany(),
    prisma.bankAccount.findMany(),
  ]);
  const customer = Object.fromEntries(customers.map((item) => [item.kode, item]));
  const unit = Object.fromEntries(units.map((item) => [item.kodeLambung, item]));
  const operator = Object.fromEntries(operators.map((item) => [item.kode, item]));
  const driver = Object.fromEntries(drivers.map((item) => [item.kode, item]));
  const location = Object.fromEntries(locations.map((item) => [item.kode, item]));
  const defaultBank = banks.find((bank) => bank.isDefault) ?? banks[0];

  await prisma.rentalRequest.createMany({
    data: [
      {
        noPermintaan: "REQ-2026-0001",
        customerId: customer["CUST-001"].id,
        tanggal: date("2026-05-01"),
        lokasi: "STA 17+750 - STA 30+750",
        jenisAlat: "Excavator PC 200",
        mulaiSewa: date("2026-05-05"),
        akhirSewa: date("2026-06-05"),
        estimasiJam: 240,
        status: "Diproses",
        catatan: "Kebutuhan bucket dan overtime.",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.quotation.createMany({
    data: [
      {
        noPenawaran: "QTN-2026-0001",
        customerId: customer["CUST-002"].id,
        tanggal: date("2026-05-03"),
        berlakuHingga: date("2026-05-17"),
        unitId: unit["BLD-001"].id,
        tarif: 380000,
        satuan: "Jam",
        estimasiTotal: 94000000,
        status: "Disetujui",
        catatan: "Minimum 200 jam / 30 hari, mob demob PP.",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.rentalContract.createMany({
    data: [
      {
        noKontrak: "KTR-2026-0001",
        customerId: customer["CUST-001"].id,
        unitId: unit["EXC-001"].id,
        operatorId: operator["OP-001"].id,
        locationId: location["LOC-CBTG"].id,
        tanggalKontrak: date("2026-05-05"),
        mulaiSewa: date("2026-05-05"),
        akhirSewa: date("2026-06-05"),
        tarif: 485000,
        satuan: "Jam",
        nilaiKontrak: 149380000,
        dp: 25000000,
        status: "Aktif",
        catatan: "Rekap pemakaian alat mengikuti timesheet operator.",
      },
    ],
    skipDuplicates: true,
  });

  const contract = await prisma.rentalContract.findUniqueOrThrow({ where: { noKontrak: "KTR-2026-0001" } });

  await prisma.invoice.createMany({
    data: [
      {
        noInvoice: "039/INV/II/2026",
        contractId: contract.id,
        customerId: customer["CUST-003"].id,
        tanggal: date("2026-02-11"),
        jatuhTempo: date("2026-02-18"),
        tipe: "Mobilisasi",
        subtotal: 1750000,
        pajak: 0,
        total: 1750000,
        status: "Belum Lunas",
        bankAccountId: defaultBank.id,
        catatan: "Mobilisasi Exca Long Arm Metland Cibitung - Metland Cikarang",
      },
    ],
    skipDuplicates: true,
  });

  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { noInvoice: "039/INV/II/2026" } });
  if ((await prisma.invoiceItem.count({ where: { invoiceId: invoice.id } })) === 0) {
    await prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        deskripsi: "Mobilisasi Exca Long Arm Metland Cibitung - Metland Cikarang",
        volume: 1,
        satuan: "Ls",
        hargaSatuan: 1750000,
        total: 1750000,
      },
    });
  }

  await prisma.payment.createMany({
    data: [
      {
        noPembayaran: "PAY-2026-0001",
        invoiceId: invoice.id,
        tanggal: date("2026-02-12"),
        jumlah: 750000,
        metode: "Transfer",
        bankAccountId: defaultBank.id,
        catatan: "DP mobilisasi.",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.receipt.createMany({
    data: [
      {
        noKwitansi: "039/KWT/II/2026",
        invoiceId: invoice.id,
        tanggal: date("2026-02-11"),
        diterimaDari: "Ko Jeki",
        untukPembayaran: "Mobilisasi Exca Long Arm Metland Cibitung - Metland Cikarang",
        jumlah: 1750000,
        terbilang: "Satu Juta Tujuh Ratus Lima Puluh Ribu Rupiah",
        bankAccountId: defaultBank.id,
        penandatangan: "Ardiles",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.mobilisasi.createMany({
    data: [
      {
        noMobilisasi: "MOB-2026-0001",
        unitId: unit["EXC-001"].id,
        driverId: driver["DRV-001"].id,
        contractId: contract.id,
        asalLokasi: "Metland Cibitung",
        tujuanLokasi: "Metland Cikarang",
        tanggalBerangkat: date("2026-02-11"),
        tanggalTiba: date("2026-02-11"),
        biayaMobilisasi: 1750000,
        biayaDemobilisasi: 0,
        status: "Selesai",
        catatan: "Foto unit berangkat dan tiba disimpan sebagai attachment.",
      },
    ],
    skipDuplicates: true,
  });

  if ((await prisma.dailyReport.count()) === 0) {
    await prisma.dailyReport.create({
      data: {
        contractId: contract.id,
        unitId: unit["EXC-001"].id,
        operatorId: operator["OP-001"].id,
        tanggal: date("2026-05-06"),
        jamKerja: 9,
        fuelLiter: 80,
        hmAwal: 2350,
        hmAkhir: 2359,
        aktivitas: "Pekerjaan galian dan loading material.",
      },
    });
  }

  if ((await prisma.fuelLog.count()) === 0) {
    await prisma.fuelLog.create({
      data: {
        unitId: unit["EXC-001"].id,
        contractId: contract.id,
        tanggal: date("2026-05-06"),
        liter: 80,
        hargaPerLiter: 6800,
        total: 544000,
        supplier: "Solar Industri",
      },
    });
  }
}

async function seedMaintenanceAndHpp() {
  const [unit, supplier] = await Promise.all([
    prisma.equipmentUnit.findUniqueOrThrow({ where: { kodeLambung: "DT-005" } }),
    prisma.supplier.findUniqueOrThrow({ where: { kode: "SUP-QIU" } }),
  ]);
  const dt009 = await prisma.equipmentUnit.findUniqueOrThrow({ where: { kodeLambung: "DT-009" } });

  await prisma.maintenanceOrder.createMany({
    data: [
      {
        noWo: "WO-2026-0001",
        unitId: unit.id,
        tipe: "Perbaikan",
        tanggalMulai: date("2026-04-01"),
        tanggalSelesai: date("2026-04-13"),
        hmService: 0,
        deskripsi: "Perbaikan body, lampu, oli, dan kaca film DT-005.",
        mekanik: "Tim Pool",
        supplierId: supplier.id,
        status: "Done",
        totalBiaya: 12936145,
      },
    ],
    skipDuplicates: true,
  });

  const maintenance = await prisma.maintenanceOrder.findUniqueOrThrow({ where: { noWo: "WO-2026-0001" } });
  if ((await prisma.maintenancePart.count({ where: { maintenanceOrderId: maintenance.id } })) === 0) {
    await prisma.maintenancePart.createMany({
      data: [
        {
          maintenanceOrderId: maintenance.id,
          namaPart: "Plat 4M",
          supplierNama: "TB. Satria Baja",
          harga: 1220000,
          qty: 2,
          satuan: "LEMBAR",
          total: 2440000,
        },
        {
          maintenanceOrderId: maintenance.id,
          namaPart: "Kaca Film",
          supplierNama: "QIU PARTS",
          harga: 1100000,
          qty: 1,
          satuan: "LEMBAR",
          total: 1100000,
        },
        {
          maintenanceOrderId: maintenance.id,
          namaPart: "Service Jok Kanan",
          supplierNama: "AUTO SEAT",
          harga: 550000,
          qty: 1,
          satuan: "PCS",
          total: 550000,
        },
      ],
    });
  }

  await prisma.unitSaleHpp.createMany({
    data: [
      {
        noLaporan: "HPP-DT005-2026",
        unitId: unit.id,
        tanggal: date("2026-04-13"),
        hppPembelian: 368725667,
        biayaPerbaikan: 12936145,
        biayaMekanik: 3000000,
        biayaCat: 1500000,
        biayaLas: 3500000,
        biayaKebersihan: 260086,
        totalHpp: 389921898,
        catatan: "Contoh dari laporan penjualan HINO DT-005.",
      },
      {
        noLaporan: "HPP-DT009-2026",
        unitId: dt009.id,
        tanggal: date("2026-04-15"),
        hppPembelian: 368725667,
        biayaPerbaikan: 16839600,
        biayaMekanik: 3000000,
        biayaCat: 1500000,
        biayaLas: 0,
        biayaKebersihan: 543652,
        totalHpp: 390608919,
        catatan: "Contoh dari laporan penjualan HINO DT-009.",
      },
    ],
    skipDuplicates: true,
  });
}

async function main() {
  await seedRbac();
  await seedMasters();
  await seedTransactions();
  await seedMaintenanceAndHpp();
  console.log("Seed data sewa alat berat selesai.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
