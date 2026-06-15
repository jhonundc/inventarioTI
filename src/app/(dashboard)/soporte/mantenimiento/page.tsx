"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Search, PencilLine, Plus, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const fetchHistorialMantenimiento = async () => {
  const res = await fetch("/api/soporte/mantenimiento");
  if (!res.ok) throw new Error("Error al cargar el historial de mantenimiento");
  return res.json();
};

export default function MantenimientoPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMnt, setSelectedMnt] = useState<any>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const { data: historialMantenimiento = [], isLoading } = useQuery({
    queryKey: ["historialMantenimiento"],
    queryFn: fetchHistorialMantenimiento,
  });

  const filteredItems = useMemo(() => {
    const source = Array.isArray(historialMantenimiento) ? historialMantenimiento : [];
    const term = (searchTerm || "").toLowerCase().trim();

    if (!term) return source;

    return source.filter((item: any) => {
      const haystack = [
        String(item.IdHistorial || ""),
        String(item.IdBien || ""),
        String(item.CodigoPatrimonial || ""),
        String(item.BienDescripcion || ""),
        String(item.Area || ""),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [historialMantenimiento, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Programación de Mantenimiento</h1>
          <p className="text-slate-500 text-sm">Consulta y filtra los mantenimientos programados por código, patrimonial o área.</p>
        </div>

        <Button
          className="inline-flex items-center justify-center rounded-lg bg-[#bd1e2e] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-900/20 transition-all hover:bg-[#a61a28]"
          onClick={() => {
            setSelectedMnt(null);
            setIsReadOnly(false);
            setIsFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Programación
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por código, patrimonial o área..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1100px] text-sm text-left text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Código</th>
              <th className="px-4 py-3 font-semibold">Bien / Equipo</th>
              <th className="px-4 py-3 font-semibold">Cód. Patrimonial</th>
              <th className="px-4 py-3 font-semibold">Área</th>
              <th className="px-4 py-3 font-semibold">Tipo Mant.</th>
              <th className="px-4 py-3 font-semibold">Fecha Programada</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Usuario Reg.</th>
              <th className="px-4 py-3 text-center font-semibold">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-slate-500">Cargando historial de mantenimiento...</td>
              </tr>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item: any) => (
                <tr key={item.IdHistorial} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.IdHistorial}</td>
                  <td className="px-4 py-3">{item.BienDescripcion || "-"}</td>
                  <td className="px-4 py-3">{item.CodigoPatrimonial || "-"}</td>
                  <td className="px-4 py-3">{item.Area || "-"}</td>
                  <td className="px-4 py-3">{item.TipoMantenimiento || "-"}</td>
                  <td className="px-4 py-3">{item.FechaMantenimiento ? new Date(item.FechaMantenimiento).toLocaleDateString("es-PE") : "-"}</td>
                  <td className="px-4 py-3">{item.Estado || "-"}</td>
                  <td className="px-4 py-3">{item.UsuarioRegistro || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                        title="Ver detalle"
                        onClick={() => {
                          setSelectedMnt(item);
                          setIsReadOnly(true);
                          setIsFormOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        title="Editar"
                        onClick={() => {
                          setSelectedMnt(item);
                          setIsReadOnly(false);
                          setIsFormOpen(true);
                        }}
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Eliminar"
                        onClick={() => {
                          if (window.confirm("¿Desea eliminar esta programación de mantenimiento?")) {
                            // Eliminación local temporal hasta que exista el endpoint real.
                            console.info("Eliminar mantenimiento", item.IdHistorial);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                        title="Imprimir"
                        onClick={() => setIsExportOpen(true)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-slate-500">No hay registros que coincidan con la búsqueda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-white sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              {selectedMnt ? (isReadOnly ? "Detalle de programación" : "Editar programación") : "Nueva programación de mantenimiento"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-700">
              <span>Código</span>
              <Input value={selectedMnt?.IdHistorial || ""} disabled={isReadOnly} />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              <span>Bien / Equipo</span>
              <Input value={selectedMnt?.BienDescripcion || ""} disabled={isReadOnly} />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              <span>Cód. Patrimonial</span>
              <Input value={selectedMnt?.CodigoPatrimonial || ""} disabled={isReadOnly} />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              <span>Área</span>
              <Input value={selectedMnt?.Area || ""} disabled={isReadOnly} />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              <span>Tipo Mant.</span>
              <Input value={selectedMnt?.TipoMantenimiento || ""} disabled={isReadOnly} />
            </label>
            <label className="space-y-1 text-sm text-slate-700">
              <span>Fecha Programada</span>
              <Input value={selectedMnt?.FechaMantenimiento || ""} disabled={isReadOnly} />
            </label>
            <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
              <span>Estado</span>
              <Input value={selectedMnt?.Estado || ""} disabled={isReadOnly} />
            </label>
            <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
              <span>Usuario Reg.</span>
              <Input value={selectedMnt?.UsuarioRegistro || ""} disabled={isReadOnly} />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="border-slate-200 text-slate-700 hover:bg-slate-50">
              {isReadOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!isReadOnly && (
              <Button type="button" className="bg-[#bd1e2e] hover:bg-[#a61a28] text-white">
                Guardar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="bg-white sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">Exportar / Imprimir</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">Aquí se podrá exportar a PDF/Excel la programación seleccionada.</p>
          <div className="flex justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setIsExportOpen(false)} className="border-slate-200 text-slate-700 hover:bg-slate-50">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
