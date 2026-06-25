import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// Dashboard estadísticas: totales por área, por mes y por día de soporte
export async function GET(request: Request) {
  try {
    const [bienesResult, componentesResult, softwareResult, countsResult, areaResult, mesResult, diaResult] = await Promise.all([
      executeQuery(`EXEC sp_ConsultaBien @Accion = @Accion`, { Accion: "L" }),
      executeQuery(`EXEC sp_ConsultaBienComponente @Accion = @Accion`, { Accion: "L" }),
      executeQuery(`EXEC pro_ObtenerBienesSoftware @Activo = @Activo`, { Activo: null }),
      executeQuery(`
        SELECT
          (SELECT COUNT(*) FROM BajasBienes) AS totalBajas,
          (SELECT COUNT(*) FROM SoporteTecnico) AS totalSoporte,
          (SELECT COUNT(*) FROM SoporteTecnico WHERE EstadoTicket = 'Pendiente') AS totalSoportePendiente,
          (SELECT COUNT(*) FROM SoporteTecnico WHERE EstadoTicket = 'En Proceso') AS totalSoporteProceso,
          (SELECT COUNT(*) FROM SoporteTecnico WHERE EstadoTicket = 'Atendido') AS totalSoporteAtendido,
          (SELECT COUNT(*) FROM SoporteTecnico WHERE EstadoTicket = 'Derivado') AS totalSoporteDerivado
      `),
      executeQuery(`
        SELECT 
            ISNULL(a.NombreArea, 'Sin Área') AS NombreArea, 
            COUNT(s.IdSoporte) AS Cantidad
        FROM SoporteTecnico s
        LEFT JOIN Bienes b ON s.IdBien = b.IdBien
        LEFT JOIN Areas a ON b.IdArea = a.IdArea
        GROUP BY a.NombreArea
      `),
      executeQuery(`
        SELECT 
            CONVERT(VARCHAR(7), FechaRegistro, 120) AS label,
            COUNT(*) AS Fichas
        FROM SoporteTecnico
        WHERE FechaRegistro IS NOT NULL
        GROUP BY CONVERT(VARCHAR(7), FechaRegistro, 120)
        ORDER BY label DESC
      `),
      executeQuery(`
        SELECT TOP 30
            CONVERT(VARCHAR(10), FechaRegistro, 120) AS fecha,
            COUNT(*) AS cantidad
        FROM SoporteTecnico
        WHERE FechaRegistro IS NOT NULL
        GROUP BY CONVERT(VARCHAR(10), FechaRegistro, 120)
        ORDER BY fecha DESC
      `)
    ]);

    const counts = countsResult.recordset[0] || {};
    const totalBienes = bienesResult.recordset?.length ?? 0;
    const totalBienesActivos = bienesResult.recordset?.filter((row: any) => row.Activo === 1 || row.Activo === true).length ?? 0;
    const totalBienesInactivos = totalBienes - totalBienesActivos;
    const totalComponentes = componentesResult.recordset?.length ?? 0;
    const totalSoftware = softwareResult.recordset?.length ?? 0;

    // Formatear fichas por área
    const fichasPorArea: Record<string, number> = {};
    areaResult.recordset.forEach((row: any) => {
      fichasPorArea[row.NombreArea] = row.Cantidad;
    });

    // Formatear soporte por mes
    const soportePorMes = mesResult.recordset.map((row: any) => ({
      label: row.label,
      Fichas: row.Fichas
    }));

    // Formatear soporte por día (ordenar cronológicamente para el gráfico)
    const soportePorDia = diaResult.recordset
      .map((row: any) => ({
        fecha: row.fecha,
        cantidad: row.cantidad
      }))
      .reverse();

    return NextResponse.json({
      totales: {
        totalBienes,
        totalBienesActivos,
        totalBienesInactivos,
        totalComponentes,
        totalSoftware,
        totalBajas: counts.totalBajas,
        totalSoporte: counts.totalSoporte,
        totalSoportePendiente: counts.totalSoportePendiente,
        totalSoporteProceso: counts.totalSoporteProceso,
        totalSoporteAtendido: counts.totalSoporteAtendido,
        totalSoporteDerivado: counts.totalSoporteDerivado,
      },
      fichasPorArea,
      soportePorMes,
      soportePorDia,
    });
  } catch (error) {
    console.error("Error en GET /api/dashboard/estadisticas:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}

