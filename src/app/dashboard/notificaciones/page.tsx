import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { GestorNotificaciones } from "@/components/dashboard/GestorNotificaciones";

export default function NotificacionesPage() {
  return (
    <div className="p-4 max-w-[1800px] mx-auto space-y-6">
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <GestorNotificaciones />
      </div>
    </div>
  );
}
