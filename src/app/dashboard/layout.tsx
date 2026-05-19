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
  ShieldCheck
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

  // Bloquear scroll cuando el menú está abierto (Mejora UX Mobile)
  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
      if (mainContent) mainContent.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      if (mainContent) mainContent.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
      if (mainContent) mainContent.style.overflow = "auto";
    };
  }, [isSidebarOpen]);

  const menuItems = [
    {
      title: "Inicio",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["administrador_sistema", "director_escuela", "coordinador_academico", "docente"]
    },
    {
      title: "Mantenimiento",
      href: "/dashboard/catalogos",
      icon: ClipboardList,
      roles: ["administrador_sistema", "director_escuela", "coordinador_academico"]
    },
    {
      title: "Usuarios",
      href: "/dashboard/usuarios",
      icon: ShieldCheck,
      roles: ["administrador_sistema"]
    },
    {
      title: "Centro de Asignación",
      href: "/dashboard/horarios/asignacion",
      icon: Users,
      roles: ["administrador_sistema", "operador_horarios"]
    },
    {
      title: "Reportes",
      href: "/dashboard/reportes",
      icon: FileText,
      roles: ["administrador_sistema", "director_escuela", "coordinador_academico", "operador_horarios"]
    },
    {
      title: "Gestionar Horario",
      href: "/dashboard/horarios/seleccion",
      icon: Calendar,
      roles: ["docente"]
    },
  ];

  const filteredMenu = menuItems.filter(item =>
    session?.user?.rol && item.roles.includes(session.user.rol)
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 z-50 bg-[#003366] text-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out lg:static lg:h-screen",
        isSidebarCollapsed ? "lg:w-24" : "lg:w-72",
        "w-[78%] max-w-[300px] top-16 h-[calc(100vh-4rem)] lg:top-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className={cn("p-8 relative", isSidebarCollapsed && "p-4")}>
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <div className={cn(
              "flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner flex-1 overflow-hidden transition-all",
              isSidebarCollapsed && "p-2 justify-center"
            )}>
              <img 
                src="/logount.png" 
                alt="UNT Logo" 
                className={cn("h-10 w-auto transition-all", isSidebarCollapsed && "h-8")}
              />
              {!isSidebarCollapsed && (
                <>
                  <div className="h-8 w-[1px] bg-white/20" />
                  <h1 className="text-sm font-black leading-tight tracking-tighter uppercase">
                    Horarios <br />
                    <span className="text-blue-300">UNT</span>
                  </h1>
                </>
              )}
            </div>
            
            {/* Toggle Button for Desktop */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white text-[#003366] items-center justify-center shadow-lg border border-gray-100 z-50 hover:scale-110 transition-transform"
            >
              {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>

            {/* Close button for mobile */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {!isSidebarCollapsed && (
            <div className="px-4 py-2 mb-2">
              <p className="text-[10px] font-black text-blue-300/40 uppercase tracking-[0.2em]">Menú Principal</p>
            </div>
          )}
          {filteredMenu.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={cn(
                "flex items-center p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                pathname === item.href
                  ? "bg-white text-[#003366] shadow-lg shadow-blue-900/20 translate-x-2"
                  : "text-blue-100 hover:bg-white/5 hover:translate-x-1",
                isSidebarCollapsed && "justify-center px-0 translate-x-0 hover:translate-x-0"
              )}
              title={isSidebarCollapsed ? item.title : ""}
            >
              {pathname === item.href && !isSidebarCollapsed && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-400" />
              )}
              <item.icon className={cn(
                "h-5 w-5 transition-transform group-hover:scale-110 shrink-0",
                !isSidebarCollapsed && "mr-3",
                pathname === item.href ? "text-[#003366]" : "text-blue-300"
              )} />
              {!isSidebarCollapsed && (
                <span className="text-sm font-bold tracking-tight whitespace-nowrap">{item.title}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className={cn("p-6 mt-auto", isSidebarCollapsed && "p-2")}>
          <div className={cn("bg-white/5 rounded-3xl p-4 border border-white/10 backdrop-blur-md shadow-xl", isSidebarCollapsed && "rounded-2xl p-2")}>
            <div className={cn("flex items-center gap-3 mb-6", isSidebarCollapsed && "justify-center mb-4")}>
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-0.5 shadow-lg shrink-0">
                <div className="bg-[#003366] rounded-[14px] p-2">
                  <UserCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-xs font-black text-white truncate leading-none mb-1">{session?.user?.name}</p>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-400/10 border border-blue-400/20">
                    <p className="text-[9px] font-bold text-blue-300 uppercase tracking-tighter truncate">
                      {session?.user?.rol?.replace("_", " ")}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className={cn(
                "flex items-center justify-center w-full py-3 px-4 bg-white/5 hover:bg-red-500/10 text-blue-200 hover:text-red-400 rounded-2xl border border-white/10 hover:border-red-500/20 transition-all duration-300 group",
                isSidebarCollapsed && "px-0"
              )}
              title="Cerrar Sesión"
            >
              <LogOut className={cn("h-4 w-4 transition-transform group-hover:-translate-x-1", !isSidebarCollapsed && "mr-2")} />
              {!isSidebarCollapsed && (
                <span className="text-xs font-black uppercase tracking-widest">Cerrar Sesión</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#003366] flex items-center justify-between px-6 z-40 shadow-lg">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10"
        >
          <Menu className="h-6 w-6 text-white" />
        </button>
        <div className="flex items-center gap-3">
          <img src="/logount.png" alt="UNT" className="h-8 w-auto" />
          <span className="text-white font-black text-sm tracking-tighter">SGH UNT</span>
        </div>
        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
          <UserCircle className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0 custom-scrollbar">
          <div className="min-h-full animate-in fade-in duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

