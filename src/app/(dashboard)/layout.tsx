"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogOut, User, Key } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarCollapsed } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) return;
        const data = await res.json();
        setRole(String(data?.user?.role || "").toLowerCase());
      } catch (error) {
        console.error("Error cargando sesión en DashboardLayout:", error);
      }
    };

    loadSession();
  }, []);

  useEffect(() => {
    if (!role) return;
    if (role.includes("soporte") && pathname !== "/reportes" && pathname !== "/" && !pathname.startsWith("/inventario") && pathname !== "/redes" && !pathname.startsWith("/soporte")) {
      router.replace("/reportes");
    }
  }, [role, pathname, router]);

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "ml-0" : "ml-0" // We use flex layout, so margin left is not strictly needed if Sidebar is fixed or just part of the flex row.
        )}
      >
        {/* Navbar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-6 justify-between">
          <div className="font-medium text-slate-700">Panel de Control</div>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger >
                <div className="flex items-center space-x-3 focus:outline-none hover:bg-slate-50 p-2 rounded-lg transition-colors cursor-pointer">
                  <div className="text-sm text-right hidden sm:block">
                    <p className="font-medium text-slate-700"></p>
                    <p className="text-xs text-slate-500"></p>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white text-xs">R</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-semibold text-slate-900">Mi Cuenta</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Agregar Perfil (Foto)</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Key className="mr-2 h-4 w-4" />
                  <span>Cambiar Clave</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.href = "/login";
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
