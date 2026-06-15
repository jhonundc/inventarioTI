"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Sparkles, Eye, Edit, Trash2, Search, Ticket, Clock, Wrench, CheckCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ReportesFichasPage() {
  const router = useRouter();

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  const [stats, setStats] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/soporte/ficha");
      if (!res.ok) throw new Error("Error cargando fichas");
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setMessage("No se pudieron cargar las fichas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true);
      try {
        const res = await fetch("/api/dashboard/estadisticas");
        if (!res.ok) throw new Error("No se pudieron cargar estadísticas");
        const data = await res.json();
        setStats(data?.totales ?? null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, []);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return records.filter((r) => {
      // filtro fecha
      if (startDate) {
        const fecha = r.FechaRegistro ? new Date(r.FechaRegistro) : null;
        if (!fecha || fecha < new Date(startDate)) return false;
      }
      if (endDate) {
        const fecha = r.FechaRegistro ? new Date(r.FechaRegistro) : null;
        if (!fecha || fecha > new Date(endDate + "T23:59:59")) return false;
      }

      if (!term) return true;

      const checks = [
        r.NumeroFicha,
        r.Responsable,
        r.Dependencia,
        r.Ambiente,
        r.DescripcionProblema,
        r.TrabajosRealizados,
        r.Diagnostico,
        r.Recomendacion,
        r.Bien?.CodigoInventario,
        r.Bien?.CodigoPatrimonial,
        r.Bien?.NumeroSerie,
        r.Bien?.Descripcion,
      ];

      return checks.some((c) => (String(c || "").toLowerCase().includes(term)));
    });
  }, [records, searchTerm, startDate, endDate]);

  const handleExport = async () => {
    setExporting(true);
    setMessage("");
    try {
      // enviar filtros al endpoint de exportar si soporta query params
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (searchTerm) params.set("q", searchTerm);

      const url = `/api/soporte/ficha/exportar?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Error al generar exportación");
      }

      const blob = await res.blob();
      const link = document.createElement("a");
      const objectUrl = window.URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = `fichas_soporte_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
      setMessage("Exportación completada");
    } catch (e: any) {
      console.error(e);
      setMessage(e?.message || "Error en exportación");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta ficha?")) return;
    try {
      const res = await fetch(`/api/soporte/ficha?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      await loadRecords();
      setMessage("Ficha eliminada");
    } catch (e) {
      console.error(e);
      setMessage("No se pudo eliminar la ficha");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Registro de fichas</h1>
          <p className="text-slate-500 text-sm">Listado, filtros, export y acciones sobre fichas de soporte.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadRecords}>
            Recargar
          </Button>
        </div>
      </div>

      {/* Estadísticas de tickets */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <Card className="border-none shadow-sm border-l-4 border-blue-600 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Total fichas</CardTitle>
            <CardDescription>Todos los tickets registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{loadingStats ? "..." : stats?.totalSoporte ?? records.length}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm border-l-4 border-amber-600 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Pendientes</CardTitle>
            <CardDescription>Tickets que aún no fueron atendidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">{loadingStats ? "..." : stats?.totalSoportePendiente ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm border-l-4 border-indigo-600 bg-indigo-50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">En Progreso</CardTitle>
            <CardDescription>Tickets en atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-800">{loadingStats ? "..." : stats?.totalSoporteProceso ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm border-l-4 border-green-600 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Atendidas</CardTitle>
            <CardDescription>Tickets finalizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{loadingStats ? "..." : stats?.totalSoporteAtendido ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm border-l-4 border-purple-600 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Derivadas</CardTitle>
            <CardDescription>Tickets derivados a otra área</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{loadingStats ? "..." : stats?.totalSoporteDerivado ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Card Registros */}
      <Card className="border">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Registros</CardTitle>
            <CardDescription>Lista de fichas filtrable y exportable</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExport} disabled={exporting} className="gap-2 bg-slate-800 hover:bg-slate-900">
              <Download className="w-4 h-4" />
              {exporting ? "Generando..." : "Descargar"}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 items-center mb-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input className="pl-10" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="overflow-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs">
                <tr>
                  <th className="p-3 text-left">Nº Ficha</th>
                  <th className="p-3 text-left">Responsable</th>
                  <th className="p-3 text-left">Dependencia</th>
                  <th className="p-3 text-left">Bien</th>
                  <th className="p-3 text-left">Fecha</th>
                  <th className="p-3 text-left">Estado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-6 text-center">Cargando...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center">No hay registros</td></tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={r.IdSoporte} className="border-t hover:bg-slate-50 transition-colors text-xs">
                      <td className="p-3 font-medium text-slate-700">{r.NumeroFicha || '-'}</td>
                      <td className="p-3">{r.Responsable || '-'}</td>
                      <td className="p-3">{r.Dependencia || '-'}</td>
                      <td className="p-3">{r.Bien?.Descripcion || r.Bien?.CodigoInventario || '-'}</td>
                      <td className="p-3">{r.FechaRegistro ? new Date(r.FechaRegistro).toLocaleString() : '-'}</td>
                      <td className="p-3">{r.Estado?.EstadoBien || '-'}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-teal-600" onClick={() => { setViewingRecord(r); setViewOpen(true); }} title="Ver">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => router.push(`/soporte/ficha?id=${r.IdSoporte}`)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleDelete(r.IdSoporte)} title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {message && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* VIEW DIALOG */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="bg-white sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Ficha</DialogTitle>
            <DialogDescription>Vista detallada de la ficha seleccionada.</DialogDescription>
          </DialogHeader>

          {viewingRecord && (
            <div className="space-y-6 p-4 border rounded-lg bg-white text-slate-800">
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">UNIDAD DE ESTADISTICA E INFORMATICA</p>
                  <h2 className="text-base font-extrabold text-slate-800 mt-1">FICHA DE SOPORTE TÉCNICO</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold bg-slate-100 px-3 py-1 rounded border text-slate-800 inline-block">Nº {viewingRecord.NumeroFicha || '-'}</p>
                  <p className="text-[10px] text-slate-500 mt-1.5">Fecha: {viewingRecord.FechaRegistro ? new Date(viewingRecord.FechaRegistro).toLocaleString() : '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-[11px] bg-slate-50 p-3 rounded border">
                <div>
                  <span className="font-bold block text-slate-500">RESPONSABLE DEL BIEN</span>
                  <span className="font-medium text-xs text-slate-800">{viewingRecord.Responsable || '-'}</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-500">DEPENDENCIA (ÁREA)</span>
                  <span className="font-medium text-xs text-slate-800">{viewingRecord.Dependencia || '-'}</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-500">AMBIENTE</span>
                  <span className="font-medium text-xs text-slate-800">{viewingRecord.Ambiente || '-'}</span>
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">II. Detalle Técnico del Bien</h3>
                <div className="border border-t-0 rounded-b overflow-hidden">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b">
                        <th className="p-2 border-r font-bold">Código Inventario</th>
                        <th className="p-2 border-r font-bold">Código Patrimonial</th>
                        <th className="p-2 border-r font-bold">Bien / Descripción</th>
                        <th className="p-2 border-r font-bold">Marca</th>
                        <th className="p-2 border-r font-bold">Modelo</th>
                        <th className="p-2 font-bold">Nº Serie</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2 border-r border-b">{viewingRecord.Bien?.CodigoInventario || '-'}</td>
                        <td className="p-2 border-r border-b">{viewingRecord.Bien?.CodigoPatrimonial || '-'}</td>
                        <td className="p-2 border-r border-b">{viewingRecord.Bien?.Descripcion || '-'}</td>
                        <td className="p-2 border-r border-b">{viewingRecord.Bien?.Marca?.Marca || '-'}</td>
                        <td className="p-2 border-r border-b">{viewingRecord.Bien?.Modelo?.Modelo || '-'}</td>
                        <td className="p-2 border-b">{viewingRecord.Bien?.NumeroSerie || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">V. Trabajos Realizados</h3>
                  <div className="border border-t-0 p-3 rounded-b min-h-[50px] text-xs whitespace-pre-wrap">{viewingRecord.TrabajosRealizados || 'Ninguno'}</div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">VI. Diagnóstico</h3>
                  <div className="border border-t-0 p-3 rounded-b min-h-[50px] text-xs whitespace-pre-wrap">{viewingRecord.Diagnostico || 'Ninguno'}</div>
                </div>

                <div>
                  <h3 className="text-[11px] font-bold bg-slate-800 text-white px-2.5 py-1 uppercase tracking-wider rounded-t">VII. Recomendaciones</h3>
                  <div className="border border-t-0 p-3 rounded-b min-h-[50px] text-xs whitespace-pre-wrap">{viewingRecord.Recomendacion || 'Ninguna'}</div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewOpen(false)}>Cerrar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
