"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  ClipboardList, 
  LogOut,
  UserCircle
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get("tab");

  const menuItems = [
    { 
      title: "Inicio", 
      href: "/dashboard", 
      icon: LayoutDashboard,
      roles: ["administrador_sistema", "director_escuela", "coordinador_academico", "operador_horarios", "docente"]
    },
    { 
      title: "Catálogos", 
      href: "/dashboard?tab=config",
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
      title: "Selección Docente", 
      href: "/dashboard/horarios/seleccion", 
      icon: Calendar,
      roles: ["administrador_sistema", "docente"]
    },
  ];

  const filteredMenu = menuItems.filter(item => 
    session?.user?.rol && item.roles.includes(session.user.rol)
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center">
            <BookOpen className="mr-2" /> Horarios UNT
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {filteredMenu.map((item) => {
            let isActive = false;
            
            if (item.href.includes("?tab=")) {
              const urlTab = item.href.split("=")[1];
              isActive = pathname === "/dashboard" && currentTab === urlTab;
            } else if (item.href === "/dashboard") {
              isActive = pathname === "/dashboard" && (!currentTab || currentTab === "overview");
            } else {
              isActive = pathname.startsWith(item.href) && item.href !== "/dashboard";
            }

            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center p-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-indigo-700 text-white" 
                    : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <div className="flex items-center p-2 mb-4">
            <div className="bg-indigo-700 rounded-full p-2 mr-3">
              <UserCircle className="h-6 w-6" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{session?.user?.name}</p>
              <p className="text-xs text-indigo-300 truncate capitalize">{session?.user?.rol?.replace("_", " ")}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="flex items-center w-full p-2 text-indigo-300 hover:text-white hover:bg-indigo-800 rounded-lg transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
