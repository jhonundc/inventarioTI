"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, FileText, Search, Eye, Power } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { getCondiciones, getEstados } from "@/app/actions/catalogs";

const fetchBajas = async () => {
  const res = await fetch("/api/soporte/baja");
  if (!res.ok) throw new Error("Error al cargar las fichas de baja");
  return res.json();
};

const fetchBienes = async () => {
  const res = await fetch("/api/bienes");
  if (!res.ok) throw new Error("Error al cargar los bienes");
  return res.json();
};

export default function FichaBajaPage() {
  const [open, setOpen] = useState(false);
  const [editingBaja, setEditingBaja] = useState<any>(null);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  const { data: bajas, isLoading } = useQuery({
    queryKey: ["fichasBaja"],
    queryFn: fetchBajas,
  });

  const { data: bienes } = useQuery({ queryKey: ["bienes"], queryFn: fetchBienes });
  const { data: condiciones } = useQuery({ queryKey: ["condiciones"], queryFn: () => getCondiciones() });
  const { data: estados } = useQuery({ queryKey: ["estados"], queryFn: () => getEstados() });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingBaja ? "PATCH" : "POST";
      const res = await fetch("/api/soporte/baja", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingBaja ? { ...data, IdBaja: editingBaja.IdBaja } : data),
      });
      if (!res.ok) throw new Error(`Error al ${editingBaja ? "actualizar" : "crear"} la ficha`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fichasBaja"] });
      setOpen(false);
      reset();
      setEditingBaja(null);
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const handleEdit = (baja: any) => {
    setEditingBaja(baja);
    setValue("NumeroFichaBaja", baja.NumeroFichaBaja);
    setValue("UnidadOrganica", baja.UnidadOrganica || "");
    setValue("IdBien", baja.IdBien?.toString() || "");
    setValue("Responsable", baja.Responsable || "");
    setValue("Dependencia", baja.Dependencia || "");
    setValue("Ambiente", baja.Ambiente || "");
    setValue("TipoBien", baja.TipoBien || "");
    setValue("IdCondicion", baja.IdCondicion?.toString() || "");
    setValue("IdEstadoBien", baja.IdEstadoBien?.toString() || "");
    setValue("Fundamentacion", baja.Fundamentacion || "");
    setValue("Recomendacion", baja.Recomendacion || "");
    setValue("CausalBaja", baja.CausalBaja || "");
    setValue("Observacion", baja.Observacion || "");
    setOpen(true);
  };

  const handleNew = () => {
    setEditingBaja(null);
    reset();
    setValue("NumeroFichaBaja", `FB-${Math.floor(1000 + Math.random() * 9000)}`); // Auto-generate ticket number
    setOpen(true);
  };

  const selectedBien = watch("IdBien");
  const selectedCondicion = watch("IdCondicion");
  const selectedEstado = watch("IdEstadoBien");

  const selectedBienLabel = bienes?.find((b: any) => String(b.IdBien) === String(selectedBien))?.Descripcion || "Seleccionar Bien";
  const selectedCondicionLabel = condiciones?.find((c: any) => String(c.IdCondicion) === String(selectedCondicion))?.Condicion;
  const selectedEstadoLabel = estados?.find((e: any) => String(e.IdEstadoBien) === String(selectedEstado))?.EstadoBien;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fichas de Baja de Bienes</h1>
          <p className="text-slate-500 text-sm">Gestiona la baja de bienes y equipos.</p>
        </div>
        
        <Button 
          onClick={handleNew}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-900/20 inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva Ficha de Baja
        </Button>

        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setEditingBaja(null);
            reset();
          }
        }}>
          <DialogContent className="bg-white sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                {editingBaja ? "Editar Ficha de Baja" : "Generar Nueva Ficha de Baja"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Nº Ficha Baja *</label>
                  <Input {...register("NumeroFichaBaja", { required: "El número es requerido" })} className="border-slate-200" readOnly />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Unidad Orgánica</label>
                  <Input {...register("UnidadOrganica")} placeholder="Ej. OTI" className="border-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Bien / Equipo *</label>
                  <Select value={watch("IdBien") ? String(watch("IdBien")) : ""} onValueChange={(val) => setValue("IdBien", val)}>
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="Seleccionar">{selectedBienLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {bienes?.map((b: any) => (
                        <SelectItem key={b.IdBien} value={b.IdBien.toString()}>{b.Descripcion} ({b.CodigoInventario})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Responsable</label>
                  <Input {...register("Responsable")} placeholder="Ej. Juan Perez" className="border-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Dependencia</label>
                  <Input {...register("Dependencia")} placeholder="Ej. Gerencia" className="border-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Ambiente</label>
                  <Input {...register("Ambiente")} placeholder="Ej. Of. 201" className="border-slate-200" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Condición</label>
                  <Select value={watch("IdCondicion") ? String(watch("IdCondicion")) : ""} onValueChange={(val) => setValue("IdCondicion", val)}>
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="Seleccionar">{selectedCondicionLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {condiciones?.map((c: any) => (
                        <SelectItem key={c.IdCondicion} value={c.IdCondicion.toString()}>{c.CondicionBien}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Estado</label>
                  <Select value={watch("IdEstadoBien") ? String(watch("IdEstadoBien")) : ""} onValueChange={(val) => setValue("IdEstadoBien", val)}>
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="Seleccionar">{selectedEstadoLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {estados?.map((e: any) => (
                        <SelectItem key={e.IdEstadoBien} value={e.IdEstadoBien.toString()}>{e.EstadoBien}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Causal de Baja</label>
                <Input {...register("CausalBaja")} placeholder="Ej. Obsolescencia, Daño irreparable" className="border-slate-200" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Fundamentación</label>
                <Input {...register("Fundamentacion")} placeholder="Describe por qué se da de baja" className="border-slate-200" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Recomendaciones</label>
                <Input {...register("Recomendacion")} placeholder="Recomendaciones finales" className="border-slate-200" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Observación</label>
                <Input {...register("Observacion")} placeholder="Observaciones adicionales" className="border-slate-200" />
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-200 text-slate-700 hover:bg-slate-50">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" disabled={mutation.isPending}>
                  {mutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Cargando fichas de baja...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Nº Ficha</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Bien / Equipo</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Responsable</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Causal</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {bajas?.map((baja: any) => (
                  <tr key={baja.IdBaja} className="bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-red-600 whitespace-nowrap">{baja.NumeroFichaBaja}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{baja.Bien?.Descripcion || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{baja.Responsable || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{baja.CausalBaja || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                          title="Ver"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEdit(baja)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          title="Desactivar"
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {bajas?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-slate-500">
                      No hay fichas de baja registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
