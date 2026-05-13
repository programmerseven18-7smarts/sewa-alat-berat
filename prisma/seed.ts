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

const createBankAccountOnce = async (data: {
  namaBank: string;
  cabang?: string;
  noRekening: string;
  atasNama: string;
  isDefault?: boolean;
}) => {
  const exists = await prisma.bankAccount.findFirst({
    where: { noRekening: data.noRekening },
  });

  if (!exists) {
    await prisma.bankAccount.create({ data });
  }
};

const createAttachmentOnce = async (data: Parameters<typeof prisma.attachment.create>[0]["data"]) => {
  const exists = await prisma.attachment.findFirst({
    where: {
      entityType: data.entityType,
      entityId: data.entityId,
      fileName: data.fileName,
    },
  });

  if (!exists) {
    await prisma.attachment.create({ data });
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

  for (const bankAccount of [
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
  ]) {
    await createBankAccountOnce(bankAccount);
  }

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

async function seedExpandedMasters() {
  await prisma.projectLocation.createMany({
    data: [
      {
        kode: "LOC-SMR",
        nama: "Project Samarinda Ring Road",
        alamat: "Jl. Ring Road Samarinda",
        kota: "Samarinda",
        provinsi: "Kalimantan Timur",
        picNama: "Bpk. Arif",
        picTelepon: "081200000010",
      },
      {
        kode: "LOC-BPN",
        nama: "Project Balikpapan Quarry",
        alamat: "Karang Joang",
        kota: "Balikpapan",
        provinsi: "Kalimantan Timur",
        picNama: "Ibu Maya",
        picTelepon: "081200000011",
      },
      {
        kode: "LOC-IKN",
        nama: "Project IKN Infrastruktur",
        alamat: "Sepaku",
        kota: "Penajam Paser Utara",
        provinsi: "Kalimantan Timur",
        picNama: "Bpk. Raka",
        picTelepon: "081200000012",
      },
      {
        kode: "LOC-PLB",
        nama: "Project Pelabuhan Patimban",
        alamat: "Patimban",
        kota: "Subang",
        provinsi: "Jawa Barat",
        picNama: "Ibu Lestari",
        picTelepon: "081200000013",
      },
      {
        kode: "LOC-BDG",
        nama: "Project Bandung Timur",
        alamat: "Gedebage",
        kota: "Bandung",
        provinsi: "Jawa Barat",
        picNama: "Bpk. Rangga",
        picTelepon: "081200000014",
      },
      {
        kode: "LOC-TGR",
        nama: "Project Tangerang Warehouse",
        alamat: "Cikupa",
        kota: "Tangerang",
        provinsi: "Banten",
        picNama: "Ibu Nabila",
        picTelepon: "081200000015",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.customer.createMany({
    data: [
      {
        kode: "CUST-007",
        nama: "PT Kalimantan Prima Infrastruktur",
        picNama: "Bpk. Arif",
        telepon: "0541000007",
        email: "site@kalprimainfra.local",
        alamat: "Samarinda",
        kota: "Samarinda",
        npwp: "04.567.890.1-234.000",
      },
      {
        kode: "CUST-008",
        nama: "PT Karya Quarry Balikpapan",
        picNama: "Ibu Maya",
        telepon: "0542000008",
        email: "admin@karyaquarry.local",
        alamat: "Karang Joang",
        kota: "Balikpapan",
        npwp: "05.678.901.2-345.000",
      },
      {
        kode: "CUST-009",
        nama: "PT Mandiri Beton Perkasa",
        picNama: "Bpk. Hadi",
        telepon: "0220000009",
        email: "finance@mandiribeton.local",
        alamat: "Gedebage",
        kota: "Bandung",
        npwp: "06.789.012.3-456.000",
      },
      {
        kode: "CUST-010",
        nama: "PT Pelabuhan Subang Raya",
        picNama: "Ibu Lestari",
        telepon: "0260000010",
        email: "ops@pelabuhansubang.local",
        alamat: "Patimban",
        kota: "Subang",
        npwp: "07.890.123.4-567.000",
      },
      {
        kode: "CUST-011",
        nama: "PT Citra Gudang Logistik",
        picNama: "Ibu Nabila",
        telepon: "0210000011",
        email: "project@citragudang.local",
        alamat: "Cikupa",
        kota: "Tangerang",
        npwp: "08.901.234.5-678.000",
      },
      {
        kode: "CUST-012",
        nama: "PT IKN Konstruksi Nusantara",
        picNama: "Bpk. Raka",
        telepon: "0543000012",
        email: "admin@iknkonstruksi.local",
        alamat: "Sepaku",
        kota: "Penajam Paser Utara",
        npwp: "09.012.345.6-789.000",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.supplier.createMany({
    data: [
      { kode: "SUP-FILTER", nama: "Prima Filter Nusantara", picNama: "Herman", telepon: "081300000007" },
      { kode: "SUP-OIL", nama: "Mega Oli Diesel", picNama: "Sari", telepon: "081300000008", email: "sales@megaoli.local" },
      { kode: "SUP-BATTERY", nama: "Aki Jaya Mandiri", picNama: "Bambang", telepon: "081300000009" },
      { kode: "SUP-TRACK", nama: "Track Shoe Specialist", picNama: "Rudi", telepon: "081300000010" },
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
      { kode: "SP-OIL-15W40", nama: "Engine Oil 15W-40", satuan: "PAIL", hargaSatuan: 1650000, stok: 12, supplierId: supplier["SUP-OIL"].id },
      { kode: "SP-HYD-68", nama: "Hydraulic Oil AW 68", satuan: "DRUM", hargaSatuan: 5850000, stok: 5, supplierId: supplier["SUP-OIL"].id },
      { kode: "SP-GREASE", nama: "Grease EP2", satuan: "PAIL", hargaSatuan: 890000, stok: 9, supplierId: supplier["SUP-OIL"].id },
      { kode: "SP-AKI-150", nama: "Battery N150", satuan: "PCS", hargaSatuan: 2350000, stok: 6, supplierId: supplier["SUP-BATTERY"].id },
      { kode: "SP-TRACK-PC200", nama: "Track Shoe PC200", satuan: "PCS", hargaSatuan: 1450000, stok: 28, supplierId: supplier["SUP-TRACK"].id },
      { kode: "SP-CUTTING-EDGE", nama: "Cutting Edge Dozer", satuan: "SET", hargaSatuan: 7200000, stok: 3, supplierId: supplier["SUP-TRACK"].id },
      { kode: "SP-AIR-FILTER", nama: "Air Filter Heavy Duty", satuan: "PCS", hargaSatuan: 680000, stok: 14, supplierId: supplier["SUP-FILTER"].id },
      { kode: "SP-FUEL-FILTER", nama: "Fuel Filter Heavy Duty", satuan: "PCS", hargaSatuan: 520000, stok: 16, supplierId: supplier["SUP-FILTER"].id },
    ],
    skipDuplicates: true,
  });

  for (const bankAccount of [
    { namaBank: "BRI", cabang: "Samarinda", noRekening: "112233445566", atasNama: "PT SEWA ALAT BERAT NUSANTARA", isDefault: false },
    { namaBank: "BNI", cabang: "Balikpapan", noRekening: "998877665544", atasNama: "PT SEWA ALAT BERAT NUSANTARA", isDefault: false },
  ]) {
    await createBankAccountOnce(bankAccount);
  }

  await prisma.equipmentUnit.createMany({
    data: [
      { kodeLambung: "EXC-004", categoryId: category["EXC"].id, merk: "Komatsu", model: "PC 210-10M0", tahun: 2022, status: "On Duty", locationId: location["LOC-SMR"].id, tarifHarian: 535000, tarifBulanan: 107000000, currentHm: 940 },
      { kodeLambung: "EXC-005", categoryId: category["EXC"].id, merk: "Kobelco", model: "SK200-10", tahun: 2021, status: "Stand By", locationId: location["LOC-BPN"].id, tarifHarian: 500000, tarifBulanan: 100000000, currentHm: 1680 },
      { kodeLambung: "BLD-003", categoryId: category["BLD"].id, merk: "Komatsu", model: "D65PX", tahun: 2020, status: "On Duty", locationId: location["LOC-IKN"].id, tarifHarian: 520000, tarifBulanan: 104000000, currentHm: 2985 },
      { kodeLambung: "DT-011", categoryId: category["DT"].id, merk: "Hino", model: "500 FM 260 JD", tahun: 2023, noPolisi: "B 9011 DT", status: "On Duty", locationId: location["LOC-PLB"].id, tarifHarian: 2650000, tarifBulanan: 58500000, currentHm: 0 },
      { kodeLambung: "DT-012", categoryId: category["DT"].id, merk: "Mitsubishi", model: "Fuso FN 527", tahun: 2021, noPolisi: "B 9012 DT", status: "Stand By", locationId: location["LOC-BKS"].id, tarifHarian: 2450000, tarifBulanan: 54000000, currentHm: 0 },
      { kodeLambung: "WL-002", categoryId: category["WL"].id, merk: "XCMG", model: "LW500KN", tahun: 2022, status: "On Duty", locationId: location["LOC-BDG"].id, tarifHarian: 410000, tarifBulanan: 82000000, currentHm: 760 },
      { kodeLambung: "GRD-002", categoryId: category["GRD"].id, merk: "Caterpillar", model: "140K", tahun: 2019, status: "Stand By", locationId: location["LOC-TGR"].id, tarifHarian: 470000, tarifBulanan: 94000000, currentHm: 3230 },
      { kodeLambung: "VIB-002", categoryId: category["VIB"].id, merk: "Dynapac", model: "CA250D", tahun: 2020, status: "On Duty", locationId: location["LOC-PLB"].id, tarifHarian: 3100000, tarifBulanan: 62000000, currentHm: 1420 },
      { kodeLambung: "SL-002", categoryId: category["SL"].id, merk: "Isuzu", model: "Giga Self Loader", tahun: 2022, noPolisi: "B 9202 SL", status: "Stand By", locationId: location["LOC-BKS"].id, tarifHarian: 3600000, tarifBulanan: 72000000, currentHm: 0 },
    ],
    skipDuplicates: true,
  });

  const units = await prisma.equipmentUnit.findMany();
  const unit = Object.fromEntries(units.map((item) => [item.kodeLambung, item]));

  await prisma.operator.createMany({
    data: [
      { kode: "OP-006", nama: "Agus Firmansyah", telepon: "081400000006", simType: "SIO", simNo: "SIO-006", status: "Aktif", unitId: unit["EXC-004"].id },
      { kode: "OP-007", nama: "Mulyadi", telepon: "081400000007", simType: "SIO", simNo: "SIO-007", status: "Aktif", unitId: unit["BLD-003"].id },
      { kode: "OP-008", nama: "Eko Prasetyo", telepon: "081400000008", simType: "SIO", simNo: "SIO-008", status: "Aktif", unitId: unit["WL-002"].id },
      { kode: "OP-009", nama: "Ridwan Hakim", telepon: "081400000009", simType: "SIO", simNo: "SIO-009", status: "Cuti", unitId: unit["GRD-002"].id },
      { kode: "OP-010", nama: "Fajar Nugroho", telepon: "081400000010", simType: "SIO", simNo: "SIO-010", status: "Aktif", unitId: unit["VIB-002"].id },
    ],
    skipDuplicates: true,
  });

  await prisma.driver.createMany({
    data: [
      { kode: "DRV-004", nama: "Suryanto", noKtp: "3275000000000005", telepon: "081500000004", noSim: "B2-004", status: "Aktif" },
      { kode: "DRV-005", nama: "Asep Suhendar", noKtp: "3275000000000006", telepon: "081500000005", noSim: "B2-005", status: "Aktif" },
      { kode: "DRV-006", nama: "Junaedi", noKtp: "3275000000000007", telepon: "081500000006", noSim: "B2-006", status: "Stand By" },
    ],
    skipDuplicates: true,
  });

  await prisma.rentalRate.createMany({
    data: [
      { categoryId: category["EXC"].id, nama: "Excavator PC210", satuan: "Jam", tarif: 535000, minimum: 8 },
      { categoryId: category["EXC"].id, nama: "Excavator SK200", satuan: "Jam", tarif: 500000, minimum: 8 },
      { categoryId: category["BLD"].id, nama: "Bulldozer D65PX", satuan: "Jam", tarif: 520000, minimum: 200 },
      { categoryId: category["DT"].id, nama: "Dump Truck FM 260 JD", satuan: "Hari", tarif: 2650000, minimum: 1 },
      { categoryId: category["WL"].id, nama: "Wheel Loader LW500KN", satuan: "Jam", tarif: 410000, minimum: 8 },
      { categoryId: category["GRD"].id, nama: "Motor Grader 140K", satuan: "Jam", tarif: 470000, minimum: 8 },
      { categoryId: category["SL"].id, nama: "Self Loader Giga", satuan: "Trip", tarif: 3600000, minimum: 1 },
    ],
  });
}

async function seedExpandedTransactions() {
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
      { noPermintaan: "REQ-2026-0002", customerId: customer["CUST-004"].id, tanggal: date("2026-05-04"), lokasi: "Karawang Industrial", jenisAlat: "Excavator ZX 200", mulaiSewa: date("2026-05-08"), akhirSewa: date("2026-06-08"), estimasiJam: 220, status: "Disetujui", catatan: "Termasuk operator dan solar by customer." },
      { noPermintaan: "REQ-2026-0003", customerId: customer["CUST-005"].id, tanggal: date("2026-05-05"), lokasi: "Morowali", jenisAlat: "Bulldozer D6R", mulaiSewa: date("2026-05-10"), akhirSewa: date("2026-08-10"), estimasiJam: 600, status: "Diproses", catatan: "Lokasi tambang, butuh unit siap kerja." },
      { noPermintaan: "REQ-2026-0004", customerId: customer["CUST-007"].id, tanggal: date("2026-05-06"), lokasi: "Samarinda Ring Road", jenisAlat: "Excavator PC210", mulaiSewa: date("2026-05-12"), akhirSewa: date("2026-07-12"), estimasiJam: 420, status: "Disetujui", catatan: "Pekerjaan drainase dan galian." },
      { noPermintaan: "REQ-2026-0005", customerId: customer["CUST-008"].id, tanggal: date("2026-05-07"), lokasi: "Balikpapan Quarry", jenisAlat: "Excavator SK200", mulaiSewa: date("2026-05-14"), akhirSewa: date("2026-06-14"), estimasiJam: 260, status: "Pending", catatan: "Menunggu final PO." },
      { noPermintaan: "REQ-2026-0006", customerId: customer["CUST-010"].id, tanggal: date("2026-05-08"), lokasi: "Patimban", jenisAlat: "Dump Truck dan Vibro", mulaiSewa: date("2026-05-15"), akhirSewa: date("2026-07-15"), estimasiJam: 360, status: "Disetujui", catatan: "Butuh ritase harian." },
      { noPermintaan: "REQ-2026-0007", customerId: customer["CUST-012"].id, tanggal: date("2026-05-09"), lokasi: "IKN Sepaku", jenisAlat: "Bulldozer D65PX", mulaiSewa: date("2026-05-18"), akhirSewa: date("2026-09-18"), estimasiJam: 820, status: "Diproses", catatan: "Kontrak jangka panjang." },
    ],
    skipDuplicates: true,
  });

  await prisma.quotation.createMany({
    data: [
      { noPenawaran: "QTN-2026-0002", customerId: customer["CUST-004"].id, tanggal: date("2026-05-04"), berlakuHingga: date("2026-05-18"), unitId: unit["EXC-002"].id, tarif: 510000, satuan: "Jam", estimasiTotal: 112200000, status: "Disetujui", catatan: "Minimum 220 jam." },
      { noPenawaran: "QTN-2026-0003", customerId: customer["CUST-005"].id, tanggal: date("2026-05-05"), berlakuHingga: date("2026-05-19"), unitId: unit["BLD-002"].id, tarif: 455000, satuan: "Jam", estimasiTotal: 273000000, status: "Terkirim", catatan: "Mobilisasi Morowali dihitung terpisah." },
      { noPenawaran: "QTN-2026-0004", customerId: customer["CUST-007"].id, tanggal: date("2026-05-06"), berlakuHingga: date("2026-05-20"), unitId: unit["EXC-004"].id, tarif: 535000, satuan: "Jam", estimasiTotal: 224700000, status: "Disetujui", catatan: "Termasuk operator." },
      { noPenawaran: "QTN-2026-0005", customerId: customer["CUST-010"].id, tanggal: date("2026-05-08"), berlakuHingga: date("2026-05-22"), unitId: unit["DT-011"].id, tarif: 2650000, satuan: "Hari", estimasiTotal: 159000000, status: "Disetujui", catatan: "Ritase internal area project." },
      { noPenawaran: "QTN-2026-0006", customerId: customer["CUST-012"].id, tanggal: date("2026-05-09"), berlakuHingga: date("2026-05-23"), unitId: unit["BLD-003"].id, tarif: 520000, satuan: "Jam", estimasiTotal: 426400000, status: "Terkirim", catatan: "Minimum 820 jam." },
    ],
    skipDuplicates: true,
  });

  await prisma.rentalContract.createMany({
    data: [
      { noKontrak: "KTR-2026-0002", customerId: customer["CUST-004"].id, unitId: unit["EXC-002"].id, operatorId: operator["OP-003"].id, locationId: location["LOC-KRW"].id, tanggalKontrak: date("2026-05-08"), mulaiSewa: date("2026-05-08"), akhirSewa: date("2026-06-08"), tarif: 510000, satuan: "Jam", nilaiKontrak: 112200000, dp: 20000000, status: "Aktif", catatan: "Shift normal 8 jam." },
      { noKontrak: "KTR-2026-0003", customerId: customer["CUST-005"].id, unitId: unit["BLD-002"].id, operatorId: operator["OP-004"].id, locationId: location["LOC-MRWL"].id, tanggalKontrak: date("2026-05-10"), mulaiSewa: date("2026-05-10"), akhirSewa: date("2026-08-10"), tarif: 455000, satuan: "Jam", nilaiKontrak: 273000000, dp: 50000000, status: "Aktif", catatan: "Unit standby di site Morowali." },
      { noKontrak: "KTR-2026-0004", customerId: customer["CUST-007"].id, unitId: unit["EXC-004"].id, operatorId: operator["OP-006"].id, locationId: location["LOC-SMR"].id, tanggalKontrak: date("2026-05-12"), mulaiSewa: date("2026-05-12"), akhirSewa: date("2026-07-12"), tarif: 535000, satuan: "Jam", nilaiKontrak: 224700000, dp: 35000000, status: "Aktif", catatan: "Pekerjaan drainase ring road." },
      { noKontrak: "KTR-2026-0005", customerId: customer["CUST-010"].id, unitId: unit["DT-011"].id, locationId: location["LOC-PLB"].id, tanggalKontrak: date("2026-05-15"), mulaiSewa: date("2026-05-15"), akhirSewa: date("2026-07-15"), tarif: 2650000, satuan: "Hari", nilaiKontrak: 159000000, dp: 30000000, status: "Aktif", catatan: "Dump truck untuk pemindahan material." },
      { noKontrak: "KTR-2026-0006", customerId: customer["CUST-010"].id, unitId: unit["VIB-002"].id, operatorId: operator["OP-010"].id, locationId: location["LOC-PLB"].id, tanggalKontrak: date("2026-05-15"), mulaiSewa: date("2026-05-15"), akhirSewa: date("2026-07-15"), tarif: 3100000, satuan: "Hari", nilaiKontrak: 186000000, dp: 30000000, status: "Aktif", catatan: "Vibro untuk pemadatan akses pelabuhan." },
      { noKontrak: "KTR-2026-0007", customerId: customer["CUST-012"].id, unitId: unit["BLD-003"].id, operatorId: operator["OP-007"].id, locationId: location["LOC-IKN"].id, tanggalKontrak: date("2026-05-18"), mulaiSewa: date("2026-05-18"), akhirSewa: date("2026-09-18"), tarif: 520000, satuan: "Jam", nilaiKontrak: 426400000, dp: 75000000, status: "Aktif", catatan: "Kontrak IKN tahap persiapan lahan." },
      { noKontrak: "KTR-2026-0008", customerId: customer["CUST-009"].id, unitId: unit["WL-002"].id, operatorId: operator["OP-008"].id, locationId: location["LOC-BDG"].id, tanggalKontrak: date("2026-04-01"), mulaiSewa: date("2026-04-01"), akhirSewa: date("2026-04-30"), tarif: 410000, satuan: "Jam", nilaiKontrak: 82000000, dp: 10000000, status: "Selesai", catatan: "Kontrak selesai, menunggu pelunasan sisa invoice." },
    ],
    skipDuplicates: true,
  });

  const contracts = await prisma.rentalContract.findMany();
  const contract = Object.fromEntries(contracts.map((item) => [item.noKontrak, item]));

  const invoiceSeeds = [
    {
      noInvoice: "INV-2026-0002",
      contractNo: "KTR-2026-0002",
      customerCode: "CUST-004",
      tanggal: "2026-05-20",
      jatuhTempo: "2026-05-27",
      subtotal: 32640000,
      pajak: 3582000,
      total: 36222000,
      status: "Sebagian",
      catatan: "Termin 1 Excavator ZX 200 Karawang.",
      items: [
        { deskripsi: "Sewa Excavator ZX 200 - 64 jam", volume: 64, satuan: "Jam", hargaSatuan: 510000, total: 32640000 },
      ],
    },
    {
      noInvoice: "INV-2026-0003",
      contractNo: "KTR-2026-0003",
      customerCode: "CUST-005",
      tanggal: "2026-05-25",
      jatuhTempo: "2026-06-01",
      subtotal: 50050000,
      pajak: 5505500,
      total: 55555500,
      status: "Belum Lunas",
      catatan: "Termin 1 Bulldozer D6R Morowali.",
      items: [
        { deskripsi: "Sewa Bulldozer D6R - 110 jam", volume: 110, satuan: "Jam", hargaSatuan: 455000, total: 50050000 },
      ],
    },
    {
      noInvoice: "INV-2026-0004",
      contractNo: "KTR-2026-0004",
      customerCode: "CUST-007",
      tanggal: "2026-05-26",
      jatuhTempo: "2026-06-02",
      subtotal: 42800000,
      pajak: 4708000,
      total: 47508000,
      status: "Lunas",
      catatan: "Termin 1 Excavator PC210 Samarinda.",
      items: [
        { deskripsi: "Sewa Excavator PC210 - 80 jam", volume: 80, satuan: "Jam", hargaSatuan: 535000, total: 42800000 },
      ],
    },
    {
      noInvoice: "INV-2026-0005",
      contractNo: "KTR-2026-0005",
      customerCode: "CUST-010",
      tanggal: "2026-05-28",
      jatuhTempo: "2026-06-04",
      subtotal: 37100000,
      pajak: 4081000,
      total: 41181000,
      status: "Belum Lunas",
      catatan: "Sewa Dump Truck Patimban 14 hari.",
      items: [
        { deskripsi: "Sewa Dump Truck Hino DT-011", volume: 14, satuan: "Hari", hargaSatuan: 2650000, total: 37100000 },
      ],
    },
    {
      noInvoice: "INV-2026-0006",
      contractNo: "KTR-2026-0008",
      customerCode: "CUST-009",
      tanggal: "2026-04-30",
      jatuhTempo: "2026-05-07",
      subtotal: 82000000,
      pajak: 9020000,
      total: 91020000,
      status: "Sebagian",
      catatan: "Final invoice Wheel Loader Bandung.",
      items: [
        { deskripsi: "Sewa Wheel Loader LW500KN - 200 jam", volume: 200, satuan: "Jam", hargaSatuan: 410000, total: 82000000 },
      ],
    },
  ];

  for (const invoiceSeed of invoiceSeeds) {
    const rentalContract = contract[invoiceSeed.contractNo];
    const invoice = await prisma.invoice.upsert({
      where: { noInvoice: invoiceSeed.noInvoice },
      update: {
        contractId: rentalContract.id,
        customerId: customer[invoiceSeed.customerCode].id,
        tanggal: date(invoiceSeed.tanggal),
        jatuhTempo: date(invoiceSeed.jatuhTempo),
        tipe: "Sewa",
        subtotal: invoiceSeed.subtotal,
        pajak: invoiceSeed.pajak,
        total: invoiceSeed.total,
        status: invoiceSeed.status,
        bankAccountId: defaultBank.id,
        catatan: invoiceSeed.catatan,
      },
      create: {
        noInvoice: invoiceSeed.noInvoice,
        contractId: rentalContract.id,
        customerId: customer[invoiceSeed.customerCode].id,
        tanggal: date(invoiceSeed.tanggal),
        jatuhTempo: date(invoiceSeed.jatuhTempo),
        tipe: "Sewa",
        subtotal: invoiceSeed.subtotal,
        pajak: invoiceSeed.pajak,
        total: invoiceSeed.total,
        status: invoiceSeed.status,
        bankAccountId: defaultBank.id,
        catatan: invoiceSeed.catatan,
      },
    });

    if ((await prisma.invoiceItem.count({ where: { invoiceId: invoice.id } })) === 0) {
      await prisma.invoiceItem.createMany({
        data: invoiceSeed.items.map((item) => ({ ...item, invoiceId: invoice.id })),
      });
    }
  }

  const invoices = await prisma.invoice.findMany();
  const invoice = Object.fromEntries(invoices.map((item) => [item.noInvoice, item]));

  await prisma.payment.createMany({
    data: [
      { noPembayaran: "PAY-2026-0002", invoiceId: invoice["INV-2026-0002"].id, tanggal: date("2026-05-21"), jumlah: 20000000, metode: "Transfer", bankAccountId: defaultBank.id, catatan: "Pembayaran termin 1 sebagian." },
      { noPembayaran: "PAY-2026-0003", invoiceId: invoice["INV-2026-0004"].id, tanggal: date("2026-05-27"), jumlah: 47508000, metode: "Transfer", bankAccountId: defaultBank.id, catatan: "Pelunasan termin 1." },
      { noPembayaran: "PAY-2026-0004", invoiceId: invoice["INV-2026-0006"].id, tanggal: date("2026-05-03"), jumlah: 50000000, metode: "Transfer", bankAccountId: defaultBank.id, catatan: "Pembayaran sebagian final invoice." },
    ],
    skipDuplicates: true,
  });

  await prisma.receipt.createMany({
    data: [
      { noKwitansi: "KWT-2026-0002", invoiceId: invoice["INV-2026-0002"].id, tanggal: date("2026-05-21"), diterimaDari: "PT Bumi Konstruksi Mandiri", untukPembayaran: "Termin 1 Excavator ZX 200 Karawang", jumlah: 20000000, terbilang: "Dua Puluh Juta Rupiah", bankAccountId: defaultBank.id, penandatangan: "Finance" },
      { noKwitansi: "KWT-2026-0003", invoiceId: invoice["INV-2026-0004"].id, tanggal: date("2026-05-27"), diterimaDari: "PT Kalimantan Prima Infrastruktur", untukPembayaran: "Termin 1 Excavator PC210 Samarinda", jumlah: 47508000, terbilang: "Empat Puluh Tujuh Juta Lima Ratus Delapan Ribu Rupiah", bankAccountId: defaultBank.id, penandatangan: "Finance" },
      { noKwitansi: "KWT-2026-0004", invoiceId: invoice["INV-2026-0006"].id, tanggal: date("2026-05-03"), diterimaDari: "PT Mandiri Beton Perkasa", untukPembayaran: "Final invoice Wheel Loader Bandung", jumlah: 50000000, terbilang: "Lima Puluh Juta Rupiah", bankAccountId: defaultBank.id, penandatangan: "Finance" },
    ],
    skipDuplicates: true,
  });

  await prisma.mobilisasi.createMany({
    data: [
      { noMobilisasi: "MOB-2026-0002", unitId: unit["EXC-002"].id, driverId: driver["DRV-002"].id, contractId: contract["KTR-2026-0002"].id, asalLokasi: "Pool Bekasi", tujuanLokasi: "Karawang Industrial", tanggalBerangkat: date("2026-05-07"), tanggalTiba: date("2026-05-08"), biayaMobilisasi: 4500000, biayaDemobilisasi: 4500000, status: "Selesai", catatan: "Mobilisasi malam hari." },
      { noMobilisasi: "MOB-2026-0003", unitId: unit["BLD-002"].id, driverId: driver["DRV-003"].id, contractId: contract["KTR-2026-0003"].id, asalLokasi: "Pool Bekasi", tujuanLokasi: "Morowali", tanggalBerangkat: date("2026-05-06"), tanggalTiba: date("2026-05-10"), biayaMobilisasi: 42000000, biayaDemobilisasi: 42000000, status: "Selesai", catatan: "Via kapal roro." },
      { noMobilisasi: "MOB-2026-0004", unitId: unit["EXC-004"].id, driverId: driver["DRV-004"].id, contractId: contract["KTR-2026-0004"].id, asalLokasi: "Balikpapan", tujuanLokasi: "Samarinda Ring Road", tanggalBerangkat: date("2026-05-11"), tanggalTiba: date("2026-05-12"), biayaMobilisasi: 8500000, biayaDemobilisasi: 8500000, status: "Selesai", catatan: "Lowbed lokal Kaltim." },
      { noMobilisasi: "MOB-2026-0005", unitId: unit["DT-011"].id, driverId: driver["DRV-005"].id, contractId: contract["KTR-2026-0005"].id, asalLokasi: "Pool Bekasi", tujuanLokasi: "Patimban", tanggalBerangkat: date("2026-05-14"), tanggalTiba: date("2026-05-15"), biayaMobilisasi: 6200000, biayaDemobilisasi: 6200000, status: "Selesai", catatan: "Unit langsung operasional." },
      { noMobilisasi: "MOB-2026-0006", unitId: unit["BLD-003"].id, driverId: driver["DRV-006"].id, contractId: contract["KTR-2026-0007"].id, asalLokasi: "Balikpapan", tujuanLokasi: "IKN Sepaku", tanggalBerangkat: date("2026-05-16"), tanggalTiba: date("2026-05-18"), biayaMobilisasi: 12000000, biayaDemobilisasi: 12000000, status: "Selesai", catatan: "Koordinasi masuk site IKN." },
    ],
    skipDuplicates: true,
  });

  for (const report of [
    { contractId: contract["KTR-2026-0002"].id, unitId: unit["EXC-002"].id, operatorId: operator["OP-003"].id, tanggal: date("2026-05-20"), jamKerja: 8, fuelLiter: 75, hmAwal: 1288, hmAkhir: 1296, aktivitas: "Galian pondasi area workshop.", kendala: "Cuaca gerimis sore." },
    { contractId: contract["KTR-2026-0002"].id, unitId: unit["EXC-002"].id, operatorId: operator["OP-003"].id, tanggal: date("2026-05-21"), jamKerja: 9, fuelLiter: 82, hmAwal: 1296, hmAkhir: 1305, aktivitas: "Loading disposal tanah merah.", kendala: null },
    { contractId: contract["KTR-2026-0003"].id, unitId: unit["BLD-002"].id, operatorId: operator["OP-004"].id, tanggal: date("2026-05-20"), jamKerja: 10, fuelLiter: 115, hmAwal: 4020, hmAkhir: 4030, aktivitas: "Clearing dan spreading material.", kendala: "Menunggu dump truck 1 jam." },
    { contractId: contract["KTR-2026-0004"].id, unitId: unit["EXC-004"].id, operatorId: operator["OP-006"].id, tanggal: date("2026-05-22"), jamKerja: 8, fuelLiter: 78, hmAwal: 940, hmAkhir: 948, aktivitas: "Galian saluran drainase.", kendala: null },
    { contractId: contract["KTR-2026-0004"].id, unitId: unit["EXC-004"].id, operatorId: operator["OP-006"].id, tanggal: date("2026-05-23"), jamKerja: 8.5, fuelLiter: 80, hmAwal: 948, hmAkhir: 956.5, aktivitas: "Perapihan slope saluran.", kendala: null },
    { contractId: contract["KTR-2026-0005"].id, unitId: unit["DT-011"].id, tanggal: date("2026-05-22"), jamKerja: 8, fuelLiter: 95, hmAwal: 0, hmAkhir: 0, aktivitas: "Angkut material urugan 18 rit.", kendala: null },
    { contractId: contract["KTR-2026-0006"].id, unitId: unit["VIB-002"].id, operatorId: operator["OP-010"].id, tanggal: date("2026-05-22"), jamKerja: 7, fuelLiter: 62, hmAwal: 1420, hmAkhir: 1427, aktivitas: "Pemadatan akses pelabuhan.", kendala: "Area tergenang 30 menit." },
    { contractId: contract["KTR-2026-0007"].id, unitId: unit["BLD-003"].id, operatorId: operator["OP-007"].id, tanggal: date("2026-05-24"), jamKerja: 9, fuelLiter: 125, hmAwal: 2985, hmAkhir: 2994, aktivitas: "Cut and fill area persiapan lahan.", kendala: null },
    { contractId: contract["KTR-2026-0008"].id, unitId: unit["WL-002"].id, operatorId: operator["OP-008"].id, tanggal: date("2026-04-20"), jamKerja: 8, fuelLiter: 70, hmAwal: 760, hmAkhir: 768, aktivitas: "Loading agregat ke batching plant.", kendala: null },
  ]) {
    await createDailyReportOnce(report);
  }

  for (const fuelLog of [
    { unitId: unit["EXC-002"].id, contractId: contract["KTR-2026-0002"].id, tanggal: date("2026-05-20"), liter: 75, hargaPerLiter: 6900, total: 517500, supplier: "PT Solar Industri Prima", catatan: "Solar site Karawang." },
    { unitId: unit["EXC-002"].id, contractId: contract["KTR-2026-0002"].id, tanggal: date("2026-05-21"), liter: 82, hargaPerLiter: 6900, total: 565800, supplier: "PT Solar Industri Prima", catatan: "Top up sore." },
    { unitId: unit["BLD-002"].id, contractId: contract["KTR-2026-0003"].id, tanggal: date("2026-05-20"), liter: 115, hargaPerLiter: 7200, total: 828000, supplier: "Vendor Site Morowali", catatan: "Solar tambang." },
    { unitId: unit["EXC-004"].id, contractId: contract["KTR-2026-0004"].id, tanggal: date("2026-05-22"), liter: 78, hargaPerLiter: 7100, total: 553800, supplier: "Solar Kaltim", catatan: "Pengisian pagi." },
    { unitId: unit["DT-011"].id, contractId: contract["KTR-2026-0005"].id, tanggal: date("2026-05-22"), liter: 95, hargaPerLiter: 6900, total: 655500, supplier: "PT Solar Industri Prima", catatan: "Operasional dump truck." },
    { unitId: unit["VIB-002"].id, contractId: contract["KTR-2026-0006"].id, tanggal: date("2026-05-22"), liter: 62, hargaPerLiter: 6900, total: 427800, supplier: "PT Solar Industri Prima", catatan: "Vibro roller." },
  ]) {
    await createFuelLogOnce(fuelLog);
  }

  const owner = await prisma.user.findUnique({ where: { username: "owner" } });
  await createAttachmentOnce({ entityType: "Invoice", entityId: invoice["INV-2026-0002"].id, fileName: "INV-2026-0002.pdf", fileUrl: "/documents/invoices/INV-2026-0002.pdf", fileType: "application/pdf", uploadedBy: owner?.id });
  await createAttachmentOnce({ entityType: "RentalContract", entityId: contract["KTR-2026-0004"].id, fileName: "KTR-2026-0004-signed.pdf", fileUrl: "/documents/contracts/KTR-2026-0004-signed.pdf", fileType: "application/pdf", uploadedBy: owner?.id });
  await createAuditLogOnce({ userId: owner?.id, action: "seed.expanded", entityType: "Seed", entityId: 202605, metadata: { batch: "expanded-demo-data", records: "masters-transactions" } });
}

async function seedExpandedMaintenanceAndHpp() {
  const [units, suppliers, spareparts] = await Promise.all([
    prisma.equipmentUnit.findMany(),
    prisma.supplier.findMany(),
    prisma.sparepart.findMany(),
  ]);
  const unit = Object.fromEntries(units.map((item) => [item.kodeLambung, item]));
  const supplier = Object.fromEntries(suppliers.map((item) => [item.kode, item]));
  const sparepart = Object.fromEntries(spareparts.map((item) => [item.kode, item]));

  await prisma.maintenanceOrder.createMany({
    data: [
      { noWo: "WO-2026-0002", unitId: unit["EXC-003"].id, tipe: "Rutin", tanggalMulai: date("2026-05-02"), tanggalSelesai: date("2026-05-03"), hmService: 420, deskripsi: "Service berkala 500 HM dan penggantian filter.", mekanik: "Tim Pool", supplierId: supplier["SUP-FILTER"].id, status: "Done", totalBiaya: 5120000, catatan: "Unit siap standby." },
      { noWo: "WO-2026-0003", unitId: unit["GRD-001"].id, tipe: "Perbaikan", tanggalMulai: date("2026-05-04"), tanggalSelesai: null, hmService: 5125, deskripsi: "Perbaikan hydraulic blade dan pengecekan hose.", mekanik: "Hydraulic Center", supplierId: supplier["SUP-HYD"].id, status: "Open", totalBiaya: 8750000, catatan: "Menunggu seal kit." },
      { noWo: "WO-2026-0004", unitId: unit["BLD-003"].id, tipe: "Rutin", tanggalMulai: date("2026-05-17"), tanggalSelesai: date("2026-05-17"), hmService: 2985, deskripsi: "Pengecekan undercarriage sebelum masuk site IKN.", mekanik: "Tim Kaltim", supplierId: supplier["SUP-TRACK"].id, status: "Done", totalBiaya: 6400000, catatan: "Track masih layak operasi." },
      { noWo: "WO-2026-0005", unitId: unit["DT-012"].id, tipe: "Perbaikan", tanggalMulai: date("2026-05-12"), tanggalSelesai: date("2026-05-13"), hmService: 0, deskripsi: "Ganti aki dan service kelistrikan dump truck.", mekanik: "Tim Pool", supplierId: supplier["SUP-BATTERY"].id, status: "Done", totalBiaya: 3150000, catatan: "Unit kembali standby." },
    ],
    skipDuplicates: true,
  });

  const workOrders = await prisma.maintenanceOrder.findMany();
  const workOrder = Object.fromEntries(workOrders.map((item) => [item.noWo, item]));
  const partsByWorkOrder = {
    "WO-2026-0002": [
      { sparepartId: sparepart["SP-AIR-FILTER"].id, namaPart: "Air Filter Heavy Duty", supplierNama: "Prima Filter Nusantara", harga: 680000, qty: 2, satuan: "PCS", total: 1360000 },
      { sparepartId: sparepart["SP-FUEL-FILTER"].id, namaPart: "Fuel Filter Heavy Duty", supplierNama: "Prima Filter Nusantara", harga: 520000, qty: 2, satuan: "PCS", total: 1040000 },
      { sparepartId: sparepart["SP-OIL-15W40"].id, namaPart: "Engine Oil 15W-40", supplierNama: "Mega Oli Diesel", harga: 1650000, qty: 1, satuan: "PAIL", total: 1650000 },
    ],
    "WO-2026-0003": [
      { sparepartId: sparepart["SP-SEAL-HYD"].id, namaPart: "Seal Kit Hydraulic Cylinder", supplierNama: "Hydraulic Center Bekasi", harga: 2750000, qty: 2, satuan: "SET", total: 5500000 },
      { sparepartId: sparepart["SP-HYD-68"].id, namaPart: "Hydraulic Oil AW 68", supplierNama: "Mega Oli Diesel", harga: 5850000, qty: 0.5, satuan: "DRUM", total: 2925000 },
    ],
    "WO-2026-0004": [
      { sparepartId: sparepart["SP-CUTTING-EDGE"].id, namaPart: "Cutting Edge Dozer", supplierNama: "Track Shoe Specialist", harga: 7200000, qty: 0.5, satuan: "SET", total: 3600000 },
      { sparepartId: sparepart["SP-GREASE"].id, namaPart: "Grease EP2", supplierNama: "Mega Oli Diesel", harga: 890000, qty: 1, satuan: "PAIL", total: 890000 },
    ],
    "WO-2026-0005": [
      { sparepartId: sparepart["SP-AKI-150"].id, namaPart: "Battery N150", supplierNama: "Aki Jaya Mandiri", harga: 2350000, qty: 1, satuan: "PCS", total: 2350000 },
    ],
  };

  for (const [noWo, parts] of Object.entries(partsByWorkOrder)) {
    if ((await prisma.maintenancePart.count({ where: { maintenanceOrderId: workOrder[noWo].id } })) === 0) {
      await prisma.maintenancePart.createMany({
        data: parts.map((part) => ({ ...part, maintenanceOrderId: workOrder[noWo].id })),
      });
    }
  }

  await prisma.unitSaleHpp.createMany({
    data: [
      { noLaporan: "HPP-EXC003-2026", unitId: unit["EXC-003"].id, tanggal: date("2026-05-04"), hppPembelian: 925000000, biayaPerbaikan: 5120000, biayaMekanik: 1500000, biayaCat: 0, biayaLas: 0, biayaKebersihan: 750000, totalHpp: 932370000, hargaJual: 985000000, labaRugi: 52630000, catatan: "Simulasi HPP unit standby siap jual." },
      { noLaporan: "HPP-DT012-2026", unitId: unit["DT-012"].id, tanggal: date("2026-05-14"), hppPembelian: 545000000, biayaPerbaikan: 3150000, biayaMekanik: 850000, biayaCat: 0, biayaLas: 0, biayaKebersihan: 450000, totalHpp: 549450000, hargaJual: 575000000, labaRugi: 25550000, catatan: "Simulasi HPP dump truck." },
    ],
    skipDuplicates: true,
  });

  const owner = await prisma.user.findUnique({ where: { username: "owner" } });
  await createAttachmentOnce({ entityType: "MaintenanceOrder", entityId: workOrder["WO-2026-0003"].id, fileName: "foto-hydraulic-grd001.jpg", fileUrl: "/documents/maintenance/foto-hydraulic-grd001.jpg", fileType: "image/jpeg", uploadedBy: owner?.id });
  await createAuditLogOnce({ userId: owner?.id, action: "maintenance.seed.expanded", entityType: "MaintenanceOrder", entityId: workOrder["WO-2026-0003"].id, metadata: { status: "Open", unit: "GRD-001" } });
}

async function main() {
  await seedRbac();
  await seedMasters();
  await seedExpandedMasters();
  await seedTransactions();
  await seedExpandedTransactions();
  await seedMaintenanceAndHpp();
  await seedExpandedMaintenanceAndHpp();
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
