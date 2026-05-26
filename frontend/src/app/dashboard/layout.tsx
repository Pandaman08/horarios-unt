"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { FontSizeAdjuster } from "@/components/layout/FontSizeAdjuster";
import { PeriodoSelector } from "@/components/layout/PeriodoSelector";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  LogOut,
  FileText,
  Menu,
  X,
  ShieldCheck,
  Bell,
  MapPin,
  Layers,
  ChevronDown,
  Search,
  Info,
} from "lucide-react";

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [gestionAcademicaOpen, setGestionAcademicaOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const menuItems = useMemo(
    () => [
      {
        title: t("navDashboard"),
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: [
          "administrador_sistema",
          "director_escuela",
          "coordinador_academico",
          "docente",
          "operador_horarios",
        ],
      },
      // {
      //   title: t("navAttention"),
      //   href: "/dashboard/horarios/asignacion",
      //   icon: Users,
      //   roles: ["administrador_sistema", "operador_horarios"],
      // },
      {
        isGroup: true,
        title: t("navAcademic"),
        roles: [
          "administrador_sistema",
          "director_escuela",
          "coordinador_academico",
        ],
        items: [
          {
            title: t("navTeachers"),
            href: "/dashboard/catalogos?tab=docentes",
            icon: Users,
          },
          {
            title: t("navCourses"),
            href: "/dashboard/catalogos?tab=cursos",
            icon: BookOpen,
          },
          {
            title: t("navRooms"),
            href: "/dashboard/catalogos?tab=ambientes",
            icon: MapPin,
          },
          {
            title: t("navCycles"),
            href: "/dashboard/catalogos?tab=ciclos",
            icon: Layers,
          },
          {
            title: t("navPeriods"),
            href: "/dashboard/catalogos?tab=periodos",
            icon: Calendar,
          },
          {
            title: t("navAvailability"),
            href: "/dashboard/disponibilidad",
            icon: ClipboardList,
          },
        ],
      },
      {
        title: t("navWindows"),
        href: "/dashboard/catalogos?tab=ventanas",
        icon: ClipboardList,
        roles: [
          "administrador_sistema",
          "director_escuela",
          "coordinador_academico",
          "operador_horarios",
        ],
      },
      {
        title: t("navAvailability"),
        href: "/dashboard/disponibilidad",
        icon: ClipboardList,
        roles: ["docente"],
      },
      {
        title: t("navSchedules"),
        href: "/dashboard/horarios/seleccion",
        icon: Calendar,
        roles: ["docente"],
      },
      {
        title: t("navReports"),
        href: "/dashboard/reportes",
        icon: FileText,
        roles: [
          "administrador_sistema",
          "director_escuela",
          "coordinador_academico",
          "operador_horarios",
        ],
      },
      {
        title: t("navNotifications"),
        href: "/dashboard/notificaciones",
        icon: Bell,
        roles: [
          "administrador_sistema",
          "director_escuela",
          "coordinador_academico",
          "docente",
        ],
      },
      {
        isGroup: true,
        title: t("navConfig"),
        roles: ["administrador_sistema"],
        items: [
          {
            title: t("navUsers"),
            href: "/dashboard/usuarios",
            icon: ShieldCheck,
          },
        ],
      },
    ],
    [t]
  );

  const userRol = session?.user?.rol;

  const filteredMenu = menuItems
    .filter((item) => !item.roles || (userRol && item.roles.includes(userRol)))
    .map((item) => {
      if (!("isGroup" in item) || !item.items) return item;
      const items = item.items.filter(
        (sub) => !sub.roles || (userRol && sub.roles.includes(userRol))
      );
      return items.length > 0 ? { ...item, items } : null;
    })
    .filter((item): item is (typeof menuItems)[number] => item !== null);

  const matchesSearch = (text: string) =>
    !searchQuery.trim() ||
    text.toLowerCase().includes(searchQuery.toLowerCase().trim());

  const filteredBySearch = filteredMenu
    .map((item) => {
      if ("isGroup" in item && item.isGroup && item.items) {
        const items = item.items.filter((sub) => matchesSearch(sub.title));
        if (!matchesSearch(item.title) && items.length === 0) return null;
        return {
          ...item,
          items: matchesSearch(item.title) ? item.items : items,
        };
      }
      if (!matchesSearch(item.title)) return null;
      return item;
    })
    .filter(Boolean) as typeof filteredMenu;

  const displayMenu = searchQuery.trim() ? filteredBySearch : filteredMenu;

  const isLinkActive = (href: string) => {
    const [path, query] = href.split("?");
    if (pathname !== path) return false;
    if (!query) return true;
    const tab = new URLSearchParams(query).get("tab");
    return tab ? searchParams.get("tab") === tab : true;
  };

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-muted/40 text-foreground flex overflow-x-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[220px] bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 ease-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Perfil */}
        <div className="px-4 pt-5 pb-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">
                @{session?.user?.email?.split("@")[0] || "usuario"}
              </p>
              <p className="text-[11px] text-sidebar-foreground/60 truncate capitalize">
                {userRol?.replace(/_/g, " ") || t("role")}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          {displayMenu.length === 0 && searchQuery.trim() && (
            <p className="px-3 py-2 text-xs text-sidebar-foreground/50">
              Sin resultados
            </p>
          )}
          {displayMenu.map((item: (typeof menuItems)[number], idx: number) => {
            if ("isGroup" in item && item.isGroup) {
              const isGestion = item.title === t("navAcademic");
              const isOpen = isGestion ? gestionAcademicaOpen : true;
              return (
                <div key={idx} className="pt-1 first:pt-0">
                  <button
                    type="button"
                    onClick={() =>
                      isGestion && setGestionAcademicaOpen(!gestionAcademicaOpen)
                    }
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold text-sidebar-foreground/45 uppercase tracking-wider hover:text-sidebar-foreground/70"
                  >
                    <span>{item.title}</span>
                    {isGestion && (
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform",
                          !isOpen && "-rotate-90"
                        )}
                      />
                    )}
                  </button>
                  {isOpen &&
                    item.items?.map((sub) => {
                      const isActive = isLinkActive(sub.href);
                      const SubIcon = sub.icon;
                      return (
                        <Link
                          key={sub.title}
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <SubIcon className="h-4 w-4 shrink-0 opacity-80" />
                          <span className="truncate">{sub.title}</span>
                        </Link>
                      );
                    })}
                </div>
              );
            }

            const isActive = item.href ? isLinkActive(item.href) : false;
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href!}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <ItemIcon className="h-4 w-4 shrink-0 opacity-80" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 text-[11px] text-sidebar-foreground/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>{t("online")}</span>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-[220px]">
        <header className="h-12 bg-card border-b border-border flex items-center gap-3 px-4 sticky top-0 z-20">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <LayoutDashboard className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-semibold leading-none truncate">
                {t("appName")}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {t("appSubtitle")}
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-auto hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search")}
                className="w-full h-8 pl-8 pr-3 text-xs bg-primary text-primary-foreground placeholder:text-primary-foreground/70 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-foreground/70 hover:text-primary-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="hidden md:block">
            <PeriodoSelector />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <FontSizeAdjuster />
            <ThemeToggle />
            <LanguageSelector />
            <Link
              href="/dashboard/notificaciones"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
              title={t("notifications")}
            >
              <Bell className="h-3.5 w-3.5" />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold uppercase">
                  {initials}
                </div>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 text-muted-foreground transition-transform hidden sm:block",
                    userDropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {userDropdownOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-30"
                    onClick={() => setUserDropdownOpen(false)}
                    aria-hidden
                  />
                  <div className="absolute right-0 mt-1 w-44 py-1 bg-popover border border-border rounded-lg shadow-lg z-40 text-xs">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="font-semibold truncate">
                        {session?.user?.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {userRol?.replace(/_/g, " ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        signOut({ callbackUrl: "/auth/login" })
                      }
                      className="w-full text-left px-3 py-2 hover:bg-destructive/10 text-destructive font-medium flex items-center gap-2"
                    >
                      <LogOut className="h-3 w-3" />
                      {t("logout")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Ayuda contextual */}
        <div className="px-4 py-2 bg-card/80 border-b border-border/60 hidden lg:flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{t("helpTip")}</span>
        </div>

        <main className="flex-1 p-4 overflow-x-hidden overflow-y-auto">
          <div className="w-full max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted/40 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}
