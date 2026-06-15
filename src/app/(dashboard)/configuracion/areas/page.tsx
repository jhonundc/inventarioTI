"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, Eye, Power } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

const fetchAreas = async () => {
  const res = await fetch("/api/areas");
  if (!res.ok) throw new Error("Error al cargar las áreas");
  return res.json();
};

export default function AreasPage() {
  const [open, setOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [viewArea, setViewArea] = useState<any>(null);
  const [message, setMessage] = useState<string>("");
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const { data: areas, isLoading } = useQuery({
    queryKey: ["areas"],
    queryFn: fetchAreas,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingArea ? "PATCH" : "POST";
      const body = editingArea ? { ...data, IdArea: editingArea.IdArea } : data;
      const res = await fetch("/api/areas", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `Error al ${editingArea ? "actualizar" : "crear"} el área`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      setOpen(false);
      reset();
      setEditingArea(null);
      setMessage(editingArea ? "Área actualizada correctamente." : "Área creada correctamente.");
    },
    onError: (error: any) => {
      setMessage(error?.message || "Error al guardar el área.");
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const handleEdit = (area: any) => {
    setEditingArea(area);
    setValue("NombreArea", area.NombreArea);
    setValue("Piso", area.Piso || "");
    setValue("Referencia", area.Referencia || "");
    setOpen(true);
  };

  const handleView = (area: any) => {
    setViewArea(area);
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm("¿Desea desactivar esta área?")) return;
    try {
      const res = await fetch(`/api/areas?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Error al desactivar el área");
      }
      setMessage("Área desactivada correctamente.");
      queryClient.invalidateQueries({ queryKey: ["areas"] });
    } catch (error: any) {
      setMessage(error?.message || "No se pudo desactivar el área.");
    }
  };

  const handleModalClose = () => {
    setOpen(false);
    setEditingArea(null);
    reset();
  };

  const handleNew = () => {
    setEditingArea(null);
    reset();
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuración de Áreas</h1>
          <p className="text-slate-500 text-sm">Gestiona las áreas físicas de la institución.</p>
        </div>
        
        <Button 
          onClick={handleNew}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-900/20 inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva Área
        </Button>
      </div>

      {message ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setEditingArea(null);
            reset();
          }
        }}>
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                {editingArea ? "Editar Área" : "Agregar Nueva Área"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Nombre del Área *</label>
                <Input 
                  {...register("NombreArea", { required: "El nombre es requerido" })} 
                  placeholder="Ej. Contabilidad" 
                  className="border-slate-200"
                />
                {errors.NombreArea && <p className="text-xs text-red-500">{(errors.NombreArea as any).message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Piso</label>
                <Input {...register("Piso")} placeholder="Ej. 2do Piso" className="border-slate-200" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Referencia</label>
                <Input {...register("Referencia")} placeholder="Ej. Frente al ascensor" className="border-slate-200" />
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-200 text-slate-700 hover:bg-slate-50">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={mutation.isPending}>
                  {mutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      <Dialog open={!!viewArea} onOpenChange={(val) => {
          if (!val) setViewArea(null);
        }}>
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">Detalle del Área</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-slate-500">Nombre</p>
                <p className="mt-1 text-base text-slate-800">{viewArea?.NombreArea || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Piso</p>
                <p className="mt-1 text-base text-slate-800">{viewArea?.Piso || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Referencia</p>
                <p className="mt-1 text-base text-slate-800">{viewArea?.Referencia || "-"}</p>
              </div>
              <div className="flex justify-end mt-6">
                <Button type="button" variant="outline" onClick={() => setViewArea(null)} className="border-slate-200 text-slate-700 hover:bg-slate-50">
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Cargando áreas...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nombre del Área</th>
                  <th className="px-6 py-4 font-semibold">Piso</th>
                  <th className="px-6 py-4 font-semibold">Referencia</th>
                  <th className="px-6 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {areas?.map((area: any) => (
                  <tr key={area.IdArea} className="bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{area.NombreArea}</td>
                    <td className="px-6 py-4">{area.Piso || "-"}</td>
                    <td className="px-6 py-4">{area.Referencia || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                          onClick={() => handleView(area)}
                          title="Ver"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEdit(area)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => handleDeactivate(area.IdArea)}
                          title="Desactivar"
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeactivate(area.IdArea)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {areas?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-slate-500">
                      No hay áreas registradas. Crea una para comenzar.
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
