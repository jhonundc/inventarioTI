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
import { useState, useEffect } from "react";

const fetchSoftwareCatalogo = async () => {
  const res = await fetch("/api/software-catalogo");
  if (!res.ok) throw new Error("Error al cargar el catálogo de software");
  return res.json();
};

export default function SoftwareCatalogoPage() {
  const [open, setOpen] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const { data: software, isLoading } = useQuery({
    queryKey: ["software-catalogo"],
    queryFn: fetchSoftwareCatalogo,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingSoftware ? "PATCH" : "POST";
      const payload = editingSoftware 
        ? { ...data, IdSoftwareCatalogo: editingSoftware.IdSoftwareCatalogo } 
        : data;
      
      console.log("Enviando", method, "con datos:", payload);
      
      const res = await fetch("/api/software-catalogo", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const responseText = await res.text();
      console.log("Respuesta del servidor:", res.status, responseText);
      
      if (!res.ok) {
        throw new Error(responseText || `Error al ${editingSoftware ? "actualizar" : "crear"} el software`);
      }
      
      return JSON.parse(responseText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["software-catalogo"] });
      setOpen(false);
      reset();
      setEditingSoftware(null);
      setErrorMessage("");
    },
    onError: (error: any) => {
      console.error("Error en mutación:", error);
      setErrorMessage(error.message || "Error al guardar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/software-catalogo?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al desactivar el software");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["software-catalogo"] });
    },
  });

  const onSubmit = (data: any) => {
    setErrorMessage("");
    mutation.mutate(data);
  };

  const handleEdit = (sw: any) => {
    setEditingSoftware(sw);
    setErrorMessage("");
    setValue("NombreSoftware", sw.NombreSoftware);
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de que desea desactivar este software?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNew = () => {
    setEditingSoftware(null);
    reset();
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo de Software</h1>
          <p className="text-slate-500 text-sm">Gestiona el catálogo de software disponible.</p>
        </div>
        
        <Button 
          onClick={handleNew}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-900/20 inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo Software
        </Button>

        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setEditingSoftware(null);
            reset();
          }
        }}>
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                {editingSoftware ? "Editar Software" : "Agregar Nuevo Software"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {errorMessage}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Nombre del Software *</label>
                <Input 
                  {...register("NombreSoftware", { required: "El nombre es requerido" })} 
                  placeholder="Ej. Microsoft Office" 
                  className="border-slate-200"
                />
                {errors.NombreSoftware && <p className="text-xs text-red-500">{(errors.NombreSoftware as any).message}</p>}
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
          <div className="p-6 text-center text-slate-500">Cargando catálogo de software...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nombre del Software</th>
                  <th className="px-6 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {software?.map((sw: any) => (
                  <tr key={sw.IdSoftwareCatalogo} className="bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{sw.NombreSoftware}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEdit(sw)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(sw.IdSoftwareCatalogo)}
                          title="Desactivar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {software?.length === 0 && (
              <div className="p-6 text-center text-slate-500">
                No hay software en el catálogo. Agrega uno nuevo para empezar.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
