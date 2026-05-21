"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

import { Edit, FileSpreadsheet, Plus, Search, Trash2, Power } from "lucide-react";

// =========================
// API FETCHERS
// =========================

const fetchUsuarios = async () => {
  const res = await fetch("/api/usuarios");
  if (!res.ok) throw new Error("Error al cargar usuarios");
  return res.json();
};

const fetchRoles = async () => {
  const res = await fetch("/api/roles");
  if (!res.ok) throw new Error("Error al cargar roles");
  return res.json();
};

const fetchSession = async () => {
  const res = await fetch("/api/auth/session");
  if (!res.ok) return { authenticated: false };
  return res.json();
};

// =========================
// PAGE COMPONENT
// =========================

export default function UsuariosPage() {
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>();

  // QUERIES
  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: fetchUsuarios,
  });

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
  });

  const { data: sessionData } = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
  });

  const userRole = sessionData?.user?.role?.toLowerCase() || "";
  const isAdmin = userRole === "admin";

  // MUTATIONS
  const saveUsuarioMutation = useMutation({
    mutationFn: async (data: any) => {
      const isEditing = !!editingUser;
      const bodyData = { ...data };
      
      if (isEditing) {
        bodyData.IdUsuario = editingUser.IdUsuario;
        bodyData.Activo = data.Activo === true || data.Activo === "true";
      }

      const res = await fetch("/api/usuarios", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al guardar el usuario");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      reset();
      setEditingUser(null);
      setOpen(false);
    },
  });

  const deleteUsuarioMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/usuarios?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al eliminar usuario");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (user: any) => {
      const res = await fetch("/api/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          IdUsuario: user.IdUsuario,
          Usuario: user.Usuario,
          Nombres: user.Nombres,
          Cargo: user.Cargo,
          IdRol: user.IdRol,
          Activo: !user.Activo,
        }),
      });
      if (!res.ok) throw new Error("Error al cambiar estado");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });

  // HANDLERS
  const handleOpenNew = () => {
    reset({
      Usuario: "",
      Nombres: "",
      Cargo: "",
      Clave: "",
      IdRol: "",
      Activo: true,
    });
    setEditingUser(null);
    setOpen(true);
  };

  const handleEdit = (user: any) => {
    reset({
      Usuario: user.Usuario,
      Nombres: user.Nombres,
      Cargo: user.Cargo || "",
      IdRol: String(user.IdRol),
      Activo: user.Activo,
    });
    setEditingUser(user);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de eliminar este usuario permanentemente?")) {
      try {
        await deleteUsuarioMutation.mutateAsync(id);
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleToggleStatus = async (user: any) => {
    const action = user.Activo ? "desactivar" : "activar";
    if (confirm(`¿Está seguro de ${action} a este usuario?`)) {
      try {
        await toggleStatusMutation.mutateAsync(user);
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const onSubmit = async (data: any) => {
    if (!editingUser && !data.Clave) {
      alert("La contraseña es requerida para usuarios nuevos.");
      return;
    }
    try {
      await saveUsuarioMutation.mutateAsync(data);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const exportToExcel = async () => {
    if (!usuarios || usuarios.length === 0) {
      alert("No hay usuarios para exportar");
      return;
    }
    
    const XLSX = await import("xlsx");
    
    const dataToExport = filteredUsuarios.map((u: any) => ({
      ID: u.IdUsuario,
      Usuario: u.Usuario,
      Nombres: u.Nombres,
      Cargo: u.Cargo || "N/A",
      Rol: u.NombreRol,
      Estado: u.Activo ? "Activo" : "Inactivo",
      "Fecha Creación": u.FechaCreacion ? new Date(u.FechaCreacion).toLocaleDateString() : ""
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });

    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Usuarios_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // FILTERS
  const filteredUsuarios = useMemo(() => {
    if (!usuarios) return [];
    if (!searchTerm) return usuarios;
    const term = searchTerm.toLowerCase();
    return usuarios.filter(
      (u: any) =>
        u.Usuario.toLowerCase().includes(term) ||
        u.Nombres.toLowerCase().includes(term) ||
        (u.Cargo && u.Cargo.toLowerCase().includes(term)) ||
        u.NombreRol.toLowerCase().includes(term)
    );
  }, [usuarios, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
          <p className="text-slate-500 text-sm">Crea, edita y administra los accesos al sistema.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportToExcel} className="gap-2">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Exportar
          </Button>
          <Button onClick={handleOpenNew} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Barra de búsqueda */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar por usuario, nombre, rol..."
              className="pl-9 bg-slate-50 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Nombres</th>
                <th className="px-6 py-4 font-semibold">Cargo</th>
                <th className="px-6 py-4 font-semibold">Rol</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Cargando usuarios...
                    </div>
                  </td>
                </tr>
              ) : filteredUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((user: any) => (
                  <tr
                    key={user.IdUsuario}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      !user.Activo ? "bg-red-50/50 hover:bg-red-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {user.Usuario}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.Nombres}</td>
                    <td className="px-6 py-4 text-slate-500">{user.Cargo || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.NombreRol}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.Activo
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.Activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(user)}
                          title={user.Activo ? "Desactivar" : "Activar"}
                          className={`${user.Activo ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"}`}
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.IdUsuario)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulario */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Modifica los datos del usuario. Si dejas la contraseña en blanco, no se cambiará."
                : "Ingresa los datos para registrar un nuevo usuario."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="Usuario">Nombre de Usuario (Login)</Label>
              <Input
                id="Usuario"
                {...register("Usuario", { required: true })}
                className={errors.Usuario ? "border-red-500" : ""}
                placeholder="ej: jdoe"
                disabled={!!editingUser}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="Nombres">Nombres y Apellidos completos</Label>
              <Input
                id="Nombres"
                {...register("Nombres", { required: true })}
                className={errors.Nombres ? "border-red-500" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="Cargo">Cargo</Label>
              <Input
                id="Cargo"
                {...register("Cargo")}
                placeholder="ej: Técnico Soporte"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="IdRol">Rol</Label>
              <Select
                value={watch("IdRol")}
                onValueChange={(val) => setValue("IdRol", val, { shouldValidate: true })}
              >
                <SelectTrigger className={errors.IdRol ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((r: any) => (
                    <SelectItem key={r.IdRol} value={String(r.IdRol)}>
                      {r.NombreRol.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="Clave">Contraseña</Label>
              <Input
                id="Clave"
                type="password"
                {...register("Clave")}
                placeholder={editingUser ? "Dejar en blanco para mantener actual" : "Requerido"}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveUsuarioMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                {saveUsuarioMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
