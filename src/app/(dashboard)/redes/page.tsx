"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit, Network, Search, Eye, Power } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { getAreas, getTiposEstacion } from "@/app/actions/catalogs";
import QuickCreateTipoEstacionModal from "@/components/inventory/QuickCreateTipoEstacionModal";
import QuickCreateAreaModal from "@/components/inventory/QuickCreateAreaModal";

const fetchRedes = async () => {
  const res = await fetch("/api/redes");
  if (!res.ok) throw new Error("Error al cargar las redes");
  return res.json();
};

export default function RedesPage() {
  const [open, setOpen] = useState(false);
  const [editingRed, setEditingRed] = useState<any>(null);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  const { data: redes, isLoading } = useQuery({
    queryKey: ["redes"],
    queryFn: fetchRedes,
  });

  const { data: areas } = useQuery({ queryKey: ["areas"], queryFn: () => getAreas() });
  const { data: tiposEstacion } = useQuery({ queryKey: ["tiposEstacion"], queryFn: () => getTiposEstacion() });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const method = editingRed ? "PATCH" : "POST";
      const res = await fetch("/api/redes", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRed ? { ...data, IdIp: editingRed.IdIp } : data),
      });
      if (!res.ok) throw new Error(`Error al ${editingRed ? "actualizar" : "crear"} la red`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redes"] });
      setOpen(false);
      reset();
      setEditingRed(null);
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const handleEdit = (red: any) => {
    setEditingRed(red);
    setValue("DireccionIp", red.DireccionIp);
    setValue("Vlan", red.Vlan || "");
    setValue("Estacion", red.Estacion || "");
    setValue("IdTipoEstacion", red.IdTipoEstacion?.toString() || "");
    setValue("IdArea", red.IdArea?.toString() || "");
    setValue("DireccionMac", red.DireccionMac || "");
    setValue("DHCP", red.DHCP ? "true" : "false");
    setValue("Observacion", red.Observacion || "");
    setOpen(true);
  };

  const handleNew = () => {
    setEditingRed(null);
    reset();
    setOpen(true);
  };

  const selectedArea = watch("IdArea");
  const selectedTipo = watch("IdTipoEstacion");
  const ipValue = watch("DireccionIp");
  const isDhcp = watch("DHCP") === "true";
  
  const selectedAreaName = areas?.find((a: any) => String(a.IdArea) === String(selectedArea))?.NombreArea;
  const selectedTipoName = tiposEstacion?.find((t: any) => String(t.IdTipoEstacion) === String(selectedTipo))?.TipoEstacion;

  // Lógica de VLAN Automática
  useEffect(() => {
    if (ipValue && !isDhcp) {
      const parts = ipValue.split('.');
      if (parts.length >= 3) {
        const vlan = parts[2];
        setValue("Vlan", vlan);
      }
    }
  }, [ipValue, setValue, isDhcp]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventario de Redes (IPs)</h1>
          <p className="text-slate-500 text-sm">Gestiona las direcciones IP y puntos de red.</p>
        </div>
        
        <Button 
          onClick={handleNew}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-900/20 inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva IP
        </Button>

        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setEditingRed(null);
            reset();
          }
        }}>
          <DialogContent className="bg-white sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                {editingRed ? "Editar Red / IP" : "Registrar Nueva IP"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Modo IP</label>
                <Select value={watch("DHCP") || "false"} onValueChange={(val) => setValue("DHCP", val)}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Estática</SelectItem>
                    <SelectItem value="true">DHCP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Dirección IP *</label>
                  <Input 
                    {...register("DireccionIp", { required: !isDhcp ? "La IP es requerida" : false })} 
                    placeholder={isDhcp ? "Asignada por DHCP" : "Ej. 192.168.10.22"} 
                    className="border-slate-200"
                    disabled={isDhcp}
                  />
                  {errors.DireccionIp && <p className="text-xs text-red-500">{(errors.DireccionIp as any).message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">VLAN</label>
                  <Input 
                    {...register("Vlan")} 
                    placeholder={isDhcp ? "Auto" : "Ej. 10"} 
                    className="border-slate-200"
                    disabled={isDhcp}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Estación / Nombre</label>
                  <Input {...register("Estacion")} placeholder="Ej. PC-CONTABILIDAD" className="border-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Dirección MAC</label>
                  <Input {...register("DireccionMac")} placeholder="Ej. AA:BB:CC:DD:EE:FF" className="border-slate-200" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-700">Tipo Estación</label>
                    <QuickCreateTipoEstacionModal />
                  </div>
                  <Select value={watch("IdTipoEstacion") ? String(watch("IdTipoEstacion")) : ""} onValueChange={(val) => setValue("IdTipoEstacion", val)}>
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="Seleccionar">{selectedTipoName}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {tiposEstacion?.map((t: any) => (
                        <SelectItem key={t.IdTipoEstacion} value={t.IdTipoEstacion.toString()}>{t.TipoEstacion}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-700">Área</label>
                    <QuickCreateAreaModal />
                  </div>
                  <Select value={watch("IdArea") ? String(watch("IdArea")) : ""} onValueChange={(val) => setValue("IdArea", val)}>
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

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Observación</label>
                <Input {...register("Observacion")} placeholder="Ej. Punto de red fallando" className="border-slate-200" />
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
          <div className="p-6 text-center text-slate-500">Cargando redes...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Dirección IP</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">VLAN</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Estación</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Tipo</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Área</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Modo</th>
                  <th className="px-6 py-4 font-semibold whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {redes?.map((red: any) => (
                  <tr key={red.IdIp} className="bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-blue-600 whitespace-nowrap">{red.DireccionIp}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{red.Vlan || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{red.Estacion || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{red.TipoEstacion?.TipoEstacion || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{red.Area?.NombreArea || red.NombreArea || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${red.DHCP ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {red.DHCP ? "DHCP" : "Estática"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                          onClick={() => handleEdit(red)}
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
                {redes?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-slate-500">
                      No hay redes registradas. Crea una para comenzar.
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
