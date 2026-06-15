import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// Obtener todas las fichas de baja
export async function GET() {
  try {
    const queryText = `
      SELECT 
          bb.*,
          b.CodigoInventario AS Bien_CodigoInventario, b.CodigoPatrimonial AS Bien_CodigoPatrimonial, b.Descripcion AS Bien_Descripcion, b.NumeroSerie AS Bien_NumeroSerie, b.Activo AS Bien_Activo,
          c.Condicion AS Condicion_Condicion, c.Activo AS Condicion_Activo,
          e.EstadoBien AS Estado_EstadoBien, e.Activo AS Estado_Activo,
          u.Nombres AS Usuario_Nombres, u.Usuario AS Usuario_Usuario
      FROM BajasBienes bb
      LEFT JOIN Bienes b ON bb.IdBien = b.IdBien
      LEFT JOIN CondicionesBien c ON bb.IdCondicion = c.IdCondicion
      LEFT JOIN EstadosDelBien e ON bb.IdEstadoBien = e.IdEstadoBien
      LEFT JOIN Usuarios u ON bb.IdUsuarioRegistro = u.IdUsuario
      ORDER BY bb.FechaRegistro DESC
    `;
    const result = await executeQuery(queryText);

    const fichas = result.recordset.map((row: any) => ({
      IdBaja: row.IdBaja,
      NumeroFichaBaja: row.NumeroFichaBaja,
      FechaRegistro: row.FechaRegistro,
      UnidadOrganica: row.UnidadOrganica,
      IdBien: row.IdBien,
      Responsable: row.Responsable,
      Dependencia: row.Dependencia,
      Ambiente: row.Ambiente,
      TipoBien: row.TipoBien,
      IdCondicion: row.IdCondicion,
      IdEstadoBien: row.IdEstadoBien,
      Fundamentacion: row.Fundamentacion,
      Recomendacion: row.Recomendacion,
      CausalBaja: row.CausalBaja,
      Observacion: row.Observacion,
      IdUsuarioRegistro: row.IdUsuarioRegistro,
      Bien: row.IdBien
        ? {
            IdBien: row.IdBien,
            CodigoInventario: row.Bien_CodigoInventario,
            CodigoPatrimonial: row.Bien_CodigoPatrimonial,
            Descripcion: row.Bien_Descripcion,
            NumeroSerie: row.Bien_NumeroSerie,
            Activo: row.Bien_Activo,
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
      UsuarioRegistro: row.IdUsuarioRegistro
        ? {
            Nombres: row.Usuario_Nombres,
            Usuario: row.Usuario_Usuario,
          }
        : null,
    }));

    return NextResponse.json(fichas);
  } catch (error) {
    console.error("Error en GET /api/soporte/baja:", error);
    return NextResponse.json(
      { error: "Error al obtener las fichas de baja" },
      { status: 500 }
    );
  }
}

// Crear una nueva ficha de baja
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validaciones básicas
    if (!data.NumeroFichaBaja || !data.IdBien) {
      return NextResponse.json(
        { error: "El número de ficha y el bien son requeridos" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO BajasBienes (
        NumeroFichaBaja, UnidadOrganica, IdBien, Responsable, Dependencia, 
        Ambiente, TipoBien, IdCondicion, IdEstadoBien, Fundamentacion, 
        Recomendacion, CausalBaja, Observacion, IdUsuarioRegistro, FechaRegistro
       ) 
       OUTPUT INSERTED.* 
       VALUES (
        @NumeroFichaBaja, @UnidadOrganica, @IdBien, @Responsable, @Dependencia,
        @Ambiente, @TipoBien, @IdCondicion, @IdEstadoBien, @Fundamentacion,
        @Recomendacion, @CausalBaja, @Observacion, @IdUsuarioRegistro, GETDATE()
       )`,
      {
        NumeroFichaBaja: data.NumeroFichaBaja,
        UnidadOrganica: data.UnidadOrganica || null,
        IdBien: parseInt(data.IdBien),
        Responsable: data.Responsable || null,
        Dependencia: data.Dependencia || null,
        Ambiente: data.Ambiente || null,
        TipoBien: data.TipoBien || null,
        IdCondicion: data.IdCondicion ? parseInt(data.IdCondicion) : null,
        IdEstadoBien: data.IdEstadoBien ? parseInt(data.IdEstadoBien) : null,
        Fundamentacion: data.Fundamentacion || null,
        Recomendacion: data.Recomendacion || null,
        CausalBaja: data.CausalBaja || null,
        Observacion: data.Observacion || null,
        IdUsuarioRegistro: data.IdUsuarioRegistro ? parseInt(data.IdUsuarioRegistro) : null,
      }
    );
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/soporte/baja:", error);
    return NextResponse.json(
      { error: "Error al crear la ficha de baja" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const id = parseInt(data.IdBaja || "", 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "IdBaja es requerido" }, { status: 400 });
    }

    await executeQuery(
      `UPDATE BajasBienes
       SET NumeroFichaBaja = @NumeroFichaBaja,
           UnidadOrganica = @UnidadOrganica,
           IdBien = @IdBien,
           Responsable = @Responsable,
           Dependencia = @Dependencia,
           Ambiente = @Ambiente,
           TipoBien = @TipoBien,
           IdCondicion = @IdCondicion,
           IdEstadoBien = @IdEstadoBien,
           Fundamentacion = @Fundamentacion,
           Recomendacion = @Recomendacion,
           CausalBaja = @CausalBaja,
           Observacion = @Observacion,
           IdUsuarioRegistro = @IdUsuarioRegistro
       WHERE IdBaja = @IdBaja`,
      {
        IdBaja: id,
        NumeroFichaBaja: data.NumeroFichaBaja || null,
        UnidadOrganica: data.UnidadOrganica || null,
        IdBien: data.IdBien ? parseInt(data.IdBien, 10) : null,
        Responsable: data.Responsable || null,
        Dependencia: data.Dependencia || null,
        Ambiente: data.Ambiente || null,
        TipoBien: data.TipoBien || null,
        IdCondicion: data.IdCondicion ? parseInt(data.IdCondicion, 10) : null,
        IdEstadoBien: data.IdEstadoBien ? parseInt(data.IdEstadoBien, 10) : null,
        Fundamentacion: data.Fundamentacion || null,
        Recomendacion: data.Recomendacion || null,
        CausalBaja: data.CausalBaja || null,
        Observacion: data.Observacion || null,
        IdUsuarioRegistro: data.IdUsuarioRegistro ? parseInt(data.IdUsuarioRegistro, 10) : null,
      }
    );

    return NextResponse.json({ success: true, message: "Ficha de baja actualizada" });
  } catch (error) {
    console.error("Error en PATCH /api/soporte/baja:", error);
    return NextResponse.json({ error: "Error al actualizar la ficha de baja" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "", 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "IdBaja es requerido" }, { status: 400 });
    }

    await executeQuery("DELETE FROM BajasBienes WHERE IdBaja = @IdBaja", { IdBaja: id });

    return NextResponse.json({ success: true, message: "Ficha de baja eliminada" });
  } catch (error) {
    console.error("Error en DELETE /api/soporte/baja:", error);
    return NextResponse.json({ error: "Error al eliminar la ficha de baja" }, { status: 500 });
  }
}

