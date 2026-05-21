"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export default function QuickCreateCategoriaModal() {
  const [open, setOpen] = useState(false);
  const [categoria, setCategoria] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (nombreCategoria: string) => {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ CategoriaBien: nombreCategoria }),
      });
      if (!res.ok) throw new Error("Error al crear la categoría");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      setOpen(false);
      setCategoria("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!categoria.trim()) return;
    mutation.mutate(categoria);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center">
        <Plus className="h-3 w-3 mr-0.5" /> Nuevo
      </DialogTrigger>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">Nueva Categoría</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Nombre de la Categoría *</label>
            <Input 
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ej. Laptops" 
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
