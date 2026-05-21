"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export default function QuickCreateCondicionModal() {
  const [open, setOpen] = useState(false);
  const [condicion, setCondicion] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (nombreCondicion: string) => {
      const res = await fetch("/api/condiciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Condicion: nombreCondicion }),
      });
      if (!res.ok) throw new Error("Error al crear la condición");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condiciones"] });
      setOpen(false);
      setCondicion("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!condicion.trim()) return;
    mutation.mutate(condicion);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center">
        <Plus className="h-3 w-3 mr-0.5" /> Nuevo
      </DialogTrigger>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">Nueva Condición</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Nombre de la Condición *</label>
            <Input 
              value={condicion}
              onChange={(e) => setCondicion(e.target.value)}
              placeholder="Ej. Operativo" 
              className="border-slate-200"
            />
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
  );
}
