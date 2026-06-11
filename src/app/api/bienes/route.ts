import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

// Obtener todos los bienes
export async function GET() {
  try {
    const result = await executeQuery(
      "EXEC pro_ObtenerBienesCatalogo"
    );

    const bienes = result.recordset.map((row: any) => ({
      IdBien: row.IdBien,
      CodigoInventario: row.CodigoInventario,
      CodigoPatrimonial: row.CodigoPatrimonial,
      IdCategoria: row.IdCategoria,
      IdMarca: row.IdMarca,
      IdModelo: row.IdModelo,
      IdArea: row.IdArea,
      NumeroSerie: row.NumeroSerie,
      Descripcion: row.Descripcion,
      IdCondicion: row.IdCondicion,
      IdEstadoBien: row.IdEstadoBien,
      FechaCompra: row.FechaCompra,
      FechaRegistro: row.FechaRegistro,
      FechaModificacion: row.FechaModificacion,
      IdUsuarioRegistro: row.IdUsuarioRegistro,
      IdUsuarioModificacion: row.IdUsuarioModificacion,
      Activo: row.Activo,
      Marca: row.IdMarca
        ? { IdMarca: row.IdMarca, Marca: row.Marca_Marca, Activo: row.Marca_Activo }
        : null,
      Modelo: row.IdModelo
        ? {
            IdModelo: row.IdModelo,
            Modelo: row.Modelo_Modelo,
            IdMarca: row.Modelo_IdMarca,
            IdCategoria: row.Modelo_IdCategoria,
            Activo: row.Modelo_Activo,
          }
        : null,
      Area: row.IdArea
        ? {
            IdArea: row.IdArea,
            NombreArea: row.Area_NombreArea,
            Piso: row.Area_Piso,
            Referencia: row.Area_Referencia,
            Activo: row.Area_Activo,
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
      Categoria: row.IdCategoria
        ? {
            IdCategoria: row.IdCategoria,
            CategoriaBien: row.Categoria_CategoriaBien,
            Activo: row.Categoria_Activo,
          }
        : null,
    }));

    return NextResponse.json(bienes);
  } catch (error) {
    console.error("Error en GET /api/bienes:", error);
    return NextResponse.json(
      { error: "Error al obtener los bienes" },
      { status: 500 }
    );
  }
}

// Crear un nuevo bien
function parseNullableInt(value: any): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

async function resolveModeloId(data: any) {
  const modeloNombre = data.Modelo ? String(data.Modelo).trim() : "";
  if (!modeloNombre) {
    return parseNullableInt(data.IdModelo);
  }

  const idMarca = parseNullableInt(data.IdMarca);
  const idCategoria = parseNullableInt(data.IdCategoria);
  const query = idMarca
    ? "SELECT IdModelo FROM Modelos WHERE Modelo = @Modelo AND IdMarca = @IdMarca"
    : "SELECT IdModelo FROM Modelos WHERE Modelo = @Modelo";

  console.log('[resolveModeloId] searching modelo with types:', { Modelo: typeof modeloNombre, IdMarca: typeof idMarca });
  const result = await executeQuery(query, {
    Modelo: modeloNombre,
    IdMarca: idMarca,
  });

  if (result.recordset.length > 0) {
    return result.recordset[0].IdModelo;
  }

  console.log('[resolveModeloId] inserting modelo with types:', { Modelo: typeof modeloNombre, IdMarca: typeof idMarca, IdCategoria: typeof idCategoria });
  const insertResult = await executeQuery(
    `INSERT INTO Modelos (Modelo, IdMarca, IdCategoria, Activo) OUTPUT INSERTED.IdModelo VALUES (@Modelo, @IdMarca, @IdCategoria, 1)`,
    {
      Modelo: modeloNombre,
      IdMarca: idMarca,
      IdCategoria: idCategoria,
    }
  );

  return insertResult.recordset[0].IdModelo;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("[API] POST /api/bienes payload:", JSON.stringify(data));
    
    // Validaciones básicas
    if (!data.CodigoInventario && !data.CodigoPatrimonial) {
      return NextResponse.json(
        { error: "Debe proporcionar al menos un código (Inventario o Patrimonial)" },
        { status: 400 }
      );
    }

    const fechaCompra = data.FechaCompra ? new Date(data.FechaCompra) : null;
    if (fechaCompra && isNaN(fechaCompra.getTime())) {
      return NextResponse.json(
        { error: "Fecha de compra inválida" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const idModelo = await resolveModeloId(data);
    const paramsForCreate = {
      CodigoInventario: data.CodigoInventario || null,
      CodigoPatrimonial: data.CodigoPatrimonial || null,
      IdCategoria: parseNullableInt(data.IdCategoria),
      IdMarca: parseNullableInt(data.IdMarca),
      IdModelo: idModelo,
      IdArea: parseNullableInt(data.IdArea),
      NumeroSerie: data.NumeroSerie || null,
      Descripcion: data.Descripcion || null,
      IdCondicion: parseNullableInt(data.IdCondicion),
      IdEstadoBien: parseNullableInt(data.IdEstadoBien),
      FechaCompra: fechaCompra,
      IdUsuarioRegistro: payload.id,
    };
    console.log('[API] POST /api/bienes params:', Object.keys(paramsForCreate).reduce((acc:any,k)=>{acc[k]=typeof (paramsForCreate as any)[k]; return acc},{}));
    const result = await executeQuery(
      `EXEC pro_CrearBien 
        @CodigoInventario = @CodigoInventario, 
        @CodigoPatrimonial = @CodigoPatrimonial, 
        @IdCategoria = @IdCategoria, 
        @IdMarca = @IdMarca, 
        @IdModelo = @IdModelo, 
        @IdArea = @IdArea, 
        @NumeroSerie = @NumeroSerie, 
        @Descripcion = @Descripcion, 
        @IdCondicion = @IdCondicion, 
        @IdEstadoBien = @IdEstadoBien, 
        @FechaCompra = @FechaCompra, 
        @IdUsuarioRegistro = @IdUsuarioRegistro`,
      paramsForCreate
    );

    const createdBien = result.recordset?.[0] ?? null;
    if (createdBien) {
      return NextResponse.json(createdBien, { status: 201 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/bienes:", error);
    const msg = (error as any)?.message || String(error);
    return NextResponse.json(
      { error: `Error al crear el bien: ${msg}` },
      { status: 500 }
    );
  }
}

// Actualizar un bien (Editar / Desactivar)
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    console.log("[API] PATCH /api/bienes payload:", JSON.stringify(data));
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { IdBien, ...fields } = data;
    
    if (!IdBien) {
      return NextResponse.json(
        { error: "Debe proporcionar el IdBien" },
        { status: 400 }
      );
    }

    // Si solo viene Activo, es una actualización de estado (Activar/Desactivar)
    if (Object.keys(fields).length === 1 && "Activo" in fields) {
      await executeQuery(
        `EXEC pro_DesactivarBien @IdBien = @IdBien`,
        {
          IdBien: parseInt(IdBien),
        }
      );
      return NextResponse.json({ success: true });
    }

    const idModelo = await resolveModeloId(fields);
    const params: Record<string, any> = { 
      IdBien: parseNullableInt(IdBien),
      CodigoInventario: fields.CodigoInventario || null,
      CodigoPatrimonial: fields.CodigoPatrimonial || null,
      IdCategoria: parseNullableInt(fields.IdCategoria),
      IdMarca: parseNullableInt(fields.IdMarca),
      IdModelo: idModelo,
      IdArea: parseNullableInt(fields.IdArea),
      NumeroSerie: fields.NumeroSerie || null,
      Descripcion: fields.Descripcion || null,
      IdCondicion: parseNullableInt(fields.IdCondicion),
      IdEstadoBien: parseNullableInt(fields.IdEstadoBien),
      FechaCompra: fields.FechaCompra ? new Date(fields.FechaCompra) : null,
      IdUsuarioModificacion: payload.id,
    };
    console.log('[API] PATCH /api/bienes params types:', Object.keys(params).reduce((acc:any,k)=>{acc[k]=typeof (params as any)[k]; return acc},{}));

    const hasUpdateFields = [
      "CodigoInventario",
      "CodigoPatrimonial",
      "IdCategoria",
      "IdMarca",
      "IdModelo",
      "IdArea",
      "NumeroSerie",
      "Descripcion",
      "IdCondicion",
      "IdEstadoBien",
      "FechaCompra",
    ].some((key) => fields[key] !== undefined);

    if (!hasUpdateFields) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    await executeQuery(
      `EXEC pro_ActualizarBien 
        @IdBien = @IdBien, 
        @CodigoInventario = @CodigoInventario, 
        @CodigoPatrimonial = @CodigoPatrimonial, 
        @IdCategoria = @IdCategoria, 
        @IdMarca = @IdMarca, 
        @IdModelo = @IdModelo, 
        @IdArea = @IdArea, 
        @NumeroSerie = @NumeroSerie, 
        @Descripcion = @Descripcion, 
        @IdCondicion = @IdCondicion, 
        @IdEstadoBien = @IdEstadoBien, 
        @FechaCompra = @FechaCompra, 
        @IdUsuarioModificacion = @IdUsuarioModificacion`,
      params
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PATCH /api/bienes:", error);
    const msg = (error as any)?.message || String(error);
    return NextResponse.json(
      { error: `Error al actualizar el bien: ${msg}` },
      { status: 500 }
    );
  }
}

// Eliminar un bien
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Debe proporcionar el ID del bien" },
        { status: 400 }
      );
    }

    // Verificar si está asociado a alguna ficha de soporte
    const checkFichas = await executeQuery(
      `EXEC pro_VerificarBienEnSoporte @IdBien = @IdBien`,
      { IdBien: parseInt(id) }
    );

    if (checkFichas.recordset[0].count > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar el bien porque tiene fichas de soporte técnico asociadas" },
        { status: 400 }
      );
    }

    // Verificar si está asociado a componentes
    const checkComponentes = await executeQuery(
      `EXEC pro_VerificarComponentesDeBien @IdBien = @IdBien`,
      { IdBien: parseInt(id) }
    );

    if (checkComponentes.recordset[0].count > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar el bien porque tiene componentes asociados" },
        { status: 400 }
      );
    }

    await executeQuery(`EXEC pro_DesactivarBien @IdBien = @IdBien`, {
      IdBien: parseInt(id),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/bienes:", error);
    return NextResponse.json(
      { error: "Error al eliminar el bien" },
      { status: 500 }
    );
  }
}

