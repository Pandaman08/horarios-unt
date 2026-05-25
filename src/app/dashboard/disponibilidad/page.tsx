"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DisponibilidadList } from "@/components/disponibilidad/DisponibilidadList";
import { DisponibilidadDocenteView } from "@/components/disponibilidad/DisponibilidadDocenteView";

export default function DisponibilidadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login");
      return;
    }
    setIsReady(true);
  }, [session, status, router]);

  if (!isReady) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  }

  // Si es docente, mostrar su propia disponibilidad
  if (session?.user?.rol === "docente") {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <DisponibilidadDocenteView />
      </div>
    );
  }

  // Si es admin/operador, mostrar lista de todos los docentes
  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <DisponibilidadList />
    </div>
  );
}
