"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BoltIcon,
  BoxCubeIcon,
  ChevronDownIcon,
  DollarLineIcon,
  FileIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  LockIcon,
  PieChartIcon,
  TableIcon,
  TaskIcon,
} from "../icons/index";
import { hasPermission, makePermissionCode } from "@/lib/access-control";
import type { AuthUser } from "@/lib/auth/types";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  permission?: string;
  subItems?: { name: string; path: string; permission?: string }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
    permission: makePermissionCode("dashboard", "view"),
  },
  {
    icon: <FileIcon />,
    name: "Transaksi Sewa",
    subItems: [
      { name: "Permintaan Sewa", path: "/sewa/permintaan", permission: makePermissionCode("permintaan_sewa", "view") },
      { name: "Penawaran Sewa", path: "/sewa/penawaran", permission: makePermissionCode("penawaran_sewa", "view") },
      { name: "Kontrak Sewa", path: "/sewa/kontrak", permission: makePermissionCode("kontrak_sewa", "view") },
    ],
  },
  {
    icon: <TaskIcon />,
    name: "Operasional",
    subItems: [
      { name: "Mobilisasi / Demobilisasi", path: "/mobilisasi", permission: makePermissionCode("mobilisasi", "view") },
      { name: "Jadwal Unit", path: "/operasional/jadwal-unit", permission: makePermissionCode("jadwal_unit", "view") },
      { name: "Timesheet / Laporan Harian", path: "/operasional/timesheet", permission: makePermissionCode("timesheet", "view") },
      { name: "Konsumsi BBM", path: "/operasional/bbm", permission: makePermissionCode("bbm", "view") },
      { name: "Status Unit", path: "/operasional/status-unit", permission: makePermissionCode("status_unit", "view") },
    ],
  },
  {
    icon: <DollarLineIcon />,
    name: "Keuangan",
    subItems: [
      { name: "Invoice", path: "/keuangan/invoice", permission: makePermissionCode("invoice", "view") },
      { name: "Pembayaran", path: "/keuangan/pembayaran", permission: makePermissionCode("pembayaran", "view") },
      { name: "Kwitansi", path: "/keuangan/kwitansi", permission: makePermissionCode("kwitansi", "view") },
      { name: "Piutang", path: "/laporan/piutang", permission: makePermissionCode("piutang", "view") },
      { name: "Kas & Bank", path: "/keuangan/kas-bank", permission: makePermissionCode("kas_bank", "view") },
    ],
  },
  {
    icon: <BoltIcon />,
    name: "Maintenance",
    subItems: [
      { name: "Work Order Maintenance", path: "/maintenance/work-order", permission: makePermissionCode("work_order_maintenance", "view") },
      { name: "Jadwal Service", path: "/maintenance/jadwal", permission: makePermissionCode("jadwal_service", "view") },
      { name: "Riwayat Maintenance", path: "/maintenance/riwayat", permission: makePermissionCode("riwayat_maintenance", "view") },
      { name: "Biaya Maintenance", path: "/maintenance/biaya", permission: makePermissionCode("biaya_maintenance", "view") },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Penjualan Unit",
    subItems: [
      { name: "Penjualan Unit", path: "/penjualan-unit/penjualan", permission: makePermissionCode("penjualan_unit", "view") },
      { name: "HPP Unit", path: "/penjualan-unit/hpp", permission: makePermissionCode("hpp_unit", "view") },
    ],
  },
];

const othersItems: NavItem[] = [
  {
    icon: <TableIcon />,
    name: "Master Data",
    subItems: [
      { name: "Unit Alat Berat", path: "/master/unit", permission: makePermissionCode("master_unit", "view") },
      { name: "Kategori Alat", path: "/master/kategori", permission: makePermissionCode("kategori_alat", "view") },
      { name: "Tarif Sewa", path: "/master/tarif-sewa", permission: makePermissionCode("tarif_sewa", "view") },
      { name: "Customer", path: "/master/customer", permission: makePermissionCode("customer", "view") },
      { name: "Lokasi Proyek", path: "/master/lokasi", permission: makePermissionCode("lokasi_proyek", "view") },
      { name: "Operator", path: "/master/operator", permission: makePermissionCode("operator", "view") },
      { name: "Driver", path: "/master/driver", permission: makePermissionCode("driver", "view") },
      { name: "Supplier", path: "/master/supplier", permission: makePermissionCode("supplier", "view") },
      { name: "Sparepart", path: "/master/sparepart", permission: makePermissionCode("sparepart", "view") },
    ],
  },
  {
    icon: <PieChartIcon />,
    name: "Laporan",
    subItems: [
      { name: "Laporan Pendapatan", path: "/laporan/pendapatan", permission: makePermissionCode("laporan_pendapatan", "view") },
      { name: "Laporan Utilisasi Unit", path: "/laporan/unit", permission: makePermissionCode("laporan_utilisasi_unit", "view") },
      { name: "Laporan Kontrak", path: "/laporan/kontrak", permission: makePermissionCode("laporan_kontrak", "view") },
      { name: "Laporan Piutang", path: "/laporan/piutang", permission: makePermissionCode("laporan_piutang", "view") },
      { name: "Laporan Maintenance", path: "/laporan/maintenance", permission: makePermissionCode("laporan_maintenance", "view") },
      { name: "Laporan HPP Unit", path: "/laporan/hpp-unit", permission: makePermissionCode("laporan_hpp_unit", "view") },
    ],
  },
  {
    icon: <LockIcon />,
    name: "Pengaturan",
    subItems: [
      { name: "Pengguna", path: "/settings/users", permission: makePermissionCode("pengguna", "view") },
      { name: "Role & Permission", path: "/settings/roles", permission: makePermissionCode("role_permission", "view") },
      { name: "Template Dokumen", path: "/settings/template-dokumen", permission: makePermissionCode("template_dokumen", "view") },
      { name: "Audit Log", path: "/settings/audit-log", permission: makePermissionCode("audit_log", "view") },
    ],
  },
];

type OpenSubmenu = {
  type: "main" | "others";
  index: number;
};

const filterNavItems = (items: NavItem[], permissions: string[]) =>
  items
    .map((item) => {
      if (!item.subItems) return item;

      return {
        ...item,
        subItems: item.subItems.filter((subItem) =>
          hasPermission(permissions, subItem.permission)
        ),
      };
    })
    .filter((item) =>
      item.subItems
        ? item.subItems.length > 0
        : hasPermission(permissions, item.permission)
    );

type AppSidebarProps = {
  user: AuthUser;
};

const AppSidebar: React.FC<AppSidebarProps> = ({ user }) => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<OpenSubmenu | "closed" | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const permissions =
    user.roleCode === "SUPER_ADMIN" ? undefined : user.permissions;
  const visibleNavItems = permissions ? filterNavItems(navItems, permissions) : navItems;
  const visibleOthersItems = permissions ? filterNavItems(othersItems, permissions) : othersItems;

  const isActive = useCallback(
    (path: string) =>
      path === "/" ? pathname === path : pathname === path || pathname.startsWith(`${path}/`),
    [pathname]
  );

  const activeSubmenu: OpenSubmenu | null = (() => {
    for (const menuType of ["main", "others"] as const) {
      const items = menuType === "main" ? visibleNavItems : visibleOthersItems;
      const activeIndex = items.findIndex((nav) =>
        nav.subItems?.some((subItem) => isActive(subItem.path))
      );

      if (activeIndex >= 0) {
        return { type: menuType, index: activeIndex };
      }
    }

    return null;
  })();

  const currentOpenSubmenu = openSubmenu === "closed" ? null : openSubmenu ?? activeSubmenu;

  useEffect(() => {
    if (currentOpenSubmenu === null) return;

    const key = `${currentOpenSubmenu.type}-${currentOpenSubmenu.index}`;
    const submenu = subMenuRefs.current[key];

    if (submenu) {
      setSubMenuHeight((prevHeights) => ({
        ...prevHeights,
        [key]: submenu.scrollHeight,
      }));
    }
  }, [currentOpenSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    if (
      currentOpenSubmenu &&
      currentOpenSubmenu.type === menuType &&
      currentOpenSubmenu.index === index
    ) {
      setOpenSubmenu("closed");
      return;
    }

    setOpenSubmenu({ type: menuType, index });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                currentOpenSubmenu?.type === menuType && currentOpenSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
            >
              <span
                className={
                  currentOpenSubmenu?.type === menuType && currentOpenSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto h-5 w-5 transition-transform duration-200 ${
                    currentOpenSubmenu?.type === menuType && currentOpenSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
              >
                <span className={isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  currentOpenSubmenu?.type === menuType && currentOpenSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="ml-9 mt-2 space-y-1">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed left-0 top-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:mt-0 ${
        isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex py-8 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500">
                <GroupIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-800 dark:text-white">Sewa Alat</p>
                <p className="text-xs text-gray-400">Heavy Equipment</p>
              </div>
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500">
              <GroupIcon className="h-5 w-5 text-white" />
            </div>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 flex text-xs uppercase leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Menu Utama" : <HorizontaLDots />}
              </h2>
              {renderMenuItems(visibleNavItems, "main")}
            </div>

            <div>
              <h2
                className={`mb-4 flex text-xs uppercase leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Lainnya" : <HorizontaLDots />}
              </h2>
              {renderMenuItems(visibleOthersItems, "others")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
