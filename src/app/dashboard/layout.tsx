"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  LogOut,
  UserCircle,
  FileText,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Bell,
  MapPin,
  Layers,
  Settings,
  ChevronDown
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [gestionAcademicaOpen, setGestionAcademicaOpen] = useState(true);

  const menuItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["administrador_sistema", "director_escuela", "coordinador_academico", "docente"]
    },
    {
      title: "Atención",
      href: "/dashboard/horarios/asignacion",
      icon: Users,
      roles: ["administrador_sistema", "operador_horarios"],
    },
    {
      isGroup: true,
      title: "Gestión Académica",
      roles: ["administrador_sistema", "director_escuela", "coordinador_academico"],
      items: [
        { title: "Docentes", href: "/dashboard/catalogos?tab=docentes", icon: Users },
        { title: "Cursos", href: "/dashboard/catalogos?tab=cursos", icon: BookOpen },
        { title: "Ambientes", href: "/dashboard/catalogos?tab=ambientes", icon: MapPin },
        { title: "Ciclos", href: "/dashboard/catalogos?tab=ciclos", icon: Layers },
        { title: "Períodos", href: "/dashboard/catalogos?tab=periodos", icon: Calendar },
      ]
    },
    {
      title: "Ventanas",
      href: "/dashboard/catalogos?tab=ventanas",
      icon: ClipboardList,
      roles: ["administrador_sistema", "director_escuela", "coordinador_academico"],
    },
    {
      title: "Horarios",
      href: "/dashboard/horarios/seleccion",
      icon: Calendar,
      roles: ["docente"],
    },
    {
      title: "Reportes",
      href: "/dashboard/reportes",
      icon: FileText,
      roles: ["administrador_sistema", "director_escuela", "coordinador_academico", "operador_horarios"],
    },
    {
      title: "Notificaciones",
      href: "/dashboard/notificaciones",
      icon: Bell,
      roles: ["administrador_sistema", "director_escuela", "coordinador_academico", "docente"],
    },
    {
      isGroup: true,
      title: "Configuración",
      roles: ["administrador_sistema"],
      items: [
        { title: "Usuarios", href: "/dashboard/usuarios", icon: ShieldCheck },
        { title: "Otros ajustes", href: "/dashboard/configuracion", icon: Settings },
      ]
    },
  ];

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans overflow-x-hidden">
      {/* SIDEBAR LATERAL IZQUIERDO */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 bg-[#1a237e] text-white transition-all duration-300 ease-in-out flex flex-col shadow-2xl",
        isSidebarCollapsed ? "w-16" : "w-56",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className={cn("p-4 border-b border-white/10 flex items-center gap-2", isSidebarCollapsed && "p-3 justify-center")}>
          <div className="bg-white p-1.5 rounded-lg text-[#1a237e] shrink-0 shadow-sm">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.04 9.04 0 017 14.94V11.8l2.3 1a1 1 0 00.78 0l7-3a1 1 0 00.313-1.633L15 7.445v5.022c0 .54-.408 1.001-.946 1.058a9.011 9.011 0 01-4.754 3.048 1 1 0 01-.3-.02z" />
            </svg>
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-xs leading-tight whitespace-nowrap">SGH Sistemas</h1>
              <p className="text-[9px] text-white/60 whitespace-nowrap uppercase tracking-tighter">UNT Trujillo</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          {filteredMenu.map((item: any, idx: number) => {
            if (item.isGroup) {
              const isGestion = item.title === "Gestión Académica";
              const isOpen = isGestion ? gestionAcademicaOpen : true;
              return (
                <div key={idx} className="space-y-0.5 pt-1.5 first:pt-0">
                  {!isSidebarCollapsed && (
                    <button 
                      onClick={() => isGestion && setGestionAcademicaOpen(!gestionAcademicaOpen)}
                      className="w-full flex items-center justify-between px-3 py-1 text-[9px] font-semibold text-white/40 uppercase tracking-widest hover:text-white/60 transition-colors"
                    >
                      <span>{item.title}</span>
                      {isGestion && <ChevronDown className={cn("w-2.5 h-2.5 transition-transform", !isOpen && "-rotate-90")} />}
                    </button>
                  )}
                  {(!isSidebarCollapsed && isOpen || isSidebarCollapsed) && item.items.map((sub: any) => {
                    const isActive = pathname === sub.href;
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.title}
                        href={sub.href}
                        className={cn(
                          "w-full flex items-center px-3 py-1 rounded-lg transition-all duration-200 group relative",
                          isActive 
                            ? 'bg-white/10 text-white font-semibold shadow-sm' 
                            : 'text-white/70 hover:bg-white/5 hover:text-white',
                          isSidebarCollapsed && "justify-center px-0"
                        )}
                        title={isSidebarCollapsed ? sub.title : ""}
                      >
                        <SubIcon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : "text-white/50 group-hover:text-white")} />
                        {!isSidebarCollapsed && <span className="text-[11px] ml-3">{sub.title}</span>}
                        {isActive && !isSidebarCollapsed && <div className="absolute left-0 w-0.5 h-3 bg-white rounded-r-full" />}
                      </Link>
                    );
                  })}
                </div>
              );
            }

            const isActive = pathname === item.href;
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "w-full flex items-center px-3 py-1.5 rounded-lg transition-all duration-200 group relative",
                  isActive 
                    ? 'bg-white/10 text-white font-semibold shadow-sm' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white',
                  isSidebarCollapsed && "justify-center px-0"
                )}
                title={isSidebarCollapsed ? item.title : ""}
              >
                <ItemIcon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-white/50 group-hover:text-white")} />
                {!isSidebarCollapsed && <span className="text-xs ml-3">{item.title}</span>}
                {isActive && !isSidebarCollapsed && <div className="absolute left-0 w-0.5 h-4 bg-white rounded-r-full" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-2.5 border-t border-white/10 bg-indigo-950/40 text-[9px] text-white/60">
          <div className="flex justify-between items-center">
            {!isSidebarCollapsed && <span className="uppercase tracking-tighter font-semibold">{session?.user?.rol?.replace("_", " ")}</span>}
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse shrink-0"></span>
          </div>
          {!isSidebarCollapsed && (
            <p className="mt-0.5 text-[10px] text-white font-semibold truncate opacity-90">{session?.user?.name}</p>
          )}
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden transition-opacity duration-300"
        />
      )}

      {/* CONTENEDOR PRINCIPAL */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        isSidebarCollapsed ? "md:pl-16" : "md:pl-56"
      )}>
        {/* BARRA SUPERIOR COMPACTA */}
        <header className="h-11 bg-white border-b border-slate-100 flex items-center justify-between px-4 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center space-x-3 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="p-1 text-slate-500 hover:text-slate-800 md:hidden" 
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="relative max-w-[220px] w-full hidden sm:block">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <LayoutDashboard className="w-3 h-3" />
              </span>
              <input 
                type="text" 
                placeholder="Buscar módulo..." 
                className="w-full pl-7 pr-3 py-1 text-[10px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a237e] focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition relative group">
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1 right-1 block h-1.5 w-1.5 rounded-full bg-rose-500 ring-1 ring-white"></span>
            </button>

            <div className="h-6 w-px bg-slate-100 mx-1 hidden sm:block" />

            <div className="relative">
              <button 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)} 
                className="flex items-center space-x-2 p-0.5 rounded-lg hover:bg-slate-50 transition focus:outline-none"
              >
                <div className="w-6 h-6 rounded-lg bg-[#1a237e] text-white flex items-center justify-center font-bold text-[9px] shadow-sm uppercase">
                  {session?.user?.name?.substring(0, 2) || "U"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[10px] font-semibold text-slate-800 leading-none truncate max-w-[80px]">
                    {session?.user?.name?.split(' ')[0]}
                  </p>
                </div>
                <ChevronDown className={cn(
                  "w-2.5 h-2.5 text-slate-400 transition-transform",
                  userDropdownOpen ? 'rotate-180' : 'rotate-0'
                )} />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-100 rounded-xl shadow-xl py-1 z-30 text-[10px] text-slate-700 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1 border-b border-slate-50 text-[8px] text-slate-400 uppercase tracking-wider font-bold">Sesión</div>
                  <button 
                    onClick={() => signOut({ callbackUrl: "/auth/login" })} 
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 transition font-semibold flex items-center gap-2"
                  >
                    <LogOut className="w-3 h-3" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENIDO DE PANTALLAS COMPACTO */}
        <main className="flex-grow p-4 space-y-4 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-1 duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

