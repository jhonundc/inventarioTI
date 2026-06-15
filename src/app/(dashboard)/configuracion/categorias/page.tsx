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

const fetchCategorias = async () => {
  const res = await fetch("/api/categorias");
  if (!res.ok) throw new Error("Error al cargar las categorías");
  return res.json();
};

export default function CategoriasPage() {
  const [open, setOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<any>(null);
  const [viewCategoria, setViewCategoria] = useState<any>(null);
  const [message, setMessage] = useState<string>("");
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const { data: categorias, isLoading } = useQuery({
    queryKey: ["categorias"],
    queryFn: fetchCategorias,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingCategoria ? "PATCH" : "POST";
      const res = await fetch("/api/categorias", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCategoria ? { ...data, IdCategoria: editingCategoria.IdCategoria } : data),
      });
      if (!res.ok) throw new Error(`Error al ${editingCategoria ? "actualizar" : "crear"} la categoría`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      setOpen(false);
      reset();
      setEditingCategoria(null);
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const handleEdit = (cat: any) => {
    setEditingCategoria(cat);
    setValue("CategoriaBien", cat.CategoriaBien);
    setOpen(true);
  };

  const handleView = (cat: any) => {
    setViewCategoria(cat);
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm("¿Desea desactivar esta categoría?")) return;
    try {
      const res = await fetch(`/api/categorias?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Error al desactivar la categoría");
      }
      setMessage("Categoría desactivada correctamente.");
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
    } catch (error: any) {
      setMessage(error?.message || "No se pudo desactivar la categoría.");
    }
  };

  const handleNew = () => {
    setEditingCategoria(null);
    reset();
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuración de Categorías</h1>
          <p className="text-slate-500 text-sm">Gestiona las categorías de los bienes.</p>
        </div>
        
        <Button 
          onClick={handleNew}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-900/20 inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
        </Button>

        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setEditingCategoria(null);
            reset();
          }
        }}>
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                {editingCategoria ? "Editar Categoría" : "Agregar Nueva Categoría"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Nombre de la Categoría *</label>
                <Input 
                  {...register("CategoriaBien", { required: "El nombre es requerido" })} 
                  placeholder="Ej. Laptops" 
                  className="border-slate-200"
                />
                {errors.CategoriaBien && <p className="text-xs text-red-500">{(errors.CategoriaBien as any).message}</p>}
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

        <Dialog open={!!viewCategoria} onOpenChange={(val) => {
          if (!val) setViewCategoria(null);
        }}>
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">Detalle de la Categoría</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-slate-500">Nombre</p>
                <p className="mt-1 text-base text-slate-800">{viewCategoria?.CategoriaBien || "-"}</p>
              </div>
              <div className="flex justify-end mt-6">
                <Button type="button" variant="outline" onClick={() => setViewCategoria(null)} className="border-slate-200 text-slate-700 hover:bg-slate-50">
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {message ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Cargando categorías...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nombre de la Categoría</th>
                  <th className="px-6 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias?.map((cat: any) => (
                  <tr key={cat.IdCategoria} className="bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{cat.CategoriaBien}</td>
                     <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                          onClick={() => handleView(cat)}
                          title="Ver"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEdit(cat)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => handleDeactivate(cat.IdCategoria)}
                          title="Desactivar"
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeactivate(cat.IdCategoria)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categorias?.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-slate-500">
                      No hay categorías registradas. Crea una para comenzar.
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
