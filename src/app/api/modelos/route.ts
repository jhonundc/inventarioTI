import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// Obtener todos los modelos
export async function GET() {
  try {
    const result = await executeQuery(
      `SELECT 
          m.*,
          ma.Marca AS Marca_Marca, ma.Activo AS Marca_Activo
       FROM Modelos m
       LEFT JOIN Marcas ma ON m.IdMarca = ma.IdMarca
       WHERE m.Activo = 1
       ORDER BY m.Modelo ASC`
    );
    
    const modelos = result.recordset.map((row: any) => ({
      IdModelo: row.IdModelo,
      IdMarca: row.IdMarca,
      IdCategoria: row.IdCategoria,
      Modelo: row.Modelo,
      Activo: row.Activo,
      Marca: row.IdMarca 
        ? { IdMarca: row.IdMarca, Marca: row.Marca_Marca, Activo: row.Marca_Activo }
        : null
    }));

    return NextResponse.json(modelos);
  } catch (error) {
    console.error("Error en GET /api/modelos:", error);
    return NextResponse.json(
      { error: "Error al obtener los modelos" },
      { status: 500 }
    );
  }
}

// Crear un nuevo modelo
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.Modelo || !data.IdMarca) {
      return NextResponse.json(
        { error: "El nombre del modelo y la marca son requeridos" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO Modelos (Modelo, IdMarca, IdCategoria, Activo) 
       OUTPUT INSERTED.* 
       VALUES (@Modelo, @IdMarca, @IdCategoria, 1)`,
      {
        Modelo: data.Modelo,
        IdMarca: parseInt(data.IdMarca),
        IdCategoria: data.IdCategoria ? parseInt(data.IdCategoria) : null,
      }
    );
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/modelos:", error);
    return NextResponse.json(
      { error: "Error al crear el modelo" },
      { status: 500 }
    );
  }
}

// Actualizar un modelo
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.IdModelo || !data.Modelo) {
      return NextResponse.json(
        { error: "El ID y el nombre del modelo son requeridos" },
        { status: 400 }
      );
    }

    const updates: string[] = ["Modelo = @Modelo"];
    const params: Record<string, any> = {
      IdModelo: parseInt(data.IdModelo),
      Modelo: data.Modelo,
    };

    if (data.IdMarca !== undefined) {
      updates.push("IdMarca = @IdMarca");
      params.IdMarca = parseInt(data.IdMarca);
    }

    if (data.IdCategoria !== undefined) {
      updates.push("IdCategoria = @IdCategoria");
      params.IdCategoria = data.IdCategoria ? parseInt(data.IdCategoria) : null;
    }

    const result = await executeQuery(
      `UPDATE Modelos 
       SET ${updates.join(", ")} 
       OUTPUT INSERTED.* 
       WHERE IdModelo = @IdModelo`,
      params
    );
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Modelo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en PATCH /api/modelos:", error);
    return NextResponse.json(
      { error: "Error al actualizar el modelo" },
      { status: 500 }
    );
  }
}

// Desactivar un modelo (Soft Delete)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "El ID es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `UPDATE Modelos 
       SET Activo = 0 
       OUTPUT INSERTED.* 
       WHERE IdModelo = @IdModelo`,
      {
        IdModelo: parseInt(id),
      }
    );
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Modelo no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en DELETE /api/modelos:", error);
    return NextResponse.json(
      { error: "Error al desactivar el modelo" },
      { status: 500 }
    );
  }
}

