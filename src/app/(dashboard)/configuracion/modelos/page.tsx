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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

type ModeloForm = {
  Modelo: string;
};

const fetchModelos = async () => {
  const res = await fetch("/api/modelos");
  if (!res.ok) throw new Error("Error al cargar los modelos");
  return res.json();
};

export default function ModelosPage() {
  const [open, setOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<any>(null);
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ModeloForm>();

  const { data: modelos, isLoading } = useQuery({
    queryKey: ["modelos"],
    queryFn: fetchModelos,
  });

  useEffect(() => {
    if (!open) {
      reset({ Modelo: "" });
      return;
    }

    if (editingModelo) {
      reset({ Modelo: editingModelo.Modelo || "" });
    } else {
      reset({ Modelo: "" });
    }
  }, [open, editingModelo, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: ModeloForm) => {
      const isEdit = Boolean(editingModelo);
      const res = await fetch("/api/modelos", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { IdModelo: editingModelo.IdModelo, Modelo: data.Modelo } : data),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || `Error al ${isEdit ? "actualizar" : "crear"} el modelo`);
      }
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos"] });
      setOpen(false);
      setEditingModelo(null);
      setReadOnlyMode(false);
      reset();
    },
    onError: (error: any) => {
      alert(error.message || "No se pudo guardar el modelo");
    },
  });

  const toggleActivoMutation = useMutation({
    mutationFn: async (modelo: any) => {
      const res = await fetch("/api/modelos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          IdModelo: modelo.IdModelo,
          Activo: !modelo.Activo,
        }),
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Error al cambiar estado del modelo");
      return responseData;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["modelos"] }),
    onError: (error: any) => alert(error.message || "No se pudo cambiar el estado"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/modelos?id=${id}`, { method: "DELETE" });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Error al desactivar el modelo");
      return responseData;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["modelos"] }),
    onError: (error: any) => alert(error.message || "No se pudo desactivar el modelo"),
  });

  const onSubmit = (data: ModeloForm) => {
    if (readOnlyMode) return;
    saveMutation.mutate(data);
  };

  const openCreate = () => {
    setEditingModelo(null);
    setReadOnlyMode(false);
    setOpen(true);
  };

  const openEdit = (modelo: any) => {
    setEditingModelo(modelo);
    setReadOnlyMode(false);
    setOpen(true);
  };

  const openView = (modelo: any) => {
    setEditingModelo(modelo);
    setReadOnlyMode(true);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuración de Modelos</h1>
          <p className="text-slate-500 text-sm">Gestiona los modelos de equipos.</p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) {
              setEditingModelo(null);
              setReadOnlyMode(false);
            }
          }}
        >
          <DialogTrigger
            onClick={openCreate}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-900/20 inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" /> Nuevo Modelo
          </DialogTrigger>
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                {readOnlyMode ? "Detalle del Modelo" : editingModelo ? "Editar Modelo" : "Agregar Nuevo Modelo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Nombre del Modelo *</label>
                <Input
                  {...register("Modelo", { required: "El nombre es requerido" })}
                  placeholder="Ej. ProBook 450 G8"
                  className="border-slate-200"
                  readOnly={readOnlyMode}
                />
                {errors.Modelo && <p className="text-xs text-red-500">{errors.Modelo.message}</p>}
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-200 text-slate-700 hover:bg-slate-50">
                  {readOnlyMode ? "Cerrar" : "Cancelar"}
                </Button>
                {!readOnlyMode && (
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Guardando..." : editingModelo ? "Actualizar" : "Guardar"}
                  </Button>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Cargando modelos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Modelo</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {modelos?.map((mod: any) => (
                  <tr key={mod.IdModelo} className="bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{mod.Modelo}</td>
                    <td className="px-6 py-4">
                      {mod.Activo ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 text-xs font-medium">Activo</span>
                      ) : (
                        <span className="text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 text-xs font-medium">Inactivo</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                          title="Ver"
                          onClick={() => openView(mod)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Editar"
                          onClick={() => openEdit(mod)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${mod.Activo ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" : "text-slate-400 hover:text-slate-500 hover:bg-slate-100"}`}
                          title={mod.Activo ? "Desactivar" : "Activar"}
                          onClick={() => {
                            if (confirm(`¿Está seguro de ${mod.Activo ? "desactivar" : "activar"} este modelo?`)) {
                              toggleActivoMutation.mutate(mod);
                            }
                          }}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Dar de baja (inactivar)"
                          onClick={() => {
                            if (confirm("¿Está seguro de dar de baja este modelo?")) {
                              deleteMutation.mutate(mod.IdModelo);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {modelos?.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-slate-500">
                      No hay modelos registrados. Crea uno para comenzar.
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
