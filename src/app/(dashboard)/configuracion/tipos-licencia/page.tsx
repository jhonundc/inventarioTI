"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

const fetchTiposLicencia = async () => {
  const res = await fetch("/api/tipos-licencia");
  if (!res.ok) throw new Error("Error al cargar los tipos de licencia");
  return res.json();
};

export default function TiposLicenciaPage() {
  const [open, setOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const { data: tipos, isLoading } = useQuery({
    queryKey: ["tipos-licencia"],
    queryFn: fetchTiposLicencia,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingTipo ? "PATCH" : "POST";
      const payload = editingTipo 
        ? { ...data, IdTipoLicencia: editingTipo.IdTipoLicencia } 
        : data;
      
      console.log("Enviando", method, "con datos:", payload);
      
      const res = await fetch("/api/tipos-licencia", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const responseText = await res.text();
      console.log("Respuesta del servidor:", res.status, responseText);
      
      if (!res.ok) {
        throw new Error(responseText || `Error al ${editingTipo ? "actualizar" : "crear"} el tipo de licencia`);
      }
      
      return JSON.parse(responseText);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-licencia"] });
      setOpen(false);
      reset();
      setEditingTipo(null);
      setErrorMessage("");
    },
    onError: (error: any) => {
      console.error("Error en mutación:", error);
      setErrorMessage(error.message || "Error al guardar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/tipos-licencia?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al desactivar el tipo de licencia");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-licencia"] });
    },
  });

  const onSubmit = (data: any) => {
    setErrorMessage("");
    mutation.mutate(data);
  };

  const handleEdit = (tipo: any) => {
    setEditingTipo(tipo);
    setErrorMessage("");
    setValue("TipoLicencia", tipo.TipoLicencia);
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de que desea desactivar este tipo de licencia?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNew = () => {
    setEditingTipo(null);
    reset();
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tipos de Licencia</h1>
          <p className="text-slate-500 text-sm">Gestiona los tipos de licencia disponibles.</p>
        </div>
        
        <Button 
          onClick={handleNew}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-900/20 inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo Tipo
        </Button>

        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setEditingTipo(null);
            reset();
          }
        }}>
          <DialogContent className="bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                {editingTipo ? "Editar Tipo de Licencia" : "Agregar Nuevo Tipo de Licencia"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {errorMessage}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Nombre del Tipo de Licencia *</label>
                <Input 
                  {...register("TipoLicencia", { required: "El nombre es requerido" })} 
                  placeholder="Ej. Licencia Perpetua, Licencia Anual" 
                  className="border-slate-200"
                />
                {errors.TipoLicencia && <p className="text-xs text-red-500">{(errors.TipoLicencia as any).message}</p>}
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
          <div className="p-6 text-center text-slate-500">Cargando tipos de licencia...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nombre del Tipo</th>
                  <th className="px-6 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tipos?.map((tipo: any) => (
                  <tr key={tipo.IdTipoLicencia} className="bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{tipo.TipoLicencia}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEdit(tipo)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(tipo.IdTipoLicencia)}
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
            {tipos?.length === 0 && (
              <div className="p-6 text-center text-slate-500">
                No hay tipos de licencia. Agrega uno nuevo para empezar.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
