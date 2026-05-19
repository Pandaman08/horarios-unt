"use client";

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
  FileText
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const menuItems = [
    {
      title: "Inicio",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["administrador_sistema", "director_escuela", "coordinador_academico", "operador_horarios", "docente"]
    },
    {
      title: "Catálogos",
      href: "/dashboard/catalogos",
      icon: ClipboardList,
      roles: ["administrador_sistema", "director_escuela", "coordinador_academico"]
    },
    {
      title: "Atención Operador",
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
      title: "Selección Docente",
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
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 bg-[#003366] text-white flex-col shadow-2xl z-40">
        <div className="p-8">
          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner">
            <img 
              src="/logount.png" 
              alt="UNT Logo" 
              className="h-10 w-auto brightness-0 invert"
            />
            <div className="h-8 w-[1px] bg-white/20" />
            <h1 className="text-sm font-black leading-tight tracking-tighter uppercase">
              Horarios <br />
              <span className="text-blue-300">UNT</span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 mb-2">
            <p className="text-[10px] font-black text-blue-300/40 uppercase tracking-[0.2em]">Menú Principal</p>
          </div>
          {filteredMenu.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                pathname === item.href
                  ? "bg-white text-[#003366] shadow-lg shadow-blue-900/20 translate-x-2"
                  : "text-blue-100 hover:bg-white/5 hover:translate-x-1"
              )}
            >
              {pathname === item.href && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-400" />
              )}
              <item.icon className={cn(
                "mr-3 h-5 w-5 transition-transform group-hover:scale-110",
                pathname === item.href ? "text-[#003366]" : "text-blue-300"
              )} />
              <span className="text-sm font-bold tracking-tight">{item.title}</span>
            </Link>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-white/5 rounded-3xl p-4 border border-white/10 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-0.5 shadow-lg">
                <div className="bg-[#003366] rounded-[14px] p-2">
                  <UserCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-white truncate leading-none mb-1">{session?.user?.name}</p>
                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-400/10 border border-blue-400/20">
                  <p className="text-[9px] font-bold text-blue-300 uppercase tracking-tighter truncate">
                    {session?.user?.rol?.replace("_", " ")}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="flex items-center justify-center w-full py-3 px-4 bg-white/5 hover:bg-red-500/10 text-blue-200 hover:text-red-400 rounded-2xl border border-white/10 hover:border-red-500/20 transition-all duration-300 group"
            >
              <LogOut className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-xs font-black uppercase tracking-widest">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#003366] flex items-center justify-between px-6 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <img src="/logount.png" alt="UNT" className="h-8 w-auto brightness-0 invert" />
          <span className="text-white font-black text-sm tracking-tighter">SGH UNT</span>
        </div>
        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
          <UserCircle className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-20 lg:pt-8 p-4 sm:p-8 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

