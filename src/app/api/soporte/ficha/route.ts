import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// Helper para mapear una fila plana de la base de datos al formato relacional estructurado
function mapFichaRow(row: any) {
  return {
    IdSoporte: row.IdSoporte,
    NumeroFicha: row.NumeroFicha,
    UnidadOrganica: row.UnidadOrganica,
    IdBien: row.IdBien,
    Responsable: row.Responsable,
    Dependencia: row.Dependencia,
    Ambiente: row.Ambiente,
    TipoBien: row.TipoBien,
    IdCondicion: row.IdCondicion,
    IdEstadoBien: row.IdEstadoBien,
    TrabajosRealizados: row.TrabajosRealizados,
    Diagnostico: row.Diagnostico,
    Recomendacion: row.Recomendacion,
    IdPrioridad: row.IdPrioridad,
    EstadoTicket: row.EstadoTicket,
    Siglas: row.Siglas,
    FirmaSoporte: row.FirmaSoporte,
    FirmaJefeUnidad: row.FirmaJefeUnidad,
    FirmaAreaUsuario: row.FirmaAreaUsuario,
    IdUsuarioSoporte: row.IdUsuarioSoporte,
    FechaRegistro: row.FechaRegistro,
    Bien: row.IdBien
      ? {
        IdBien: row.IdBien,
        CodigoInventario: row.Bien_CodigoInventario,
        CodigoPatrimonial: row.Bien_CodigoPatrimonial,
        Descripcion: row.Bien_Descripcion,
        NumeroSerie: row.Bien_NumeroSerie,
        IdMarca: row.Bien_IdMarca,
        IdModelo: row.Bien_IdModelo,
        IdArea: row.Bien_IdArea,
        IdCondicion: row.Bien_IdCondicion,
        IdEstadoBien: row.Bien_IdEstadoBien,
        Activo: row.Bien_Activo,
        Marca: row.Bien_IdMarca
          ? { IdMarca: row.Bien_IdMarca, Marca: row.Bien_Marca_Marca, Activo: row.Bien_Marca_Activo }
          : null,
        Modelo: row.Bien_IdModelo
          ? {
            IdModelo: row.Bien_IdModelo,
            Modelo: row.Bien_Modelo_Modelo,
            IdMarca: row.Bien_Modelo_IdMarca,
            IdCategoria: row.Bien_Modelo_IdCategoria,
            Activo: row.Bien_Modelo_Activo,
          }
          : null,
        Area: row.Bien_IdArea
          ? {
            IdArea: row.Bien_IdArea,
            NombreArea: row.Bien_Area_NombreArea,
            Piso: row.Bien_Area_Piso,
            Referencia: row.Bien_Area_Referencia,
            Activo: row.Bien_Area_Activo,
          }
          : null,
        Condicion: row.Bien_IdCondicion
          ? {
            IdCondicion: row.Bien_IdCondicion,
            Condicion: row.Bien_Condicion_Condicion,
            Activo: row.Bien_Condicion_Activo,
          }
          : null,
        Estado: row.Bien_IdEstadoBien
          ? {
            IdEstadoBien: row.Bien_IdEstadoBien,
            EstadoBien: row.Bien_Estado_EstadoBien,
            Activo: row.Bien_Estado_Activo,
          }
          : null,
      }
      : null,
    Condicion: row.IdCondicion
      ? {
        IdCondicion: row.IdCondicion,
        Condicion: row.Condicion_Condicion,
        Activo: row.Condicion_Activo,
      }
      : null,
    Estado: row.IdEstadoBien
      ? {
        IdEstadoBien: row.IdEstadoBien,
        EstadoBien: row.Estado_EstadoBien,
        Activo: row.Estado_Activo,
      }
      : null,
    Prioridad: row.IdPrioridad
      ? {
        IdPrioridad: row.IdPrioridad,
        NombrePrioridad: row.Prioridad_Prioridad,
        Activo: row.Prioridad_Activo,
      }
      : null,
    UsuarioSoporte: row.IdUsuarioSoporte
      ? {
        Nombres: row.Usuario_Nombres,
        Usuario: row.Usuario_Usuario,
      }
      : null,
  };
}

async function fetchFichaById(id: number) {
  // Validar existencia usando el procedimiento de consulta
  const check = await executeQuery(
    `EXEC pro_ConsultarSoporteTecnico @TipoConsulta = @TipoConsulta, @IdSoporte = @IdSoporte`,
    { TipoConsulta: "POR_ID", IdSoporte: id }
  );
  if (!check.recordset || check.recordset.length === 0) return null;

  // Obtener la fila enriquecida (con joins) para devolver la estructura completa
  const queryText = `
    SELECT 
        s.*,
        b.CodigoInventario AS Bien_CodigoInventario, b.CodigoPatrimonial AS Bien_CodigoPatrimonial, b.Descripcion AS Bien_Descripcion, b.NumeroSerie AS Bien_NumeroSerie, b.IdMarca AS Bien_IdMarca, b.IdModelo AS Bien_IdModelo, b.IdArea AS Bien_IdArea, b.IdCondicion AS Bien_IdCondicion, b.IdEstadoBien AS Bien_IdEstadoBien, b.Activo AS Bien_Activo,
        bm.Marca AS Bien_Marca_Marca, bm.Activo AS Bien_Marca_Activo,
        bmo.Modelo AS Bien_Modelo_Modelo, bmo.Activo AS Bien_Modelo_Activo, bmo.IdMarca AS Bien_Modelo_IdMarca, bmo.IdCategoria AS Bien_Modelo_IdCategoria,
        ba.NombreArea AS Bien_Area_NombreArea, ba.Piso AS Bien_Area_Piso, ba.Referencia AS Bien_Area_Referencia, ba.Activo AS Bien_Area_Activo,
        bc.Condicion AS Bien_Condicion_Condicion, bc.Activo AS Bien_Condicion_Activo,
        be.EstadoBien AS Bien_Estado_EstadoBien, be.Activo AS Bien_Estado_Activo,
        sc.Condicion AS Condicion_Condicion, sc.Activo AS Condicion_Activo,
        se.EstadoBien AS Estado_EstadoBien, se.Activo AS Estado_Activo,
        p.NombrePrioridad AS Prioridad_Prioridad, p.Activo AS Prioridad_Activo,
        u.Nombres AS Usuario_Nombres, u.Usuario AS Usuario_Usuario
    FROM SoporteTecnico s
    LEFT JOIN Bienes b ON s.IdBien = b.IdBien
    LEFT JOIN Marcas bm ON b.IdMarca = bm.IdMarca
    LEFT JOIN Modelos bmo ON b.IdModelo = bmo.IdModelo
    LEFT JOIN Areas ba ON b.IdArea = ba.IdArea
    LEFT JOIN CondicionesBien bc ON b.IdCondicion = bc.IdCondicion
    LEFT JOIN EstadosDelBien be ON b.IdEstadoBien = be.IdEstadoBien
    LEFT JOIN CondicionesBien sc ON s.IdCondicion = sc.IdCondicion
    LEFT JOIN EstadosDelBien se ON s.IdEstadoBien = se.IdEstadoBien
    LEFT JOIN Prioridades p ON s.IdPrioridad = p.IdPrioridad
    LEFT JOIN Usuarios u ON s.IdUsuarioSoporte = u.IdUsuario
    WHERE s.IdSoporte = @IdSoporte
  `;
  const result = await executeQuery(queryText, { IdSoporte: id });
  if (result.recordset.length === 0) return null;
  return mapFichaRow(result.recordset[0]);
}

// Obtener todas las fichas de soporte
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const numeroFichaParam = searchParams.get("numeroFicha");
    const estadoParam = searchParams.get("estadoTicket");

    // Si piden por id -> devolver ficha enriquecida
    if (idParam) {
      const id = parseInt(idParam);
      if (isNaN(id)) {
        return NextResponse.json({ error: "Id inválido" }, { status: 400 });
      }
      const ficha = await fetchFichaById(id);
      if (!ficha) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      return NextResponse.json(ficha);
    }

    // Si piden por número de ficha -> usar procedimiento y luego enriquecer
    if (numeroFichaParam) {
      const q = await executeQuery(
        `EXEC pro_ConsultarSoporteTecnico @TipoConsulta = @TipoConsulta, @NumeroFicha = @NumeroFicha`,
        { TipoConsulta: "POR_FICHA", NumeroFicha: numeroFichaParam }
      );
      const row = q.recordset[0];
      if (!row) return NextResponse.json([], { status: 200 });
      const ficha = await fetchFichaById(row.IdSoporte);
      return NextResponse.json(ficha || null);
    }

    // Si piden por estado -> devolver lista enriquecida filtrada
    if (estadoParam) {
      const q = await executeQuery(
        `SELECT 
           s.*,
           b.CodigoInventario AS Bien_CodigoInventario, b.CodigoPatrimonial AS Bien_CodigoPatrimonial, b.Descripcion AS Bien_Descripcion, b.NumeroSerie AS Bien_NumeroSerie, b.IdMarca AS Bien_IdMarca, b.IdModelo AS Bien_IdModelo, b.IdArea AS Bien_IdArea, b.IdCondicion AS Bien_IdCondicion, b.IdEstadoBien AS Bien_IdEstadoBien, b.Activo AS Bien_Activo,
           bm.Marca AS Bien_Marca_Marca, bm.Activo AS Bien_Marca_Activo,
           bmo.Modelo AS Bien_Modelo_Modelo, bmo.Activo AS Bien_Modelo_Activo, bmo.IdMarca AS Bien_Modelo_IdMarca, bmo.IdCategoria AS Bien_Modelo_IdCategoria,
           ba.NombreArea AS Bien_Area_NombreArea, ba.Piso AS Bien_Area_Piso, ba.Referencia AS Bien_Area_Referencia, ba.Activo AS Bien_Area_Activo,
           bc.Condicion AS Bien_Condicion_Condicion, bc.Activo AS Bien_Condicion_Activo,
           be.EstadoBien AS Bien_Estado_EstadoBien, be.Activo AS Bien_Estado_Activo,
           sc.Condicion AS Condicion_Condicion, sc.Activo AS Condicion_Activo,
           se.EstadoBien AS Estado_EstadoBien, se.Activo AS Estado_Activo,
           p.NombrePrioridad AS Prioridad_Prioridad, p.Activo AS Prioridad_Activo,
           u.Nombres AS Usuario_Nombres, u.Usuario AS Usuario_Usuario
         FROM SoporteTecnico s
         LEFT JOIN Bienes b ON s.IdBien = b.IdBien
         LEFT JOIN Marcas bm ON b.IdMarca = bm.IdMarca
         LEFT JOIN Modelos bmo ON b.IdModelo = bmo.IdModelo
         LEFT JOIN Areas ba ON b.IdArea = ba.IdArea
         LEFT JOIN CondicionesBien bc ON b.IdCondicion = bc.IdCondicion
         LEFT JOIN EstadosDelBien be ON b.IdEstadoBien = be.IdEstadoBien
         LEFT JOIN CondicionesBien sc ON s.IdCondicion = sc.IdCondicion
         LEFT JOIN EstadosDelBien se ON s.IdEstadoBien = se.IdEstadoBien
         LEFT JOIN Prioridades p ON s.IdPrioridad = p.IdPrioridad
         LEFT JOIN Usuarios u ON s.IdUsuarioSoporte = u.IdUsuario
         WHERE s.EstadoTicket = @EstadoTicket
         ORDER BY s.FechaRegistro DESC`,
        { EstadoTicket: estadoParam }
      );
      const fichas = q.recordset.map(mapFichaRow);
      return NextResponse.json(fichas);
    }

    // Default: listar todos (con joins para mantener estructura enriquecida)
    const queryText = `
      SELECT 
          s.*,
          b.CodigoInventario AS Bien_CodigoInventario, b.CodigoPatrimonial AS Bien_CodigoPatrimonial, b.Descripcion AS Bien_Descripcion, b.NumeroSerie AS Bien_NumeroSerie, b.IdMarca AS Bien_IdMarca, b.IdModelo AS Bien_IdModelo, b.IdArea AS Bien_IdArea, b.IdCondicion AS Bien_IdCondicion, b.IdEstadoBien AS Bien_IdEstadoBien, b.Activo AS Bien_Activo,
          bm.Marca AS Bien_Marca_Marca, bm.Activo AS Bien_Marca_Activo,
          bmo.Modelo AS Bien_Modelo_Modelo, bmo.Activo AS Bien_Modelo_Activo, bmo.IdMarca AS Bien_Modelo_IdMarca, bmo.IdCategoria AS Bien_Modelo_IdCategoria,
          ba.NombreArea AS Bien_Area_NombreArea, ba.Piso AS Bien_Area_Piso, ba.Referencia AS Bien_Area_Referencia, ba.Activo AS Bien_Area_Activo,
          bc.Condicion AS Bien_Condicion_Condicion, bc.Activo AS Bien_Condicion_Activo,
          be.EstadoBien AS Bien_Estado_EstadoBien, be.Activo AS Bien_Estado_Activo,
          sc.Condicion AS Condicion_Condicion, sc.Activo AS Condicion_Activo,
          se.EstadoBien AS Estado_EstadoBien, se.Activo AS Estado_Activo,
          p.NombrePrioridad AS Prioridad_Prioridad, p.Activo AS Prioridad_Activo,
          u.Nombres AS Usuario_Nombres, u.Usuario AS Usuario_Usuario
      FROM SoporteTecnico s
      LEFT JOIN Bienes b ON s.IdBien = b.IdBien
      LEFT JOIN Marcas bm ON b.IdMarca = bm.IdMarca
      LEFT JOIN Modelos bmo ON b.IdModelo = bmo.IdModelo
      LEFT JOIN Areas ba ON b.IdArea = ba.IdArea
      LEFT JOIN CondicionesBien bc ON b.IdCondicion = bc.IdCondicion
      LEFT JOIN EstadosDelBien be ON b.IdEstadoBien = be.IdEstadoBien
      LEFT JOIN CondicionesBien sc ON s.IdCondicion = sc.IdCondicion
      LEFT JOIN EstadosDelBien se ON s.IdEstadoBien = se.IdEstadoBien
      LEFT JOIN Prioridades p ON s.IdPrioridad = p.IdPrioridad
      LEFT JOIN Usuarios u ON s.IdUsuarioSoporte = u.IdUsuario
      ORDER BY s.FechaRegistro DESC
    `;
    const result = await executeQuery(queryText);
    const fichas = result.recordset.map(mapFichaRow);
    return NextResponse.json(fichas);
  } catch (error) {
    console.error("Error en GET /api/soporte/ficha:", error);
    return NextResponse.json(
      { error: "Error al obtener las fichas de soporte" },
      { status: 500 }
    );
  }
}

// Crear una nueva ficha de soporte
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validaciones básicas
    if (!data.NumeroFicha) {
      return NextResponse.json(
        { error: "El número de ficha es requerido" },
        { status: 400 }
      );
    }

    const params = {
      Accion: "I",
      NumeroFicha: data.NumeroFicha,
      UnidadOrganica: data.UnidadOrganica || "UNIDAD DE ESTADISTICA E INFORMATICA",
      IdBien: data.IdBien ? parseInt(data.IdBien) : null,
      Responsable: data.Responsable || null,
      Dependencia: data.Dependencia || null,
      Ambiente: data.Ambiente || null,
      TipoBien: data.TipoBien || null,
      IdCondicion: data.IdCondicion ? parseInt(data.IdCondicion) : null,
      IdEstadoBien: data.IdEstadoBien ? parseInt(data.IdEstadoBien) : null,
      TrabajosRealizados: data.TrabajosRealizados || null,
      Diagnostico: data.Diagnostico || null,
      Recomendacion: data.Recomendacion || null,
      IdPrioridad: data.IdPrioridad ? parseInt(data.IdPrioridad) : null,
      EstadoTicket: data.EstadoTicket || "Pendiente",
      Siglas: data.Siglas || null,
      FirmaSoporte: data.FirmaSoporte || null,
      FirmaJefeUnidad: data.FirmaJefeUnidad || null,
      FirmaAreaUsuario: data.FirmaAreaUsuario || null,
      IdUsuarioSoporte: data.IdUsuarioSoporte ? parseInt(data.IdUsuarioSoporte) : null,
    };

    await executeQuery(
      `EXEC pro_MantenimientoSoporteTecnico
         @Accion = @Accion,
         @NumeroFicha = @NumeroFicha,
         @UnidadOrganica = @UnidadOrganica,
         @IdBien = @IdBien,
         @Responsable = @Responsable,
         @Dependencia = @Dependencia,
         @Ambiente = @Ambiente,
         @TipoBien = @TipoBien,
         @IdCondicion = @IdCondicion,
         @IdEstadoBien = @IdEstadoBien,
         @TrabajosRealizados = @TrabajosRealizados,
         @Diagnostico = @Diagnostico,
         @Recomendacion = @Recomendacion,
         @IdPrioridad = @IdPrioridad,
         @EstadoTicket = @EstadoTicket,
         @Siglas = @Siglas,
         @FirmaSoporte = @FirmaSoporte,
         @FirmaJefeUnidad = @FirmaJefeUnidad,
         @FirmaAreaUsuario = @FirmaAreaUsuario,
         @IdUsuarioSoporte = @IdUsuarioSoporte`,
      params
    );

    const idResult = await executeQuery(
      `SELECT TOP 1 IdSoporte FROM SoporteTecnico
         WHERE NumeroFicha = @NumeroFicha
         ORDER BY FechaRegistro DESC`,
      { NumeroFicha: data.NumeroFicha }
    );

    const newId = idResult.recordset[0]?.IdSoporte;
    if (!newId) {
      throw new Error("No se pudo obtener el IdSoporte después de ejecutar el procedimiento almacenado");
    }

    const nuevaFicha = await fetchFichaById(newId);

    return NextResponse.json(nuevaFicha, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/soporte/ficha:", error);
    return NextResponse.json(
      { error: "Error al crear la ficha de soporte" },
      { status: 500 }
    );
  }
}

// Actualizar una ficha de soporte
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const id = parseInt(data.IdSoporte);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "IdSoporte es requerido y debe ser un número válido" },
        { status: 400 }
      );
    }

    if (!data.NumeroFicha) {
      return NextResponse.json(
        { error: "NumeroFicha es requerido" },
        { status: 400 }
      );
    }

    const params = {
      Accion: "U",
      IdSoporte: id,
      NumeroFicha: data.NumeroFicha,
      UnidadOrganica: data.UnidadOrganica || "UNIDAD DE ESTADISTICA E INFORMATICA",
      IdBien: data.IdBien ? parseInt(data.IdBien) : null,
      Responsable: data.Responsable || null,
      Dependencia: data.Dependencia || null,
      Ambiente: data.Ambiente || null,
      TipoBien: data.TipoBien || null,
      IdCondicion: data.IdCondicion ? parseInt(data.IdCondicion) : null,
      IdEstadoBien: data.IdEstadoBien ? parseInt(data.IdEstadoBien) : null,
      TrabajosRealizados: data.TrabajosRealizados || null,
      Diagnostico: data.Diagnostico || null,
      Recomendacion: data.Recomendacion || null,
      IdPrioridad: data.IdPrioridad ? parseInt(data.IdPrioridad) : null,
      EstadoTicket: data.EstadoTicket || "Pendiente",
      Siglas: data.Siglas || null,
      FirmaSoporte: data.FirmaSoporte || null,
      FirmaJefeUnidad: data.FirmaJefeUnidad || null,
      FirmaAreaUsuario: data.FirmaAreaUsuario || null,
      IdUsuarioSoporte: data.IdUsuarioSoporte ? parseInt(data.IdUsuarioSoporte) : null,
    };

    try {
      await executeQuery(
        `EXEC pro_MantenimientoSoporteTecnico
           @Accion = @Accion,
           @IdSoporte = @IdSoporte,
           @NumeroFicha = @NumeroFicha,
           @UnidadOrganica = @UnidadOrganica,
           @IdBien = @IdBien,
           @Responsable = @Responsable,
           @Dependencia = @Dependencia,
           @Ambiente = @Ambiente,
           @TipoBien = @TipoBien,
           @IdCondicion = @IdCondicion,
           @IdEstadoBien = @IdEstadoBien,
           @TrabajosRealizados = @TrabajosRealizados,
           @Diagnostico = @Diagnostico,
           @Recomendacion = @Recomendacion,
           @IdPrioridad = @IdPrioridad,
           @EstadoTicket = @EstadoTicket,
           @Siglas = @Siglas,
           @FirmaSoporte = @FirmaSoporte,
           @FirmaJefeUnidad = @FirmaJefeUnidad,
           @FirmaAreaUsuario = @FirmaAreaUsuario,
           @IdUsuarioSoporte = @IdUsuarioSoporte`,
        params
      );
    } catch (execError: any) {
      console.error("Error ejecutando procedimiento en PATCH:", execError);
      return NextResponse.json(
        { error: `Error al ejecutar actualización: ${execError.message || "Error desconocido"}` },
        { status: 500 }
      );
    }

    // Verificar que la ficha actualizada exista
    const fichaActualizada = await fetchFichaById(id);
    if (!fichaActualizada) {
      return NextResponse.json(
        { error: "La ficha no se actualizó correctamente" },
        { status: 500 }
      );
    }

    return NextResponse.json(fichaActualizada);
  } catch (error) {
    console.error("Error en PATCH /api/soporte/ficha:", error);
    return NextResponse.json(
      { error: `Error al actualizar la ficha de soporte: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 }
    );
  }
}

// Eliminar una ficha de soporte
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "");

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "IdSoporte es requerido" },
        { status: 400 }
      );
    }

    await executeQuery(
      `EXEC pro_MantenimientoSoporteTecnico
         @Accion = @Accion,
         @IdSoporte = @IdSoporte`,
      { Accion: "D", IdSoporte: id }
    );

    return NextResponse.json({ success: true, message: "Ficha eliminada exitosamente" });
  } catch (error) {
    console.error("Error en DELETE /api/soporte/ficha:", error);
    return NextResponse.json(
      { error: "Error al eliminar la ficha de soporte" },
      { status: 500 }
    );
  }
}


