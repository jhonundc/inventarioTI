"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Eye, Power } from "lucide-react";
import SoftwareFormModal from "@/components/inventory/SoftwareFormModal";

const fetchSoftware = async ({ queryKey }: any) => {
  const [_key, search] = queryKey;
  const term = String(search || "").trim();
  const url = term ? `/api/software?nombre=${encodeURIComponent(term)}` : "/api/software";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al cargar el inventario de software");
  return res.json();
};

export default function SoftwarePage() {
  const queryClient = useQueryClient();
  const [softwareSearchTerm, setSoftwareSearchTerm] = useState("");
  const { data: software, isLoading, error } = useQuery({
    queryKey: ["software", softwareSearchTerm],
    queryFn: fetchSoftware,
  });
  const { data: sessionData } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session");
      if (!res.ok) return { user: { role: "" } };
      return res.json();
    },
  });
  const isSupport = String(sessionData?.user?.role || "").toLowerCase().includes("soporte");

  const [visibleCount, setVisibleCount] = useState(12);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState<any>(null);
  const [readOnlyMode, setReadOnlyMode] = useState(false);

  const toggleActivoMutation = useMutation({
    mutationFn: async (item: any) => {
      const res = await fetch("/api/software", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ IdSoftware: item.IdSoftware, Activo: !item.Activo }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al cambiar el estado del software");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["software"] }),
    onError: (error: any) => alert(error.message),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = data.IdSoftware ? "PATCH" : "POST";
      const url = "/api/software";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar el software");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["software"] });
      setModalOpen(false);
    },
    onError: (error: any) => alert(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/software?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al desactivar el software");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["software"] }),
    onError: (error: any) => alert(error.message),
  });

  const handleToggleActivo = (item: any) => {
    const action = item.Activo ? "desactivar" : "activar";
    if (confirm(`¿Está seguro de ${action} este software?`)) {
      toggleActivoMutation.mutate(item);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de desactivar este software?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredSoftware = useMemo(() => software || [], [software]);

  const displayedSoftware = useMemo(
    () => filteredSoftware.slice(0, visibleCount),
    [filteredSoftware, visibleCount]
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 40) {
      if (visibleCount < filteredSoftware.length) {
        setVisibleCount((prev) => prev + 12);
      }
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "NombreSoftware",
        header: "Software",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "TipoSoftware",
        header: "Tipo",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "VersionSoftware",
        header: "Versión",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "ProveedorEntidad",
        header: "Proveedor",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "TipoLicencia",
        header: "Licencia",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "CantidadLicencias",
        header: "Cantidad",
        cell: (info: any) => info.getValue() ?? "-",
      },
      {
        accessorKey: "EstadoLicencia",
        header: "Estado",
        cell: (info: any) => info.getValue() || "-",
      },
      {
        accessorKey: "FechaCaducidad",
        header: "Caducidad",
        cell: (info: any) => {
          const value = info.getValue();
          return value ? new Date(value).toLocaleDateString() : "-";
        },
      },
      {
        accessorKey: "Activo",
        header: "Activo",
        cell: (info: any) => (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            info.getValue() ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}>
            {info.getValue() ? "Sí" : "No"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Acciones",
        cell: (info: any) => {
          const item = info.row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-500 hover:text-slate-900"
                title="Ver"
                onClick={() => {
                  setEditingSoftware(item);
                  setReadOnlyMode(true);
                  setModalOpen(true);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {!isSupport && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-blue-600 hover:text-blue-800"
                    title="Editar"
                    onClick={() => {
                      setEditingSoftware(item);
                      setReadOnlyMode(false);
                      setModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 ${item.Activo ? "text-amber-600 hover:text-amber-800" : "text-slate-500 hover:text-slate-900"}`}
                    title={item.Activo ? "Desactivar" : "Activar"}
                    onClick={() => handleToggleActivo(item)}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-600 hover:text-red-800"
                    title="Desactivar"
                    onClick={() => handleDelete(item.IdSoftware)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [isSupport]
  );

  const table = useReactTable({
    data: displayedSoftware,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventario de Software</h1>
          <p className="text-slate-500 text-sm">Registro, edición y seguimiento de licencias de software.</p>
        </div>
        {!isSupport && (
        <Button
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-900/20 inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 px-4 py-2"
          onClick={() => {
            setEditingSoftware(null);
            setReadOnlyMode(false);
            setModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo Software
        </Button>
      )}
      </div>

      <SoftwareFormModal
        software={editingSoftware}
        open={modalOpen}
        onOpenChange={setModalOpen}
        readOnly={readOnlyMode}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">Buscar software</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={softwareSearchTerm}
              onChange={(e) => {
                setSoftwareSearchTerm(e.target.value);
                setVisibleCount(12);
              }}
              placeholder="Nombre, proveedor, tipo de licencia..."
              className="pl-10 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-slate-500">Cargando software...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">Error al cargar el inventario de software.</div>
        ) : (
          <div
            onScroll={handleScroll}
            className="overflow-x-auto max-h-[620px] overflow-y-auto relative"
          >
            <table className="w-full text-sm text-left text-slate-600 border-collapse">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3 font-semibold whitespace-nowrap sticky top-0 bg-slate-50 z-10"
                      >
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
                        row.original.Activo ? "bg-white" : "bg-slate-50/40 text-slate-400 opacity-80"
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-3 align-top whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-6 text-center text-slate-500">
                      No se encontraron registros de software.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500">
        <span>
          Mostrando {displayedSoftware.length} de {filteredSoftware.length} registros
        </span>
        {filteredSoftware.length > displayedSoftware.length && (
          <span className="text-blue-600 font-medium">Desplázate hacia abajo para ver más...</span>
        )}
      </div>
    </div>
  );
}
