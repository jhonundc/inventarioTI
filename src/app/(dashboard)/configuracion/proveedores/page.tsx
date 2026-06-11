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

const fetchProveedores = async () => {
  const res = await fetch("/api/proveedores");
  if (!res.ok) throw new Error("Error al cargar los proveedores");
  return res.json();
};

export default function ProveedoresPage() {
  const [open, setOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<any>(null);
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const { data: proveedores, isLoading } = useQuery({
    queryKey: ["proveedores"],
    queryFn: fetchProveedores,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingProveedor ? "PATCH" : "POST";
      const body = editingProveedor
        ? { ...data, IdProveedor: editingProveedor.IdProveedor }
        : data;

      const res = await fetch("/api/proveedores", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(
          `Error al ${editingProveedor ? "actualizar" : "crear"} el proveedor`
        );
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      setOpen(false);
      reset();
      setEditingProveedor(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/proveedores?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al desactivar el proveedor");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const handleEdit = (proveedor: any) => {
    setEditingProveedor(proveedor);
    setValue("Proveedor", proveedor.Proveedor);
    setOpen(true);
  };

  const handleNew = () => {
    setEditingProveedor(null);
    reset();
    setOpen(true);
  };

  const handleDeactivate = (id: number) => {
    if (!window.confirm("¿Estás seguro de desactivar este proveedor?")) {
      return;
    }
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configuración de Proveedores</h1>
          <p className="text-slate-500 text-sm">Gestiona los proveedores registrados.</p>
        </div>

        <Button
          onClick={handleNew}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-900/20 inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo Proveedor
        </Button>

        <Dialog
          open={open}
          onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
              setEditingProveedor(null);
              reset();
            }
          }}
        >
          <DialogContent className="bg-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                {editingProveedor ? "Editar Proveedor" : "Agregar Nuevo Proveedor"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Proveedor *</label>
                <Input
                  {...register("Proveedor", {
                    required: "El nombre del proveedor es requerido",
                  })}
                  placeholder="Ej. Soluciones TI"
                  className="border-slate-200"
                />
                {errors.Proveedor && (
                  <p className="text-xs text-red-500">{(errors.Proveedor as any).message}</p>
                )}
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
          <div className="p-6 text-center text-slate-500">Cargando proveedores...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Proveedor</th>
                  <th className="px-6 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proveedores?.map((proveedor: any) => (
                  <tr key={proveedor.IdProveedor} className="bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{proveedor.Proveedor}</td>
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
                          onClick={() => handleEdit(proveedor)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          onClick={() => handleDeactivate(proveedor.IdProveedor)}
                          title="Desactivar"
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeactivate(proveedor.IdProveedor)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {proveedores?.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-slate-500">
                      No hay proveedores registrados. Crea uno para comenzar.
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
