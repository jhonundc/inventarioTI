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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import QuickCreateMarcaModal from "./QuickCreateMarcaModal";

const componenteSchema = z.object({
  NombreComponente: z.string().min(2, "El nombre del componente es requerido"),
  IdMarca: z.string().optional(),
  Modelo: z.string().optional(),
  NumeroSerie: z.string().optional(),
  Capacidad: z.string().optional(),
  Cantidad: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "La cantidad debe ser un número mayor o igual a 0",
  }),
  Observacion: z.string().optional(),
});

type ComponenteFormValues = z.infer<typeof componenteSchema>;

interface ComponenteFormModalProps {
  componente?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
}

export default function ComponenteFormModal({ componente, open, onOpenChange, readOnly = false }: ComponenteFormModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ComponenteFormValues>({
    resolver: zodResolver(componenteSchema),
  });

  const selectedMarca = watch("IdMarca");

  // Query de marcas
  const { data: marcas } = useQuery({
    queryKey: ["marcas"],
    queryFn: async () => {
      const res = await fetch("/api/marcas");
      if (!res.ok) throw new Error("Error al cargar las marcas");
      return res.json();
    },
  });

  const selectedMarcaName = marcas?.find(
    (m: any) => String(m.IdMarca) === String(selectedMarca)
  )?.Marca;

  // Llenar formulario al editar
  useEffect(() => {
    if (open) {
      if (componente) {
        reset({
          NombreComponente: componente.NombreComponente || "",
          IdMarca: componente.IdMarca ? String(componente.IdMarca) : "",
          Modelo: componente.Modelo || "",
          NumeroSerie: componente.NumeroSerie || "",
          Capacidad: componente.Capacidad || "",
          Cantidad: String(componente.Cantidad ?? 0),
          Observacion: componente.Observacion || "",
        });
      } else {
        reset({
          NombreComponente: "",
          IdMarca: "",
          Modelo: "",
          NumeroSerie: "",
          Capacidad: "",
          Cantidad: "0",
          Observacion: "",
        });
      }
    }
  }, [open, componente, reset]);

  // Mutation para crear/editar componente
  const mutation = useMutation({
    mutationFn: async (data: ComponenteFormValues) => {
      const url = "/api/componentes";
      const method = componente ? "PATCH" : "POST";
      const body = componente ? { IdComponente: componente.IdComponente, ...data } : data;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          Cantidad: parseInt(body.Cantidad) || 0,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Error al ${componente ? "actualizar" : "registrar"} el componente`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["componentes"] });
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      alert(error.message);
    },
  });

  const onSubmit = (data: ComponenteFormValues) => {
    if (readOnly) return;
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            {readOnly ? "Detalle del Componente" : componente ? "Editar Componente" : "Registrar Nuevo Componente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Nombre / Tipo del Componente *
            </label>
            <Input
              {...register("NombreComponente")}
              placeholder="Ej. DISCO DURO HDD, MEMORIA RAM"
              className="border-slate-200"
              readOnly={readOnly}
            />
            {errors.NombreComponente && (
              <p className="text-xs text-red-500">
                {errors.NombreComponente.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">
                  Marca
                </label>
                {!readOnly && <QuickCreateMarcaModal />}
              </div>
              <Select
                value={watch("IdMarca") ? String(watch("IdMarca")) : ""}
                onValueChange={(val) => setValue("IdMarca", val as any)}
                disabled={readOnly}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Seleccionar">
                    {selectedMarcaName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {marcas?.map((m: any) => (
                    <SelectItem key={m.IdMarca} value={m.IdMarca.toString()}>
                      {m.Marca}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Modelo
              </label>
              <Input
                {...register("Modelo")}
                placeholder="Ej. Kingston Fury"
                className="border-slate-200"
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Capacidad / Medida
              </label>
              <Input
                {...register("Capacidad")}
                placeholder="Ej. 16GB, 1TB, 600W"
                className="border-slate-200"
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Cantidad *
              </label>
              <Input
                type="number"
                {...register("Cantidad")}
                className="border-slate-200"
                readOnly={readOnly}
              />
              {errors.Cantidad && (
                <p className="text-xs text-red-500">
                  {errors.Cantidad.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Número de Serie
            </label>
            <Input
              {...register("NumeroSerie")}
              placeholder="Ej. SN123456"
              className="border-slate-200"
              readOnly={readOnly}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Observación
            </label>
            <Textarea
              {...register("Observacion")}
              placeholder="Ej. Para servidores, repuesto"
              className="border-slate-200 min-h-[60px]"
              readOnly={readOnly}
            />
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              {readOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!readOnly && (
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Guardando..." : componente ? "Actualizar" : "Guardar"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
