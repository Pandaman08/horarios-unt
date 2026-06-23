import { UsuarioList } from "@/components/usuarios/UsuarioList";

export default function UsuariosPage() {
  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 animate-in fade-in duration-500 pb-4 px-3 sm:px-4 overflow-x-hidden">
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden p-3 md:p-4 w-full">
        <UsuarioList />
      </div>
    </div>
  );
}
