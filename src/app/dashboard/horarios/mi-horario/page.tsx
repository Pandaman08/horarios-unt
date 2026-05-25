"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MiHorarioDocenteView } from "@/components/horarios/MiHorarioDocenteView";

export default function MiHorarioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/login");
      return;
    }
    // Solo docentes pueden acceder a esta vista
    if (session.user?.rol !== "docente") {
      router.push("/dashboard/horarios/asignacion");
      return;
    }
    setIsReady(true);
  }, [session, status, router]);

  if (!isReady) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <MiHorarioDocenteView />
    </div>
  );
}
