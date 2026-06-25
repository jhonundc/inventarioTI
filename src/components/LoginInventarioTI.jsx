import React, { useState } from "react";

export default function LoginInventarioTI({ onLogin }) {
  const [role, setRole] = useState("tecnico");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin) onLogin({ role, username, password, remember });
  };

  return (
    <div id="login-rezola-ti" className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
      <div className="w-full max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.95fr]">

          {/* Left informational panel */}
          <aside className="rounded-2xl border border-white/6 bg-white/3 p-10 text-white shadow-2xl backdrop-blur-md">
            <div className="mb-4 text-sm font-medium text-cyan-200/90">SISTEMA DE SOPORTE E INVENTARIO</div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
              Acceso seguro con una interfaz clara y transparente.
            </h1>
            <p className="mt-6 max-w-xl text-base text-gray-300">
              Ingresa al módulo técnico para gestionar bienes, componentes, licencias de software y fichas de
              atención con una vista más limpia y moderna.
            </p>

            <div className="mt-10 rounded-xl border border-white/6 bg-white/5 p-6 text-sm text-gray-300 shadow-lg">
              <p className="font-semibold text-white">InventarioTI</p>
              <p className="mt-2 text-gray-400">Sistema para administración y soporte técnico de activos.</p>
            </div>
          </aside>

          {/* Right form panel */}
          <div className="rounded-2xl border border-white/6 bg-white/5 shadow-2xl backdrop-blur-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between gap-4 rounded-md bg-slate-900/60 p-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("tecnico")}
                    className={`min-w-[110px] rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      role === "tecnico"
                        ? "bg-cyan-400 text-slate-900 shadow-md"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    Técnico
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("administrador")}
                    className={`min-w-[110px] rounded-lg px-4 py-2 text-sm font-medium transition ${
                      role === "administrador" ? "bg-slate-700 text-white" : "text-gray-300 hover:text-white"
                    }`}
                  >
                    Administrador
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <h2 className="text-2xl font-bold text-white">Bienvenido</h2>
                <p className="text-sm text-gray-400">Inicia sesión para gestionar el sistema</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300">Nombre de usuario</label>
                <div className="relative mt-2">
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="usuario"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Contraseña</label>
                <div className="relative mt-2">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="********"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-cyan-400"
                  />
                  Recordar sesión
                </label>

                <button type="button" className="inline-flex items-center gap-2 rounded-md bg-slate-800/60 px-3 py-2 text-sm text-gray-200">
                  Soporte 🎧
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-600/20 hover:brightness-105 transition"
                >
                  Iniciar sesión
                </button>
              </div>

              <div className="pt-4 text-center text-xs text-gray-400">
                Sistema desarrollado por el Área de Soporte Técnico
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
