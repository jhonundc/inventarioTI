"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, Eye, Power } from "lucide-react";
import { Input } from "@/components/ui/input";
import ComponenteFormModal from "@/components/inventory/ComponenteFormModal";
import { useState, useMemo } from "react";

// Función para obtener los componentes
const fetchComponentes = async () => {
  const res = await fetch("/api/componentes");
  if (!res.ok) throw new Error("Error al cargar los componentes");
  return res.json();
};

export default function ComponentesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: componentes, isLoading, error } = useQuery({
    queryKey: ["componentes"],
    queryFn: fetchComponentes,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingComponente, setEditingComponente] = useState<any>(null);
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  // Mutaciones para deactivar y eliminar
  const toggleActivoMutation = useMutation({
    mutationFn: async (comp: any) => {
      const res = await fetch("/api/componentes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          IdComponente: comp.IdComponente,
          Activo: !comp.Activo,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al cambiar estado del componente");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["componentes"] });
    },
    onError: (error: any) => {
      alert(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/componentes?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al eliminar el componente");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["componentes"] });
    },
    onError: (error: any) => {
      alert(error.message);
    }
  });

  const handleToggleActivo = (comp: any) => {
    if (confirm(`¿Está seguro de ${comp.Activo ? "desactivar" : "activar"} este componente?`)) {
      toggleActivoMutation.mutate(comp);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de eliminar de forma permanente este componente?")) {
      deleteMutation.mutate(id);
    }
  };

  // Filtrado simple por término de búsqueda (memorizado)
  const filteredComponentes = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return (
      componentes?.filter((c: any) => {
        return (
          (c.NombreComponente?.toLowerCase() || "").includes(term) ||
          (c.Marca?.toLowerCase() || "").includes(term) ||
          (c.Modelo?.toLowerCase() || "").includes(term) ||
          (c.Capacidad?.toLowerCase() || "").includes(term) ||
          (c.NumeroSerie?.toLowerCase() || "").includes(term)
        );
      }) || []
    );
  }, [componentes, searchTerm]);

  // Definición de columnas (memorizadas)
  const columns = useMemo(() => [
    {
      accessorKey: "NombreComponente",
      header: "Nombre / Tipo",
      cell: (info: any) => (
        <span>
          {info.getValue() || "-"}
          {!info.row.original.Activo && (
            <span className="ml-2 text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              Inactivo
            </span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "Marca",
      header: "Marca",
      cell: (info: any) => info.row.original.Marca || "-",
    },
    {
      accessorKey: "Modelo",
      header: "Modelo",
      cell: (info: any) => info.getValue() || "-",
    },
    {
      accessorKey: "Capacidad",
      header: "Capacidad / Medida",
      cell: (info: any) => info.getValue() || "-",
    },
    {
      accessorKey: "Cantidad",
      header: "Stock / Cantidad",
      cell: (info: any) => info.getValue() ?? 0,
    },
    {
      accessorKey: "NumeroSerie",
      header: "Número Serie",
      cell: (info: any) => info.getValue() || "-",
    },
    {
      accessorKey: "Observacion",
      header: "Observación",
      cell: (info: any) => info.getValue() || "-",
    },
    {
      id: "actions",
      header: "Acciones",
      cell: (info: any) => {
        const comp = info.row.original;
        return (
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50" 
              title="Ver"
              onClick={() => {
                setEditingComponente(comp);
                setReadOnlyMode(true);
                setModalOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
              title="Editar"
              onClick={() => {
                setEditingComponente(comp);
                setReadOnlyMode(false);
                setModalOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 ${comp.Activo ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-slate-400 hover:text-slate-500 hover:bg-slate-100'}`} 
              title={comp.Activo ? "Desactivar" : "Activar"}
              onClick={() => handleToggleActivo(comp)}
            >
              <Power className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" 
              title="Eliminar"
              onClick={() => handleDelete(comp.IdComponente)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: filteredComponentes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventario de Componentes</h1>
          <p className="text-slate-500 text-sm">Gestión de partes de hardware, consumibles y repuestos.</p>
        </div>
        <Button 
          onClick={() => {
            setEditingComponente(null);
            setReadOnlyMode(false);
            setModalOpen(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-900/20 inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo Componente
        </Button>
      </div>

      <ComponenteFormModal 
        componente={editingComponente} 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        readOnly={readOnlyMode}
      />

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar componentes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Cargando componentes...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">
            Error al cargar los componentes. Verifica la conexión.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative">
            <table className="w-full text-sm text-left text-slate-600 border-collapse">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-6 py-4 font-semibold whitespace-nowrap sticky top-0 bg-slate-50 z-10">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b border-slate-100 transition-colors hover:bg-slate-50/50 ${
                        row.original.Activo ? "bg-white" : "bg-slate-50/40 text-slate-400 opacity-75"
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-4 text-center text-slate-500">
                      No se encontraron componentes registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cantidad total de registros */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          Mostrando {filteredComponentes.length} registros
        </div>
      </div>
    </div>
  );
}
