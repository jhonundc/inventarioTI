"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart, Download, FileSpreadsheet, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Estadisticas = {
  totalSoporte: number;
  totalSoportePendiente: number;
  totalSoporteProceso: number;
  totalSoporteAtendido: number;
  totalSoporteDerivado: number;
};

export default function ReportesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState("");
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) return;
        const data = await res.json();
        setRole(String(data?.user?.role || "").toLowerCase());
      } catch (error) {
        console.error("Error cargando sesión:", error);
      }
    };

    const loadStats = async () => {
      try {
        const res = await fetch("/api/dashboard/estadisticas");
        if (!res.ok) {
          throw new Error("No se pudieron cargar las estadísticas");
        }
        const data = await res.json();
        setStats({
          totalSoporte: data.totales.totalSoporte,
          totalSoportePendiente: data.totales.totalSoportePendiente,
          totalSoporteProceso: data.totales.totalSoporteProceso,
          totalSoporteAtendido: data.totales.totalSoporteAtendido,
          totalSoporteDerivado: data.totales.totalSoporteDerivado,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
    loadStats();
  }, []);

  useEffect(() => {
    if (!role) return;
    if (role.includes("soporte") && pathname !== "/" && pathname !== "/reportes") {
      router.replace("/reportes");
    }
  }, [role, pathname, router]);

  const handleExport = async () => {
    setExporting(true);
    setMessage("");

    try {
      const res = await fetch("/api/soporte/ficha/exportar");
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "Error al generar el archivo");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fichas_soporte_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage("Reporte generado correctamente.");
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "No se pudo generar el reporte.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
            <p className="text-slate-500 text-sm">
              Genera y descarga los reportes de soporte. Esta vista está orientada a usuarios de soporte.
            </p>
          </div>
          <Button onClick={handleExport} disabled={exporting} className="gap-2 bg-slate-800 hover:bg-slate-900">
            <Download className="w-4 h-4" />
            {exporting ? "Generando..." : "Descargar reporte CSV"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Fichas Totales</CardTitle>
            <CardDescription>Todos los tickets de soporte registrados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {loading ? "..." : stats?.totalSoporte ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Pendientes</CardTitle>
            <CardDescription>Tickets que aún no fueron atendidos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {loading ? "..." : stats?.totalSoportePendiente ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">En Progreso</CardTitle>
            <CardDescription>Trabajos de soporte que están en curso.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {loading ? "..." : stats?.totalSoporteProceso ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Atendidas</CardTitle>
            <CardDescription>Tickets resueltos o cerrados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {loading ? "..." : stats?.totalSoporteAtendido ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Derivadas</CardTitle>
            <CardDescription>Tickets que se derivaron a otro equipo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {loading ? "..." : stats?.totalSoporteDerivado ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {message && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <span>{message}</span>
          </div>
        </div>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Indicaciones</CardTitle>
          <CardDescription>Accede a los datos de soporte y genera tu reporte en CSV.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-slate-600">
          <div className="flex items-start gap-2">
            <FileSpreadsheet className="mt-1 h-5 w-5 text-slate-400" />
            <p>El botón generará un archivo descargable con los registros de fichas de soporte.</p>
          </div>
          <div className="flex items-start gap-2">
            <BarChart className="mt-1 h-5 w-5 text-slate-400" />
            <p>El reporte incluye estado del ticket, responsable, datos del bien y firmas.</p>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-1 h-5 w-5 text-slate-400" />
            <p>Los usuarios de soporte tienen acceso restringido a este panel y no pueden acceder a la configuración administrativa.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
