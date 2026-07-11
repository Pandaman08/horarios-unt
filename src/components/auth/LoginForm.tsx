"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { User, ShieldCheck, Headphones, XCircle, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

  const fillLogin = async (role: 'admin' | 'operador' | 'docente' | 'decano' | 'director_departamento') => {
    const creds = {
      admin: { email: 'admin@unitru.edu.pe', pass: '00000000' },
      operador: { email: 'dvalerianorodriguez@unitru.edu.pe', pass: '80000001' },
      docente: { email: 'eagredagamboa@unitru.edu.pe', pass: '18161457' },
      decano: { email: 'ireyeslopez@unitru.edu.pe', pass: '17898446' },
      director_departamento: { email: 'lboychavil@unitru.edu.pe', pass: '18842081' },
    };

    setEmail(creds[role].email);
    setPassword(creds[role].pass);

    // Iniciar sesión automáticamente
    setLoading(true);
    setError("");
    try {
      const res = await signIn("credentials", {
        email: creds[role].email,
        password: creds[role].pass,
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
        <div className="bg-card w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary/20 border-4 border-primary p-2">
          <img
            src="/logount.png"
            alt="UNT Logo"
            className="h-14 w-auto object-contain"
          />
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">SGH - UNT</h1>
        <p className="text-primary font-bold text-xs uppercase tracking-[0.2em] mt-1">Ingeniería de Sistemas</p>
      </div>

      <div className="hidden lg:block mb-10">
        <h3 className="text-3xl font-black text-foreground tracking-tight mb-2">Bienvenido</h3>
        <p className="text-muted-foreground font-medium">Inicia sesión para gestionar tus horarios académicos.</p>
      </div>

      <div className="bg-muted/50 rounded-2xl p-2 mb-8 border border-border">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => fillLogin('admin')}
            className="flex-shrink-0 min-w-[100px] flex flex-col items-center py-3 px-2 rounded-xl hover:bg-card hover:shadow-sm transition-all group relative"
          >
            <div className="bg-card p-2 rounded-lg mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-black text-muted-foreground group-hover:text-primary tracking-wider uppercase">ADMIN</span>
          </button>
          <button
            onClick={() => fillLogin('operador')}
            className="flex-shrink-0 min-w-[100px] flex flex-col items-center py-3 px-2 rounded-xl hover:bg-card hover:shadow-sm transition-all group relative"
          >
            <div className="bg-card p-2 rounded-lg mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
              <Headphones className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-black text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 tracking-wider uppercase">OPERADOR</span>
          </button>
          <button
            onClick={() => fillLogin('docente')}
            className="flex-shrink-0 min-w-[100px] flex flex-col items-center py-3 px-2 rounded-xl hover:bg-card hover:shadow-sm transition-all group relative"
          >
            <div className="bg-card p-2 rounded-lg mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
              <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-black text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 tracking-wider uppercase">DOCENTE</span>
          </button>
          <button
            onClick={() => fillLogin('decano')}
            className="flex-shrink-0 min-w-[100px] flex flex-col items-center py-3 px-2 rounded-xl hover:bg-card hover:shadow-sm transition-all group relative"
          >
            <div className="bg-card p-2 rounded-lg mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-xs font-black text-muted-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 tracking-wider uppercase">DECANO</span>
          </button>
          <button
            onClick={() => fillLogin('director_departamento')}
            className="flex-shrink-0 min-w-[100px] flex flex-col items-center py-3 px-2 rounded-xl hover:bg-card hover:shadow-sm transition-all group relative"
          >
            <div className="bg-card p-2 rounded-lg mb-1.5 shadow-sm group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-xs font-black text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 tracking-wider uppercase">JEFE DEPARTAMENTO</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 group">
          <label className="text-sm font-bold text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">
            Correo Institucional
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Mail className="h-5 w-5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-border bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/50 font-medium text-foreground"
              placeholder="usuario@correo.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2 group">
          <label className="text-sm font-bold text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">
            Contraseña
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <Lock className="h-5 w-5" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-4 rounded-2xl border-2 border-border bg-muted/20 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/50 font-medium text-foreground"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-2xl text-sm font-bold border border-destructive/20 flex items-center animate-in fade-in slide-in-from-top-2 duration-300">
            <XCircle className="h-5 w-5 mr-3 flex-shrink-0" /> {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full py-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg shadow-xl shadow-primary/20 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="h-6 w-6 border-4 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              Ingresar al Sistema
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
          <p className="text-xs text-primary font-black uppercase tracking-widest">
            Modo demo — SSO institucional simulado
          </p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full border border-border">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">
            Servidores Activos • UNT {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

