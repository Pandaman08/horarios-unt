"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { User, ShieldCheck, Headphones } from "lucide-react";

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
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="text-center mb-8">
        <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
          <ShieldCheck className="text-white h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">SGH - UNT</h1>
        <p className="text-gray-500 text-sm mt-1">Ingeniería de Sistemas</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-8">
        <button 
          onClick={() => fillLogin('admin')}
          className="flex flex-col items-center p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
        >
          <ShieldCheck className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 mb-1" />
          <span className="text-[10px] font-bold text-gray-500 group-hover:text-indigo-700">ADMIN</span>
        </button>
        <button 
          onClick={() => fillLogin('operador')}
          className="flex flex-col items-center p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all group"
        >
          <Headphones className="h-5 w-5 text-gray-400 group-hover:text-blue-600 mb-1" />
          <span className="text-[10px] font-bold text-gray-500 group-hover:text-blue-700">OPERADOR</span>
        </button>
        <button 
          onClick={() => fillLogin('docente')}
          className="flex flex-col items-center p-2 rounded-xl border border-gray-100 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
        >
          <User className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 mb-1" />
          <span className="text-[10px] font-bold text-gray-500 group-hover:text-emerald-700">DOCENTE</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            placeholder="ejemplo@unt.edu.pe"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium border border-red-100 flex items-center">
            <XCircle className="h-4 w-4 mr-2" /> {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
        >
          {loading ? "Verificando..." : "Ingresar al Sistema"}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
          © {new Date().getFullYear()} Universidad Nacional de Trujillo
        </p>
      </div>
    </div>
  );
}

import { XCircle as XCircleIcon } from "lucide-react";
