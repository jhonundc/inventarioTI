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

  const normalizeSupport = (row: any) => ({
    id: row.IdSoporte,
    tipo: "Soporte",
    numero: row.NumeroFicha,
    unidadOrganica: row.UnidadOrganica,
    responsable: row.Responsable,
    dependencia: row.Dependencia,
    ambiente: row.Ambiente,
    tipoBien: row.TipoBien,
    fechaRegistro: row.FechaRegistro,
    bien: row.Bien || null,
    estado: row.Estado?.EstadoBien || "",
    estadoTicket: row.EstadoTicket || "",
    trabajosRealizados: row.TrabajosRealizados || "",
    diagnostico: row.Diagnostico || "",
    recomendacion: row.Recomendacion || "",
    prioridad: row.Prioridad?.NombrePrioridad || "",
    siglas: row.Siglas || "",
    firmaSoporte: row.FirmaSoporte || "",
    firmaJefeUnidad: row.FirmaJefeUnidad || "",
    firmaAreaUsuario: row.FirmaAreaUsuario || "",
    usuario: row.UsuarioSoporte?.Nombres || row.UsuarioSoporte?.Usuario || "",
    raw: row,
  });

  const normalizeBaja = (row: any) => ({
    id: row.IdBaja,
    tipo: "Baja",
    numero: row.NumeroFichaBaja,
    unidadOrganica: row.UnidadOrganica,
    responsable: row.Responsable,
    dependencia: row.Dependencia,
    ambiente: row.Ambiente,
    tipoBien: row.TipoBien,
    fechaRegistro: row.FechaRegistro,
    bien: row.Bien || null,
    estado: row.Estado?.EstadoBien || "",
    causalBaja: row.CausalBaja || "",
    fundamentacion: row.Fundamentacion || "",
    recomendacion: row.Recomendacion || "",
    observacion: row.Observacion || "",
    usuario: row.UsuarioRegistro?.Nombres || row.UsuarioRegistro?.Usuario || "",
    raw: row,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const StatusBadge = ({ status }: { status?: string }) => {
    const s = (status || "").toLowerCase();
    const classes = s.includes('pend') ? 'bg-amber-100 text-amber-800' : s.includes('progres') ? 'bg-indigo-100 text-indigo-800' : (s.includes('atend') || s === 'atendida') ? 'bg-green-100 text-green-800' : s.includes('deriv') ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800';
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${classes}`}>{status || '-'}</span>;
  }
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<any>(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const [supportRes, bajaRes] = await Promise.all([
        fetch("/api/soporte/ficha"),
        fetch("/api/soporte/baja"),
      ]);

      if (!supportRes.ok) throw new Error("Error cargando fichas de soporte");
      if (!bajaRes.ok) throw new Error("Error cargando fichas de baja");

      const [supportData, bajaData] = await Promise.all([supportRes.json(), bajaRes.json()]);
      const supportRecords = Array.isArray(supportData) ? supportData.map(normalizeSupport) : [];
      const bajaRecords = Array.isArray(bajaData) ? bajaData.map(normalizeBaja) : [];

      setRecords([...supportRecords, ...bajaRecords]);
    } catch (e) {
      console.error(e);
      setMessage("No se pudieron cargar las fichas");
      setRecords([]);
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
        const fecha = r.fechaRegistro ? new Date(r.fechaRegistro) : null;
        if (!fecha || fecha < new Date(startDate)) return false;
      }
      if (endDate) {
        const fecha = r.fechaRegistro ? new Date(r.fechaRegistro) : null;
        if (!fecha || fecha > new Date(endDate + "T23:59:59")) return false;
      }

      if (!term) return true;

      const checks = [
        r.tipo,
        r.numero,
        r.responsable,
        r.dependencia,
        r.ambiente,
        r.tipoBien,
        r.recomendacion,
        r.causalBaja,
        r.fundamentacion,
        r.trabajosRealizados,
        r.diagnostico,
        r.prioridad,
        r.bien?.CodigoInventario,
        r.bien?.CodigoPatrimonial,
        r.bien?.NumeroSerie,
        r.bien?.Descripcion,
        r.usuario,
      ];

      return checks.some((c) => String(c || "").toLowerCase().includes(term));
    });
  }, [records, searchTerm, startDate, endDate]);

  const handleExport = async () => {
    setExporting(true);
    setMessage("");
    try {
      // enviar filtros al endpoint de exportar si soporta query params
      const headers = [
        "Tipo",
        "Nº Ficha",
        "Unidad Orgánica",
        "Fecha Registro",
        "Responsable",
        "Dependencia",
        "Ambiente",
        "Bien",
        "Cod. Inventario",
        "Cod. Patrimonial",
        "Estado",
        "Tipo Bien",
        "Recomendación",
        "Causal de Baja",
        "Fundamentación",
        "Trabajos Realizados",
        "Diagnóstico",
        "Prioridad",
      ];

      const rows = filteredRecords.map((r) => [
        r.tipo,
        r.numero || "",
        r.unidadOrganica || "",
        r.fechaRegistro ? new Date(r.fechaRegistro).toLocaleString("es-PE") : "",
        r.responsable || "",
        r.dependencia || "",
        r.ambiente || "",
        r.bien?.Descripcion || r.bien?.CodigoInventario || "",
        r.bien?.CodigoInventario || "",
        r.bien?.CodigoPatrimonial || "",
        r.estado || "",
        r.tipoBien || "",
        r.recomendacion || "",
        r.causalBaja || "",
        r.fundamentacion || "",
        r.trabajosRealizados || "",
        r.diagnostico || "",
        r.prioridad || "",
      ]);

      const csvContent = [headers.join("\t"), ...rows.map((row) => row.join("\t"))].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const objectUrl = window.URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = `registros_fichas_${new Date().toISOString().slice(0, 10)}.csv`;
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

  const handleDelete = async (record: any) => {
    if (!confirm("¿Está seguro de eliminar esta ficha?")) return;
    try {
      const endpoint = record.tipo === "Baja" ? "/api/soporte/baja" : "/api/soporte/ficha";
      const idKey = record.tipo === "Baja" ? "IdBaja" : "IdSoporte";
      const res = await fetch(`${endpoint}?id=${record.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      await loadRecords();
      setMessage(`Ficha de ${record.tipo.toLowerCase()} eliminada`);
    } catch (e) {
      console.error(e);
      setMessage("No se pudo eliminar la ficha");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-500">Registro de fichas</h1>
          <p className="text-sm text-slate-500 mt-1">Listado, filtros, export y acciones sobre fichas de soporte.</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button onClick={loadRecords} className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
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
            <Button onClick={handleExport} disabled={exporting} className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white shadow">
              <Download className="w-4 h-4" />
              {exporting ? "Generando..." : "Descargar"}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 items-center mb-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-10 pr-10 py-2 rounded-lg shadow-sm border" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2 text-slate-500">✕</button>}
            </div>
            <div className="flex gap-2">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="py-2 rounded-md" />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="py-2 rounded-md" />
            </div>
          </div>

          <div className="overflow-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-900 to-slate-700 text-white text-xs">
                <tr>
                  <th className="p-3 text-left">Nº Ficha</th>
                  <th className="p-3 text-left">Tipo</th>
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
                  <tr><td colSpan={8} className="p-6 text-center">Cargando...</td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center">No hay registros</td></tr>
                ) : (
                  filteredRecords.map((r) => (
                    <tr key={`${r.tipo}-${r.id}`} className="border-t transition-colors text-xs hover:bg-slate-50 odd:bg-white even:bg-slate-50">
                      <td className="p-3 font-medium text-slate-700">{r.numero || '-'}</td>
                      <td className="p-3">{r.tipo || '-'}</td>
                      <td className="p-3">{r.responsable || '-'}</td>
                      <td className="p-3">{r.dependencia || '-'}</td>
                      <td className="p-3">{r.bien?.Descripcion || r.bien?.CodigoInventario || '-'}</td>
                      <td className="p-3">{r.fechaRegistro ? new Date(r.fechaRegistro).toLocaleString() : '-'}</td>
                      <td className="p-3"><StatusBadge status={r.estado} /></td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-teal-600" onClick={() => { setViewingRecord(r); setViewOpen(true); }} title="Ver">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => router.push(`/soporte/${r.tipo === 'Baja' ? 'baja' : 'ficha'}?id=${r.id}`)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleDelete(r)} title="Eliminar">
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
                  <h2 className="text-base font-extrabold text-slate-800 mt-1">FICHA DE {viewingRecord.tipo?.toUpperCase() || 'REGISTRO'}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold bg-slate-100 px-3 py-1 rounded border text-slate-800 inline-block">Nº {viewingRecord.numero || '-'}</p>
                  <p className="text-[10px] text-slate-500 mt-1.5">Fecha: {viewingRecord.fechaRegistro ? new Date(viewingRecord.fechaRegistro).toLocaleString() : '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-[11px] bg-slate-50 p-3 rounded border">
                <div>
                  <span className="font-bold block text-slate-500">RESPONSABLE DEL BIEN</span>
                  <span className="font-medium text-xs text-slate-800">{viewingRecord.responsable || '-'}</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-500">DEPENDENCIA (ÁREA)</span>
                  <span className="font-medium text-xs text-slate-800">{viewingRecord.dependencia || '-'}</span>
                </div>
                <div>
                  <span className="font-bold block text-slate-500">AMBIENTE</span>
                  <span className="font-medium text-xs text-slate-800">{viewingRecord.ambiente || '-'}</span>
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
