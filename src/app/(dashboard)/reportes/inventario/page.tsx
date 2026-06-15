"use client";

import { useEffect, useState, useMemo } from "react";
import { Download, Sparkles, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import BienFormModal from "@/components/inventory/BienFormModal";
import ComponenteFormModal from "@/components/inventory/ComponenteFormModal";
import SoftwareFormModal from "@/components/inventory/SoftwareFormModal";

type InventarioStats = {
  totalBienes: number;
  totalBienesActivos: number;
  totalBienesInactivos: number;
  totalComponentes: number;
  totalSoftware: number;
};

type FilterType = "bienes" | "componentes" | "software";

export default function ReportesInventarioPage() {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState<InventarioStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  const [filterType, setFilterType] = useState<FilterType>("bienes");
  const [records, setRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeFilter, setActiveFilter] = useState<"todos" | "activos" | "inactivos">("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [modalRecord, setModalRecord] = useState<any | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch("/api/dashboard/estadisticas");
        if (!res.ok) throw new Error("No se pudieron cargar las estadísticas");
        const data = await res.json();
        setStats({
          totalBienes: data.totales.totalBienes,
          totalBienesActivos: data.totales.totalBienesActivos,
          totalBienesInactivos: data.totales.totalBienesInactivos,
          totalComponentes: data.totales.totalComponentes,
          totalSoftware: data.totales.totalSoftware,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    loadRecords();
  }, [filterType]);

  // Extraer función de carga para reutilizar
  async function loadRecords() {
    setLoadingRecords(true);
    try {
      let url = "";
      if (filterType === "bienes") {
        url = "/api/bienes";
      } else if (filterType === "componentes") {
        url = "/api/componentes";
      } else if (filterType === "software") {
        url = "/api/software";
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error al cargar ${filterType}`);
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }

  const handleExport = async () => {
    setExporting(true);
    setMessage("");
    try {
      // Determinar endpoint según el tipo de filtro actual
      let exportUrl = "";
      let filenameType = "inventario";
      if (filterType === "bienes") {
        exportUrl = "/api/bienes/exportar";
        filenameType = "bienes";
      } else if (filterType === "componentes") {
        exportUrl = "/api/componentes/exportar";
        filenameType = "componentes";
      } else if (filterType === "software") {
        exportUrl = "/api/software/exportar";
        filenameType = "software";
      }

      const res = await fetch(exportUrl);
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "Error al generar el archivo");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inventario_${filenameType}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage(`Reporte de ${filenameType} generado correctamente.`);
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "No se pudo generar el reporte.");
    } finally {
      setExporting(false);
    }
  };

  const statsItems = [
    {
      label: "Bienes",
      value: stats?.totalBienes ?? 0,
      description: "Total",
      className: "border-none shadow-sm border-l-4 border-blue-600 bg-blue-50",
      labelClass: "text-slate-700",
      valueClass: "text-blue-800",
    },
    {
      label: "Componentes",
      value: stats?.totalComponentes ?? 0,
      description: "Total",
      className: "border-none shadow-sm border-l-4 border-emerald-600 bg-emerald-50",
      labelClass: "text-emerald-800",
      valueClass: "text-emerald-900",
    },
    {
      label: "Software",
      value: stats?.totalSoftware ?? 0,
      description: "Total",
      className: "border-none shadow-sm border-l-4 border-violet-600 bg-violet-50",
      labelClass: "text-violet-800",
      valueClass: "text-violet-900",
    },
  ];

  const filteredRecords = useMemo(() => {
    let result = records;

    // Filtro por búsqueda de texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((record) => {
        if (filterType === "bienes") {
          return (
            (record.Descripcion?.toLowerCase() || "").includes(term) ||
            (record.CodigoInventario?.toLowerCase() || "").includes(term) ||
            (record.CodigoPatrimonial?.toLowerCase() || "").includes(term) ||
            (record.NumeroSerie?.toLowerCase() || "").includes(term)
          );
        } else if (filterType === "componentes") {
          return (
            (record.NombreComponente?.toLowerCase() || "").includes(term) ||
            (record.BienDescripcion?.toLowerCase() || "").includes(term) ||
            (record.Serie?.toLowerCase() || "").includes(term)
          );
        } else if (filterType === "software") {
          return (
            (record.NombreSoftware?.toLowerCase() || "").includes(term) ||
            (record.TipoSoftware?.toLowerCase() || "").includes(term) ||
            (record.VersionSoftware?.toLowerCase() || "").includes(term)
          );
        }
        return true;
      });
    }

    // Filtro por estado activo/inactivo
    if (activeFilter !== "todos") {
      const isActive = activeFilter === "activos";
      result = result.filter((record) => {
        // Handle both boolean and numeric values (true/1 for active, false/0 for inactive)
        const isRecordActive = record.Activo === 1 || record.Activo === true;
        return isActive ? isRecordActive : !isRecordActive;
      });
    }

    // Filtro por fechas
    if (startDate || endDate) {
      result = result.filter((record) => {
        const recordDate = record.FechaRegistro ? new Date(record.FechaRegistro) : null;
        
        if (!recordDate) return true;

        if (startDate) {
          const start = new Date(startDate);
          if (recordDate < start) return false;
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (recordDate > end) return false;
        }

        return true;
      });
    }

    return result;
  }, [records, searchTerm, filterType, activeFilter, startDate, endDate]);

  const renderRecordsTable = () => {
    if (loadingRecords) {
      return <div className="p-8 text-center text-slate-500">Cargando registros...</div>;
    }

    if (filteredRecords.length === 0) {
      return <div className="p-8 text-center text-slate-500">No hay registros para mostrar</div>;
    }

    if (filterType === "bienes") {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Código Inventario</th>
                <th className="px-4 py-2 text-left font-semibold">Descripción</th>
                <th className="px-4 py-2 text-left font-semibold">Marca</th>
                <th className="px-4 py-2 text-left font-semibold">Modelo</th>
                <th className="px-4 py-2 text-left font-semibold">Fecha Registro</th>
                <th className="px-4 py-2 text-left font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((bien, idx) => (
                <tr key={idx} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-2">{bien.CodigoInventario || "-"}</td>
                  <td className="px-4 py-2">{bien.Descripcion || "-"}</td>
                  <td className="px-4 py-2">{bien.Marca?.Marca || "-"}</td>
                  <td className="px-4 py-2">{bien.Modelo?.Modelo || "-"}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {bien.FechaRegistro ? new Date(bien.FechaRegistro).toLocaleDateString("es-ES") : "-"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${bien.Activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {bien.Activo ? "Activo" : "Inactivo"}
                      </span>
                      <div className="ml-2 flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setModalRecord(bien); setModalMode("view"); setModalOpen(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setModalRecord(bien); setModalMode("edit"); setModalOpen(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          const ok = confirm("¿Eliminar este bien? Esta acción lo desactivará.");
                          if (!ok) return;
                          try {
                            const res = await fetch(`/api/bienes?id=${encodeURIComponent(String(bien.IdBien))}`, { method: "DELETE" });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || "Error al eliminar");
                            setMessage("Bien eliminado/desactivado correctamente.");
                            await loadRecords();
                          } catch (e: any) {
                            alert(e.message || "Error al eliminar");
                          }
                        }}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (filterType === "componentes") {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Bien</th>
                <th className="px-4 py-2 text-left font-semibold">Componente</th>
                <th className="px-4 py-2 text-left font-semibold">Marca</th>
                <th className="px-4 py-2 text-left font-semibold">Serie</th>
                <th className="px-4 py-2 text-left font-semibold">Fecha Registro</th>
                <th className="px-4 py-2 text-left font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((comp, idx) => (
                <tr key={idx} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-2">{comp.BienDescripcion || "-"}</td>
                  <td className="px-4 py-2">{comp.NombreComponente || "-"}</td>
                  <td className="px-4 py-2">{comp.Marca || "-"}</td>
                  <td className="px-4 py-2">{comp.Serie || "-"}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {comp.FechaRegistro ? new Date(comp.FechaRegistro).toLocaleDateString("es-ES") : "-"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${comp.Activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {comp.Activo ? "Activo" : "Inactivo"}
                      </span>
                      <div className="ml-2 flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setModalRecord(comp); setModalMode("view"); setModalOpen(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setModalRecord(comp); setModalMode("edit"); setModalOpen(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          const ok = confirm("¿Eliminar este componente del bien?");
                          if (!ok) return;
                          try {
                            const idBien = comp.IdBien || comp.IdBienComponente || comp.IdBien || comp.IdBien;
                            const idComponente = comp.IdComponente || comp.IdComponente;
                            const res = await fetch(`/api/componentes?idBien=${encodeURIComponent(String(comp.IdBien))}&idComponente=${encodeURIComponent(String(comp.IdComponente))}`, { method: "DELETE" });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || "Error al eliminar");
                            setMessage("Componente eliminado correctamente.");
                            await loadRecords();
                          } catch (e: any) {
                            alert(e.message || "Error al eliminar");
                          }
                        }}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (filterType === "software") {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Nombre</th>
                <th className="px-4 py-2 text-left font-semibold">Tipo</th>
                <th className="px-4 py-2 text-left font-semibold">Versión</th>
                <th className="px-4 py-2 text-left font-semibold">Licencias</th>
                <th className="px-4 py-2 text-left font-semibold">Fecha Registro</th>
                <th className="px-4 py-2 text-left font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((soft, idx) => (
                <tr key={idx} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-2">{soft.NombreSoftware || "-"}</td>
                  <td className="px-4 py-2">{soft.TipoSoftware || "-"}</td>
                  <td className="px-4 py-2">{soft.VersionSoftware || "-"}</td>
                  <td className="px-4 py-2">{soft.CantidadLicencias || "-"}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {soft.FechaRegistro ? new Date(soft.FechaRegistro).toLocaleDateString("es-ES") : "-"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${soft.Activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {soft.Activo ? "Activo" : "Inactivo"}
                      </span>
                      <div className="ml-2 flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setModalRecord(soft); setModalMode("view"); setModalOpen(true); }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setModalRecord(soft); setModalMode("edit"); setModalOpen(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          const ok = confirm("¿Eliminar este software? Será desactivado.");
                          if (!ok) return;
                          try {
                            const res = await fetch(`/api/software?id=${encodeURIComponent(String(soft.IdSoftware))}`, { method: "DELETE" });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || "Error al eliminar");
                            setMessage("Software desactivado correctamente.");
                            await loadRecords();
                          } catch (e: any) {
                            alert(e.message || "Error al eliminar");
                          }
                        }}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Registro de inventario</h1>
            <p className="text-slate-500 text-sm">
              Descarga el reporte de inventario de bienes. Usa el menú de Reportes para cambiar entre registros de inventario y registros de fichas.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {statsItems.map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl border px-4 py-3 text-sm ${item.className}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className={`font-medium ${item.labelClass || 'text-slate-700'}`}>{item.label}</p>
              <p className={`text-lg font-semibold ${item.valueClass || ''}`}>{loadingStats ? "..." : item.value}</p>
            </div>
            <p className="mt-1 text-xs text-slate-500">{item.description}</p>
          </div>
        ))}
      </div>

      

      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Registros</CardTitle>
          <CardDescription>Consulta y filtra los registros de inventario.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(["bienes", "componentes", "software"] as FilterType[]).map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setFilterType(type);
                  setSearchTerm("");
                  setStartDate("");
                  setEndDate("");
                  setActiveFilter("todos");
                }}
                className={filterType === type ? "bg-slate-800 hover:bg-slate-900" : ""}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Buscar</label>
              <Input
                type="text"
                placeholder={
                  filterType === "bienes"
                    ? "Descripción, código..."
                    : filterType === "componentes"
                    ? "Componente, bien..."
                    : "Nombre, tipo..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Desde</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Hasta</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Estado</label>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as "todos" | "activos" | "inactivos")}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
              >
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="gap-2 bg-slate-800 hover:bg-slate-900"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Generando..." : `Descargar ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`}
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            {renderRecordsTable()}
          </div>
          
          <div className="text-xs text-slate-500">
            Mostrando {filteredRecords.length} de {records.length} registros
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

      {/* Modales para ver/editar */}
      {modalOpen && filterType === "bienes" && (
        <BienFormModal
          bien={modalRecord}
          open={modalOpen}
          onOpenChange={(open) => setModalOpen(open)}
          readOnly={modalMode === "view"}
        />
      )}
      {modalOpen && filterType === "componentes" && (
        <ComponenteFormModal
          componente={modalRecord}
          open={modalOpen}
          onOpenChange={(open) => setModalOpen(open)}
          readOnly={modalMode === "view"}
        />
      )}
      {modalOpen && filterType === "software" && (
        <SoftwareFormModal
          software={modalRecord}
          open={modalOpen}
          onOpenChange={(open) => setModalOpen(open)}
          readOnly={modalMode === "view"}
        />
      )}
    </div>
  );
}

