"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Boxes, Cpu, FileCode, Network, Ticket, Wrench, CheckCircle, XCircle, Trash2, Calendar, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Estadisticas = {
  totales: {
    totalBienes: number;
    totalBienesOperativos: number;
    totalBienesInoperativos: number;
    totalBajas: number;
    totalSoporte: number;
    totalSoportePendiente: number;
    totalSoporteProceso: number;
    totalSoporteAtendido: number;
    totalSoporteDerivado: number;
  };
  fichasPorArea: Record<string, number>;
  soportePorMes: Array<{ año: number; mes: number; cantidad: number }>;
  soportePorDia: Array<{ fecha: string; cantidad: number }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [role, setRole] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) return;
        const session = await res.json();
        setRole(String(session?.user?.role || "").toLowerCase());
      } catch (error) {
        console.error("Error cargando sesión:", error);
      }
    }; 

    const loadStats = async () => {
      try {
        const res = await fetch("/api/dashboard/estadisticas");
        if (!res.ok) throw new Error("Error al cargar estadísticas");
        const d: Estadisticas = await res.json();
        if (d && d.totales) {
          setData(d);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };

    loadSession();
    loadStats();
  }, []);

  const isSupport = role.includes("soporte") || role.includes("support");

  const defaultTotals = {
    totalBienes: 0,
    totalBienesOperativos: 0,
    totalBienesInoperativos: 0,
    totalBajas: 0,
    totalSoporte: 0,
    totalSoportePendiente: 0,
    totalSoporteProceso: 0,
    totalSoporteAtendido: 0,
    totalSoporteDerivado: 0,
  };

  const totals = data?.totales ?? defaultTotals;
  const formatNumber = (value?: number) => Number(value ?? 0).toLocaleString();

  const stats = data
    ? isSupport
      ? [
          { title: "Total Fichas", value: formatNumber(totals.totalSoporte), icon: Ticket, color: "bg-blue-500" },
          { title: "Pendientes", value: formatNumber(totals.totalSoportePendiente), icon: Clock, color: "bg-amber-500" },
          { title: "En Progreso", value: formatNumber(totals.totalSoporteProceso), icon: Wrench, color: "bg-indigo-500" },
          { title: "Atendidas", value: formatNumber(totals.totalSoporteAtendido), icon: CheckCircle, color: "bg-green-500" },
        ]
      : [
          { title: "Total Equipos", value: formatNumber(totals.totalBienes), icon: Boxes, color: "bg-blue-500" },
          { title: "Operativos", value: formatNumber(totals.totalBienesOperativos), icon: CheckCircle, color: "bg-green-500" },
          { title: "Inoperativos", value: formatNumber(totals.totalBienesInoperativos), icon: XCircle, color: "bg-red-500" },
          { title: "Dados de Baja", value: formatNumber(totals.totalBajas), icon: Trash2, color: "bg-gray-500" },
        ]
    : [];

  const statusData = data
    ? [
        { name: "Operativos", value: totals.totalBienesOperativos },
        { name: "Inoperativos", value: totals.totalBienesInoperativos },
        { name: "Baja", value: totals.totalBajas },
      ]
    : [];

  const COLORS = ["#10B981", "#EF4444", "#6B7280"];

  // Build area chart data sorted descending
  const areaChartData = data
    ? Object.entries(data.fichasPorArea ?? {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    : [];

  // Build monthly labels as "Mes Año" and count non-zero months
  const monthlyChartData = data
    ? data.soportePorMes.slice(0, 12).reverse().map((m) => ({
        label: `${m.año}-${String(m.mes).padStart(2, "0")}`,
        Fichas: m.cantidad,
      }))
    : [];

  const dailyChartData = data ? data.soportePorDia.slice(0, 14).reverse() : [];

  const ticketStatusData = data
    ? [
        { name: "Pendientes", value: data.totales.totalSoportePendiente, color: "#F59E0B" },
        { name: "En Progreso", value: data.totales.totalSoporteProceso, color: "#3B82F6" },
        { name: "Atendidos", value: data.totales.totalSoporteAtendido, color: "#10B981" },
        { name: "Derivados", value: data.totales.totalSoporteDerivado, color: "#8B5CF6" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Panel de Control</h1>
        <p className="text-slate-500 text-sm">Bienvenido al sistema de gestión de soporte e inventario.</p>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-slate-500">Cargando estadísticas...</p>
        </div>
      ) : data ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">{stat.title}</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-2 rounded-lg text-white`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Row 1: Monthly + Support Ticket Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Support Tickets Chart */}
            <Card className="lg:col-span-2 border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Fichas de Soporte por Mes
                </CardTitle>
                <CardDescription>Últimos meses — cantidad de fichas creadas</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickFormatter={(v: string) => v.slice(2)} />
                      <YAxis stroke="#94A3B8" fontSize={12} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend />
                      <Bar dataKey="Fichas" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Fichas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-sm text-center mt-20">Sin datos aún</p>
                )}
              </CardContent>
            </Card>

            {/* Ticket Status Pie */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  Estado del Ticket
                </CardTitle>
                <CardDescription>Distribución de los tickets de soporte</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex flex-col justify-between">
                <ResponsiveContainer width="100%" height="70%">
                  <PieChart>
                    <Pie
                      data={ticketStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {ticketStatusData.map((entry, index) => (
                        <Cell key={entry.name} fill={(entry as any).color ?? COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1">
                  {ticketStatusData.map((item) => (
                    <div key={item.name} className="flex justify-between text-xs text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: (item as any).color }}></span>
                        {item.name}
                      </span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Trend + Area Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Trend Line Chart */}
            <Card className="lg:col-span-2 border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Tendencia Diaria de Fichas
                </CardTitle>
                <CardDescription>Últimos 14 días de actividad de soporte</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {dailyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="fecha" stroke="#94A3B8" fontSize={11} />
                      <YAxis stroke="#94A3B8" fontSize={12} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Legend />
                      <Line type="monotone" dataKey="cantidad" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="Fichas por día" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-sm text-center mt-20">Sin datos aún</p>
                )}
              </CardContent>
            </Card>

            {/* Area Bar */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-amber-500" />
                  Fichas por Área
                </CardTitle>
                <CardDescription>Cantidad de fichas por área</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {areaChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={areaChartData.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#94A3B8" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} width={80} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="value" fill="#F59E0B" radius={[0, 4, 4, 0]} name="Fichas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-400 text-sm text-center mt-20">Sin datos aún</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="rounded-full bg-red-50 p-4">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-slate-600 font-medium">No se pudo conectar a la base de datos</p>
          <p className="text-slate-400 text-sm">Verifique la conexión al servidor SQL y recargue la página.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
