"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { User, ShieldCheck, Headphones, XCircle, Mail, Lock, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fillLogin = (role: 'admin' | 'operador' | 'docente') => {
    const creds = {
      admin: { email: 'admin@unt.edu.pe', pass: '123456' },
      operador: { email: 'operador@unt.edu.pe', pass: '123456' },
      docente: { email: 'roberto@unt.edu.pe', pass: '123456' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Credenciales incorrectas o usuario inactivo");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Error de conexión, intente nuevamente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="lg:hidden text-center mb-10">
        <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-200 border-4 border-[#003366] p-2">
          <img 
            src="/logount.png" 
            alt="UNT Logo" 
            className="h-14 w-auto object-contain"
          />
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">SGH - UNT</h1>
        <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.2em] mt-1">Ingeniería de Sistemas</p>
      </div>

      <div className="hidden lg:block mb-10">
        <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Bienvenido</h3>
        <p className="text-gray-500 font-medium">Inicia sesión para gestionar tus horarios académicos.</p>
      </div>

      <div className="bg-blue-50/50 rounded-2xl p-2 mb-8 flex gap-2 border border-blue-100">
        <button 
          onClick={() => fillLogin('admin')}
          className="flex-1 flex flex-col items-center py-3 rounded-xl hover:bg-white hover:shadow-sm transition-all group relative"
        >
          <div className="bg-white p-2 rounded-lg mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-5 w-5 text-blue-900" />
          </div>
          <span className="text-[10px] font-black text-blue-900/60 group-hover:text-blue-900 tracking-wider">ADMIN</span>
        </button>
        <button 
          onClick={() => fillLogin('operador')}
          className="flex-1 flex flex-col items-center py-3 rounded-xl hover:bg-white hover:shadow-sm transition-all group relative"
        >
          <div className="bg-white p-2 rounded-lg mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
            <Headphones className="h-5 w-5 text-blue-700" />
          </div>
          <span className="text-[10px] font-black text-blue-700/60 group-hover:text-blue-700 tracking-wider">OPERADOR</span>
        </button>
        <button 
          onClick={() => fillLogin('docente')}
          className="flex-1 flex flex-col items-center py-3 rounded-xl hover:bg-white hover:shadow-sm transition-all group relative"
        >
          <div className="bg-white p-2 rounded-lg mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
            <User className="h-5 w-5 text-emerald-600" />
          </div>
          <span className="text-[10px] font-black text-emerald-600/60 group-hover:text-emerald-600 tracking-wider">DOCENTE</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 group">
          <label className="text-sm font-bold text-gray-700 ml-1 group-focus-within:text-[#003366] transition-colors">
            Correo Institucional
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#003366] transition-colors">
              <Mail className="h-5 w-5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#003366] focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400 font-medium"
              placeholder="usuario@correo.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2 group">
          <label className="text-sm font-bold text-gray-700 ml-1 group-focus-within:text-[#003366] transition-colors">
            Contraseña
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#003366] transition-colors">
              <Lock className="h-5 w-5" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#003366] focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400 font-medium"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center animate-in fade-in slide-in-from-top-2 duration-300">
            <XCircle className="h-5 w-5 mr-3 flex-shrink-0" /> {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-8 rounded-2xl bg-[#003366] hover:bg-[#002244] text-white font-black text-lg shadow-xl shadow-blue-900/20 hover:shadow-blue-900/30 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="h-6 w-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Ingresar al Sistema
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            Servidores Activos • UNT {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

