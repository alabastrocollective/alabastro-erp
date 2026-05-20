"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { signInWithEmail, getCurrentSessionUser } from "~/services/authService";
import { useAuthStore } from "~/store/authStore";
import { useLoadingStore } from "~/store/loadingStore";
import { toast } from "sonner";
import { getAppName, getLogoLightPath, getPrimaryColor, getSecondaryColor } from "~/lib/erpBranding";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, hasHydrated } = useAuthStore();
  const { setLoading: setGlobal } = useLoadingStore();
  const navigate = useNavigate();

  const primary = getPrimaryColor();
  const secondary = getSecondaryColor();

  useEffect(() => {
    if (hasHydrated && isAuthenticated) navigate("/", { replace: true });
  }, [hasHydrated, isAuthenticated, navigate]);

  useEffect(() => {
    getCurrentSessionUser().then(({ user }) => {
      if (user) {
        login(user as any);
        navigate("/", { replace: true });
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setGlobal(true);
    try {
      const { data, error } = await signInWithEmail(email.trim(), password);
      if (error) {
        toast.error(error.message || "Credenciales incorrectas");
        return;
      }
      if (data?.user) {
        login(data.user as any);
        toast.success("Sesión iniciada");
        navigate("/", { replace: true });
      }
    } finally {
      setLoading(false);
      setGlobal(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">
      {/* Móvil: franja de marca arriba */}
      <div
        className="flex shrink-0 items-center justify-center gap-3 py-5 px-6 lg:hidden"
        style={{ backgroundColor: primary }}
      >
        <img src={getLogoLightPath()} alt="" className="h-11 w-auto max-w-[200px] object-contain" />
      </div>

      {/* Columna formulario (~65% en desktop) */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8 lg:w-[65%] lg:py-12"
        style={{ backgroundColor: secondary }}
      >
        <div className="w-full max-w-md">
          <h1
            className="mb-8 text-center text-2xl font-bold tracking-wide text-balance uppercase sm:text-3xl"
            style={{ color: primary }}
          >
            {getAppName()}
          </h1>

          <Card className="border-0 shadow-xl shadow-black/10">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold" style={{ color: primary }}>
                Iniciar sesión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="auth-email" className="text-sm font-medium" style={{ color: primary }}>
                    Correo
                  </Label>
                  <Input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                    autoComplete="email"
                    className="h-11 rounded-lg border-slate-200/80 bg-slate-50/90 text-slate-900 placeholder:text-slate-400 focus-visible:border-primary-blue/40 focus-visible:ring-2 focus-visible:ring-primary-blue/25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-password" className="text-sm font-medium" style={{ color: primary }}>
                    Contraseña
                  </Label>
                  <Input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="h-11 rounded-lg border-slate-200/80 bg-slate-50/90 text-slate-900 placeholder:text-slate-400 focus-visible:border-primary-blue/40 focus-visible:ring-2 focus-visible:ring-primary-blue/25"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-lg text-base font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                  style={{ backgroundColor: primary }}
                >
                  {loading ? "Iniciando sesión…" : "Iniciar sesión"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Panel marca (~35%, solo desktop) */}
      <div
        className="relative hidden w-[35%] shrink-0 flex-col items-center justify-center p-10 lg:flex"
        style={{ backgroundColor: primary }}
      >
        <img
          src={getLogoLightPath()}
          alt={getAppName()}
          className="max-h-[min(40vh,320px)] w-auto max-w-[85%] object-contain drop-shadow-sm"
        />
      </div>
    </div>
  );
}
