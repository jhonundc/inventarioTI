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

const fetchCondiciones = async () => {
  const res = await fetch("/api/condiciones");
  if (!res.ok) throw new Error("Error al cargar las condiciones");
  return res.json();
};

export default function CondicionesPage() {
  const [open, setOpen] = useState(false);
  const [editingCondicion, setEditingCondicion] = useState<any>(null);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const { data: condiciones, isLoading } = useQuery({
    queryKey: ["condicionesList"],
    queryFn: fetchCondiciones,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingCondicion ? "PATCH" : "POST";
      const res = await fetch("/api/condiciones", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCondicion ? { ...data, IdCondicion: editingCondicion.IdCondicion } : data),
      });
      if (!res.ok) throw new Error(`Error al ${editingCondicion ? "actualizar" : "crear"} la condición`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condicionesList"] });
      setOpen(false);
      reset();
      setEditingCondicion(null);
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const handleEdit = (cond: any) => {
    setEditingCondicion(cond);
    setValue("Condicion", cond.Condicion);
    setOpen(true);
  };

  const handleNew = () => {
    setEditingCondicion(null);
    reset();
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuración de Condiciones</h1>
          <p className="text-slate-500 text-sm">Gestiona las condiciones de los bienes.</p>
        </div>

        <Button
          onClick={handleNew}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-900/20 inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva Condición
        </Button>

        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setEditingCondicion(null);
            reset();
          }
        }}>
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                {editingCondicion ? "Editar Condición" : "Agregar Nueva Condición"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Condición del Bien *</label>
                <Input
                  {...register("Condicion", { required: "La condición es requerida" })}
                  placeholder="Ej. Operativo"
                  className="border-slate-200"
                />
                {errors.Condicion && <p className="text-xs text-red-500">{(errors.Condicion as any).message}</p>}
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
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Cargando condiciones...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Condición del Bien</th>
                  <th className="px-6 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {condiciones?.map((cond: any) => (
                  <tr key={cond.IdCondicion} className="bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{cond.Condicion}</td>
                     <td className="px-6 py-4">
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
                          onClick={() => handleEdit(cond)}
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
                {condiciones?.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-slate-500">
                      No hay condiciones registradas. Crea una para comenzar.
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
