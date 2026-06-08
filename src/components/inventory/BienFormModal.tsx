"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { getMarcas, getModelos, getAreas, getCondiciones, getEstados, getCategorias } from "@/app/actions/catalogs";

// Esquema de validación con Zod
const bienSchema = z.object({
  CodigoInventario: z.string().optional(),
  CodigoPatrimonial: z.string().optional(),
  Descripcion: z.string().min(3, "La descripción es requerida"),
  IdCategoria: z.string().optional(),
  IdMarca: z.string().optional(),
  IdModelo: z.string().optional(),
  Modelo: z.string().optional(),
  IdArea: z.string().optional(),
  NumeroSerie: z.string().optional(),
  IdCondicion: z.string().optional(),
  IdEstadoBien: z.string().optional(),
  FechaCompra: z.string().optional(),
}).refine(data => data.CodigoInventario || data.CodigoPatrimonial, {
  message: "Debe proporcionar al menos un código (Inventario o Patrimonial)",
  path: ["CodigoInventario"],
});

type BienFormValues = z.infer<typeof bienSchema>;

interface BienFormModalProps {
  bien?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
}

export default function BienFormModal({ bien, open, onOpenChange, readOnly = false }: BienFormModalProps) {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<BienFormValues>({
    resolver: zodResolver(bienSchema),
  });

  const [manualModeloMode, setManualModeloMode] = useState(false);
  const selectedMarca = watch("IdMarca");
  const selectedCategoria = watch("IdCategoria");
  const selectedModeloId = watch("IdModelo");

  // Consultas para llenar los combos (Server Actions + React Query)
  const { data: marcas } = useQuery({ queryKey: ["marcas"], queryFn: () => getMarcas() });
  const { data: modelos } = useQuery({ 
    queryKey: ["modelos", selectedMarca, selectedCategoria], 
    queryFn: () => getModelos(
      selectedMarca ? parseInt(selectedMarca) : undefined,
      selectedCategoria ? parseInt(selectedCategoria) : undefined
    ),
    enabled: true,
  });
  const { data: areas } = useQuery({ queryKey: ["areas"], queryFn: () => getAreas() });
  const { data: condiciones } = useQuery({ queryKey: ["condiciones"], queryFn: () => getCondiciones() });
  const { data: estados } = useQuery({ queryKey: ["estados"], queryFn: () => getEstados() });
  const { data: categorias } = useQuery({ queryKey: ["categorias"], queryFn: () => getCategorias() });

  const selectedArea = watch("IdArea");
  const selectedCondicion = watch("IdCondicion");
  const selectedEstado = watch("IdEstadoBien");
  const selectedCatName = categorias?.find((c: any) => String(c.IdCategoria) === String(selectedCategoria))?.CategoriaBien;
  const selectedAreaName = areas?.find((a: any) => String(a.IdArea) === String(selectedArea))?.NombreArea;
  const selectedMarcaName = marcas?.find((m: any) => String(m.IdMarca) === String(selectedMarca))?.Marca;
  const selectedModeloName = modelos?.find((m: any) => String(m.IdModelo) === String(selectedModeloId))?.Modelo;
  const selectedCondicionName = condiciones?.find((c: any) => String(c.IdCondicion) === String(selectedCondicion))?.Condicion;
  const selectedEstadoName = estados?.find((e: any) => String(e.IdEstadoBien) === String(selectedEstado))?.EstadoBien;

  // Llenar formulario al editar
  useEffect(() => {
    if (open) {
      setManualModeloMode(false);
      if (bien) {
        reset({
          CodigoInventario: bien.CodigoInventario || "",
          CodigoPatrimonial: bien.CodigoPatrimonial || "",
          Descripcion: bien.Descripcion || "",
          IdCategoria: bien.IdCategoria ? String(bien.IdCategoria) : "",
          IdMarca: bien.IdMarca ? String(bien.IdMarca) : "",
          IdModelo: bien.IdModelo ? String(bien.IdModelo) : "",
          Modelo: bien.Modelo?.Modelo || "",
          IdArea: bien.IdArea ? String(bien.IdArea) : "",
          NumeroSerie: bien.NumeroSerie || "",
          IdCondicion: bien.IdCondicion ? String(bien.IdCondicion) : "",
          IdEstadoBien: bien.IdEstadoBien ? String(bien.IdEstadoBien) : "",
          FechaCompra: bien.FechaCompra ? new Date(bien.FechaCompra).toISOString().slice(0, 10) : "",
        });
      } else {
        reset({
          CodigoInventario: "",
          CodigoPatrimonial: "",
          Descripcion: "",
          IdCategoria: "",
          IdMarca: "",
          IdModelo: "",
          Modelo: "",
          IdArea: "",
          NumeroSerie: "",
          IdCondicion: "",
          IdEstadoBien: "",
          FechaCompra: "",
        });
      }
    }
  }, [open, bien, reset]);

  // Mutación para guardar (POST o PATCH)
  const mutation = useMutation({
    mutationFn: async (data: BienFormValues) => {
      const url = "/api/bienes";
      const method = bien ? "PATCH" : "POST";
      const body = bien ? { IdBien: bien.IdBien, ...data } : data;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Error al ${bien ? "actualizar" : "crear"} el bien`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bienes"] });
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      alert(error.message);
    }
  });

  const onSubmit = (data: BienFormValues) => {
    if (readOnly) return;
    console.log("[BienFormModal] submit data:", data);
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            {readOnly ? "Detalle del Bien" : bien ? "Editar Bien" : "Registrar Nuevo Bien"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Cód. Inventario</label>
              <Input {...register("CodigoInventario")} placeholder="Ej. INV-001" className="border-slate-200" readOnly={readOnly} />
              {errors.CodigoInventario && <p className="text-xs text-red-500">{errors.CodigoInventario.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Cód. Patrimonial</label>
              <Input {...register("CodigoPatrimonial")} placeholder="Ej. PAT-001" className="border-slate-200" readOnly={readOnly} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Descripción *</label>
            <Input {...register("Descripcion")} placeholder="Ej. Laptop HP Core i7" className="border-slate-200" readOnly={readOnly} />
            {errors.Descripcion && <p className="text-xs text-red-500">{errors.Descripcion.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">Categoría</label>
              </div>
              <Select 
                value={watch("IdCategoria") ? String(watch("IdCategoria")) : ""} 
                onValueChange={(val) => setValue("IdCategoria", val as any)}
                disabled={readOnly}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Seleccionar">{selectedCatName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categorias?.map((c: any) => (
                    <SelectItem key={c.IdCategoria} value={c.IdCategoria.toString()}>{c.CategoriaBien}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">Área</label>
              </div>
              <Select 
                value={watch("IdArea") ? String(watch("IdArea")) : ""} 
                onValueChange={(val) => setValue("IdArea", val as any)}
                disabled={readOnly}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Seleccionar">{selectedAreaName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {areas?.map((a: any) => (
                    <SelectItem key={a.IdArea} value={a.IdArea.toString()}>{a.NombreArea}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">Marca</label>
              </div>
              <Select 
                value={watch("IdMarca") ? String(watch("IdMarca")) : ""} 
                onValueChange={(val) => setValue("IdMarca", val as any)}
                disabled={readOnly}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Seleccionar">{selectedMarcaName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {marcas?.map((m: any) => (
                    <SelectItem key={m.IdMarca} value={m.IdMarca.toString()}>{m.Marca}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Modelo</label>
                </div>
                {!readOnly && (
                  <Button
                    variant={manualModeloMode ? "secondary" : "outline"}
                    size="sm"
                    type="button"
                    onClick={() => {
                      setManualModeloMode(true);
                      setValue("Modelo", "");
                    }}
                    className="h-9"
                  >
                    Agregar
                  </Button>
                )}
              </div>
              <Select
                value={selectedModeloId ? String(selectedModeloId) : ""}
                onValueChange={(val) => {
                  setValue("IdModelo", val as any);
                  setValue("Modelo", "");
                }}
                disabled={readOnly}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Seleccionar modelo">{selectedModeloName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {modelos?.map((m: any) => (
                    <SelectItem key={m.IdModelo} value={m.IdModelo.toString()}>
                      {m.Modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {manualModeloMode && !readOnly && (
                <div className="space-y-1">
                  <Input
                    {...register("Modelo")}
                    placeholder="Escribe el nombre del modelo"
                    className="border-slate-200"
                    readOnly={readOnly}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setManualModeloMode(false);
                      setValue("Modelo", "");
                    }}
                    className="mt-1 h-9"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
              <p className="text-xs text-slate-500">
                {manualModeloMode
                  ? "Escribe un nuevo modelo abajo."
                  : "Selecciona un modelo existente de la lista."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Nº Serie</label>
              <Input {...register("NumeroSerie")} placeholder="Ej. ABC123XYZ" className="border-slate-200" readOnly={readOnly} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Fecha Compra</label>
              <Input {...register("FechaCompra")} type="date" className="border-slate-200" readOnly={readOnly} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">Condición</label>
              </div>
              <Select 
                value={watch("IdCondicion") ? String(watch("IdCondicion")) : ""} 
                onValueChange={(val) => setValue("IdCondicion", val as any)}
                disabled={readOnly}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Seleccionar">{selectedCondicionName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {condiciones?.map((c: any) => (
                    <SelectItem key={c.IdCondicion} value={c.IdCondicion.toString()}>{c.Condicion}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Estado</label>
              <Select 
                value={watch("IdEstadoBien") ? String(watch("IdEstadoBien")) : ""} 
                onValueChange={(val) => setValue("IdEstadoBien", val as any)}
                disabled={readOnly}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Seleccionar">{selectedEstadoName}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {estados?.map((e: any) => (
                    <SelectItem key={e.IdEstadoBien} value={e.IdEstadoBien.toString()}>{e.EstadoBien}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-200 text-slate-700 hover:bg-slate-50">
              {readOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!readOnly && (
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : bien ? "Actualizar" : "Guardar"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
