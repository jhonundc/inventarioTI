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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const fetchModelos = async () => {
  const res = await fetch("/api/modelos");
  if (!res.ok) throw new Error("Error al cargar los modelos");
  return res.json();
};

const fetchMarcas = async () => {
  const res = await fetch("/api/marcas");
  if (!res.ok) throw new Error("Error al cargar las marcas");
  return res.json();
};

const fetchCategorias = async () => {
  const res = await fetch("/api/categorias");
  if (!res.ok) throw new Error("Error al cargar las categorías");
  return res.json();
};

export default function ModelosPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const { data: modelos, isLoading } = useQuery({
    queryKey: ["modelos"],
    queryFn: fetchModelos,
  });

  const { data: marcas } = useQuery({
    queryKey: ["marcas"],
    queryFn: fetchMarcas,
  });

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: fetchCategorias,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/modelos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al crear el modelo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos"] });
      setOpen(false);
      reset();
    },
  });

  const onSubmit = (data: any) => {
    if (!data.IdMarca || !data.IdCategoria) {
      alert("Por favor, selecciona marca y categoría.");
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuración de Modelos</h1>
          <p className="text-slate-500 text-sm">Gestiona los modelos de los equipos.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-900/20 inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 transition-all">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Modelo
          </DialogTrigger>
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">Agregar Nuevo Modelo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Marca *</label>
                <Select onValueChange={(val) => setValue("IdMarca", val)}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Seleccionar Marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {marcas?.map((m: any) => (
                      <SelectItem key={m.IdMarca} value={m.IdMarca.toString()}>{m.Marca}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Categoría (Tipo de Bien) *</label>
                <Select onValueChange={(val) => setValue("IdCategoria", val)}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Seleccionar Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias?.map((c: any) => (
                      <SelectItem key={c.IdCategoria} value={c.IdCategoria.toString()}>{c.CategoriaBien}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Nombre del Modelo *</label>
                <Input 
                  {...register("Modelo", { required: "El nombre es requerido" })} 
                  placeholder="Ej. ProBook 450 G8" 
                  className="border-slate-200"
                />
                {errors.Modelo && <p className="text-xs text-red-500">{(errors.Modelo as any).message}</p>}
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
          <div className="p-6 text-center text-slate-500">Cargando modelos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Marca</th>
                  <th className="px-6 py-4 font-semibold">Categoría</th>
                  <th className="px-6 py-4 font-semibold">Modelo</th>
                  <th className="px-6 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {modelos?.map((mod: any) => (
                  <tr key={mod.IdModelo} className="bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{mod.Marca?.Marca || "-"}</td>
                    <td className="px-6 py-4">{mod.Categoria?.CategoriaBien || "-"}</td>
                    <td className="px-6 py-4">{mod.Modelo}</td>
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
