import { LoginForm } from "@/components/auth/LoginForm";
import { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Iniciar Sesión - Sistema de Horarios UNT",
  description: "Acceda al sistema de gestión de horarios",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#f8fafc]">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="w-full max-w-6xl h-[min(800px,90vh)] flex rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white/80 backdrop-blur-xl border border-white/20 z-10 m-4">
        {/* Columna Izquierda: Imagen/Ilustración Decorativa (Solo Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[#003366] items-center justify-center p-12 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.unt.edu.pe/images/unt_bg_pattern.png')] bg-repeat opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-transparent" />
          
          <div className="relative z-10 text-center space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl inline-block border border-white/20 shadow-2xl">
              <div className="h-32 w-32 flex items-center justify-center bg-white rounded-2xl p-2">
                <img 
                  src="/logount.png" 
                  alt="UNT Logo" 
                  className="h-28 w-auto object-contain"
                />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white tracking-tight leading-tight">
                Sistema de Gestión <br /> de Horarios
              </h2>
              <div className="h-1.5 w-24 bg-yellow-400 mx-auto rounded-full" />
              <p className="text-blue-100 text-lg font-medium max-w-sm mx-auto leading-relaxed">
                Escuela de Ingeniería de Sistemas <br />
                <span className="text-sm opacity-80 uppercase tracking-widest">Excelencia Académica</span>
              </p>
            </div>
          </div>

          {/* Círculos decorativos */}
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-400/10 rounded-full blur-2xl" />
        </div>

        {/* Columna Derecha: Formulario */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white/40 overflow-y-auto">
          <div className="w-full max-w-md animate-in fade-in zoom-in duration-700">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}