import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

// Obtener todos los bienes
export async function GET() {
  try {
    const result = await executeQuery(
      `EXEC sp_ConsultaBien @Accion = @Accion`,
      { Accion: "L" }
    );

    const bienes = result.recordset.map((row: any) => ({
      IdBien: row.IdBien,
      CodigoInventario: row.CodigoInventario,
      CodigoPatrimonial: row.CodigoPatrimonial,
      IdCategoria: row.IdCategoria,
      IdMarca: row.IdMarca,
      IdArea: row.IdArea,
      Modelo: row.Modelo,
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

    const paramsForCreate = {
      CodigoInventario: data.CodigoInventario || null,
      CodigoPatrimonial: data.CodigoPatrimonial || null,
      IdCategoria: parseNullableInt(data.IdCategoria),
      IdMarca: parseNullableInt(data.IdMarca),
      IdArea: parseNullableInt(data.IdArea),
      Modelo: data.Modelo ? String(data.Modelo).trim() : null,
      NumeroSerie: data.NumeroSerie || null,
      Descripcion: data.Descripcion || null,
      IdCondicion: parseNullableInt(data.IdCondicion),
      IdEstadoBien: parseNullableInt(data.IdEstadoBien),
      FechaCompra: fechaCompra,
      IdUsuario: payload.id,
    };
    console.log('[API] POST /api/bienes params:', Object.keys(paramsForCreate).reduce((acc:any,k)=>{acc[k]=typeof (paramsForCreate as any)[k]; return acc},{}));
    const result = await executeQuery(
      `EXEC sp_MantenimientoBien 
        @Accion = @Accion,
        @CodigoInventario = @CodigoInventario, 
        @CodigoPatrimonial = @CodigoPatrimonial, 
        @IdCategoria = @IdCategoria, 
        @IdMarca = @IdMarca, 
        @IdArea = @IdArea, 
        @Modelo = @Modelo,
        @NumeroSerie = @NumeroSerie, 
        @Descripcion = @Descripcion, 
        @IdCondicion = @IdCondicion, 
        @IdEstadoBien = @IdEstadoBien, 
        @FechaCompra = @FechaCompra, 
        @IdUsuario = @IdUsuario`,
      { ...paramsForCreate, Accion: "R" }
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
        `EXEC sp_MantenimientoBien 
          @Accion = @Accion,
          @IdBien = @IdBien,
          @IdUsuario = @IdUsuario`,
        {
          IdBien: parseInt(IdBien),
          IdUsuario: payload.id,
          Accion: fields.Activo ? "T" : "E",
        }
      );
      return NextResponse.json({ success: true });
    }

    const params: Record<string, any> = { 
      IdBien: parseNullableInt(IdBien),
      CodigoInventario: fields.CodigoInventario || null,
      CodigoPatrimonial: fields.CodigoPatrimonial || null,
      IdCategoria: parseNullableInt(fields.IdCategoria),
      IdMarca: parseNullableInt(fields.IdMarca),
      IdArea: parseNullableInt(fields.IdArea),
      Modelo: fields.Modelo ? String(fields.Modelo).trim() : null,
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
      "IdArea",
      "Modelo",
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
      `EXEC sp_MantenimientoBien 
        @Accion = @Accion,
        @IdBien = @IdBien, 
        @CodigoInventario = @CodigoInventario, 
        @CodigoPatrimonial = @CodigoPatrimonial, 
        @IdCategoria = @IdCategoria, 
        @IdMarca = @IdMarca, 
        @IdArea = @IdArea, 
        @Modelo = @Modelo,
        @NumeroSerie = @NumeroSerie, 
        @Descripcion = @Descripcion, 
        @IdCondicion = @IdCondicion, 
        @IdEstadoBien = @IdEstadoBien, 
        @FechaCompra = @FechaCompra, 
        @IdUsuario = @IdUsuarioModificacion`,
      { ...params, Accion: "A" }
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

// Dar de baja un bien (eliminación lógica)
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Debe proporcionar el ID del bien" },
        { status: 400 }
      );
    }

    await executeQuery(`EXEC sp_MantenimientoBien 
        @Accion = @Accion,
        @IdBien = @IdBien,
        @IdUsuario = @IdUsuario`, {
      IdBien: parseInt(id),
      IdUsuario: payload.id,
      Accion: "E",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/bienes:", error);
    const msg = (error as any)?.message || String(error);
    return NextResponse.json(
      { error: `Error al dar de baja el bien: ${msg}` },
      { status: 500 }
    );
  }
}

