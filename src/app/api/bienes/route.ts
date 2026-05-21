import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// Obtener todos los bienes
export async function GET() {
  try {
    const queryText = `
      SELECT 
          b.*,
          m.Marca AS Marca_Marca, m.Activo AS Marca_Activo,
          mo.Modelo AS Modelo_Modelo, mo.Activo AS Modelo_Activo, mo.IdMarca AS Modelo_IdMarca, mo.IdCategoria AS Modelo_IdCategoria,
          a.NombreArea AS Area_NombreArea, a.Piso AS Area_Piso, a.Referencia AS Area_Referencia, a.Activo AS Area_Activo,
          c.Condicion AS Condicion_Condicion, c.Activo AS Condicion_Activo,
          e.EstadoBien AS Estado_EstadoBien, e.Activo AS Estado_Activo,
          ca.CategoriaBien AS Categoria_CategoriaBien, ca.Activo AS Categoria_Activo
      FROM Bienes b
      LEFT JOIN Marcas m ON b.IdMarca = m.IdMarca
      LEFT JOIN Modelos mo ON b.IdModelo = mo.IdModelo
      LEFT JOIN Areas a ON b.IdArea = a.IdArea
      LEFT JOIN CondicionesBien c ON b.IdCondicion = c.IdCondicion
      LEFT JOIN EstadosDelBien e ON b.IdEstadoBien = e.IdEstadoBien
      LEFT JOIN CategoriasBienes ca ON b.IdCategoria = ca.IdCategoria
      WHERE b.Activo = 1
      ORDER BY b.FechaRegistro DESC
    `;
    const result = await executeQuery(queryText);
    
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
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validaciones básicas
    if (!data.CodigoInventario && !data.CodigoPatrimonial) {
      return NextResponse.json(
        { error: "Debe proporcionar al menos un código (Inventario o Patrimonial)" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO Bienes (
        CodigoInventario, CodigoPatrimonial, IdCategoria, IdMarca, IdModelo,
        IdArea, NumeroSerie, Descripcion, IdCondicion, IdEstadoBien,
        FechaCompra, Activo, FechaRegistro
       ) 
       OUTPUT INSERTED.* 
       VALUES (
         @CodigoInventario, @CodigoPatrimonial, @IdCategoria, @IdMarca, @IdModelo,
         @IdArea, @NumeroSerie, @Descripcion, @IdCondicion, @IdEstadoBien,
         @FechaCompra, 1, GETDATE()
       )`,
      {
        CodigoInventario: data.CodigoInventario || null,
        CodigoPatrimonial: data.CodigoPatrimonial || null,
        IdCategoria: data.IdCategoria ? parseInt(data.IdCategoria) : null,
        IdMarca: data.IdMarca ? parseInt(data.IdMarca) : null,
        IdModelo: data.IdModelo ? parseInt(data.IdModelo) : null,
        IdArea: data.IdArea ? parseInt(data.IdArea) : null,
        NumeroSerie: data.NumeroSerie || null,
        Descripcion: data.Descripcion || null,
        IdCondicion: data.IdCondicion ? parseInt(data.IdCondicion) : null,
        IdEstadoBien: data.IdEstadoBien ? parseInt(data.IdEstadoBien) : null,
        FechaCompra: data.FechaCompra ? new Date(data.FechaCompra) : null,
      }
    );
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/bienes:", error);
    return NextResponse.json(
      { error: "Error al crear el bien" },
      { status: 500 }
    );
  }
}

// Actualizar un bien (Editar / Desactivar)
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
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
        "UPDATE Bienes SET Activo = @Activo, FechaModificacion = GETDATE() WHERE IdBien = @IdBien",
        {
          IdBien: parseInt(IdBien),
          Activo: fields.Activo ? 1 : 0
        }
      );
      return NextResponse.json({ success: true });
    }

    // Actualización completa/parcial de campos
    const updateFields: string[] = [];
    const params: Record<string, any> = { IdBien: parseInt(IdBien) };

    if (fields.CodigoInventario !== undefined) {
      updateFields.push("CodigoInventario = @CodigoInventario");
      params.CodigoInventario = fields.CodigoInventario || null;
    }
    if (fields.CodigoPatrimonial !== undefined) {
      updateFields.push("CodigoPatrimonial = @CodigoPatrimonial");
      params.CodigoPatrimonial = fields.CodigoPatrimonial || null;
    }
    if (fields.IdCategoria !== undefined) {
      updateFields.push("IdCategoria = @IdCategoria");
      params.IdCategoria = fields.IdCategoria ? parseInt(fields.IdCategoria) : null;
    }
    if (fields.IdMarca !== undefined) {
      updateFields.push("IdMarca = @IdMarca");
      params.IdMarca = fields.IdMarca ? parseInt(fields.IdMarca) : null;
    }
    if (fields.IdModelo !== undefined) {
      updateFields.push("IdModelo = @IdModelo");
      params.IdModelo = fields.IdModelo ? parseInt(fields.IdModelo) : null;
    }
    if (fields.IdArea !== undefined) {
      updateFields.push("IdArea = @IdArea");
      params.IdArea = fields.IdArea ? parseInt(fields.IdArea) : null;
    }
    if (fields.NumeroSerie !== undefined) {
      updateFields.push("NumeroSerie = @NumeroSerie");
      params.NumeroSerie = fields.NumeroSerie || null;
    }
    if (fields.Descripcion !== undefined) {
      updateFields.push("Descripcion = @Descripcion");
      params.Descripcion = fields.Descripcion || null;
    }
    if (fields.IdCondicion !== undefined) {
      updateFields.push("IdCondicion = @IdCondicion");
      params.IdCondicion = fields.IdCondicion ? parseInt(fields.IdCondicion) : null;
    }
    if (fields.IdEstadoBien !== undefined) {
      updateFields.push("IdEstadoBien = @IdEstadoBien");
      params.IdEstadoBien = fields.IdEstadoBien ? parseInt(fields.IdEstadoBien) : null;
    }
    if (fields.FechaCompra !== undefined) {
      updateFields.push("FechaCompra = @FechaCompra");
      params.FechaCompra = fields.FechaCompra ? new Date(fields.FechaCompra) : null;
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const queryText = `
      UPDATE Bienes 
      SET ${updateFields.join(", ")}, FechaModificacion = GETDATE()
      WHERE IdBien = @IdBien
    `;

    await executeQuery(queryText, params);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PATCH /api/bienes:", error);
    return NextResponse.json(
      { error: "Error al actualizar el bien" },
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
      "SELECT COUNT(*) AS count FROM SoporteTecnico WHERE IdBien = @IdBien",
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
      "SELECT COUNT(*) AS count FROM Componentes WHERE IdBien = @IdBien",
      { IdBien: parseInt(id) }
    );

    if (checkComponentes.recordset[0].count > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar el bien porque tiene componentes asociados" },
        { status: 400 }
      );
    }

    await executeQuery("DELETE FROM Bienes WHERE IdBien = @IdBien", {
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

