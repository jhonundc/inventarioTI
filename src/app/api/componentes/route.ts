import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET() {
  try {
    const result = await executeQuery(
      `SELECT c.*, m.Marca 
       FROM Componentes c
       LEFT JOIN Marcas m ON c.IdMarca = m.IdMarca
       ORDER BY c.NombreComponente ASC`
    );
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error en GET /api/componentes:", error);
    return NextResponse.json(
      { error: "Error al obtener los componentes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.NombreComponente) {
      return NextResponse.json(
        { error: "El nombre del componente es requerido" },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `INSERT INTO Componentes (
        NombreComponente, IdMarca, Modelo, NumeroSerie, Capacidad,
        Observacion, Cantidad, Activo
       )
       OUTPUT INSERTED.*
       VALUES (
        @NombreComponente, @IdMarca, @Modelo, @NumeroSerie, @Capacidad,
        @Observacion, @Cantidad, 1
       )`,
      {
        NombreComponente: data.NombreComponente,
        IdMarca: data.IdMarca ? parseInt(data.IdMarca) : null,
        Modelo: data.Modelo || null,
        NumeroSerie: data.NumeroSerie || null,
        Capacidad: data.Capacidad || null,
        Observacion: data.Observacion || null,
        Cantidad: data.Cantidad ? parseInt(data.Cantidad) : 0,
      }
    );

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en POST /api/componentes:", error);
    return NextResponse.json(
      { error: "Error al crear el componente" },
      { status: 500 }
    );
  }
}

// Actualizar un componente (Editar / Desactivar)
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const { IdComponente, ...fields } = data;
    
    if (!IdComponente) {
      return NextResponse.json(
        { error: "Debe proporcionar el IdComponente" },
        { status: 400 }
      );
    }

    // Si solo viene Activo, es una actualización de estado (Activar/Desactivar)
    if (Object.keys(fields).length === 1 && "Activo" in fields) {
      await executeQuery(
        "UPDATE Componentes SET Activo = @Activo WHERE IdComponente = @IdComponente",
        {
          IdComponente: parseInt(IdComponente),
          Activo: fields.Activo ? 1 : 0
        }
      );
      return NextResponse.json({ success: true });
    }

    // Actualización completa/parcial de campos
    const updateFields: string[] = [];
    const params: Record<string, any> = { IdComponente: parseInt(IdComponente) };

    if (fields.NombreComponente !== undefined) {
      updateFields.push("NombreComponente = @NombreComponente");
      params.NombreComponente = fields.NombreComponente || null;
    }
    if (fields.IdMarca !== undefined) {
      updateFields.push("IdMarca = @IdMarca");
      params.IdMarca = fields.IdMarca ? parseInt(fields.IdMarca) : null;
    }
    if (fields.Modelo !== undefined) {
      updateFields.push("Modelo = @Modelo");
      params.Modelo = fields.Modelo || null;
    }
    if (fields.NumeroSerie !== undefined) {
      updateFields.push("NumeroSerie = @NumeroSerie");
      params.NumeroSerie = fields.NumeroSerie || null;
    }
    if (fields.Capacidad !== undefined) {
      updateFields.push("Capacidad = @Capacidad");
      params.Capacidad = fields.Capacidad || null;
    }
    if (fields.Observacion !== undefined) {
      updateFields.push("Observacion = @Observacion");
      params.Observacion = fields.Observacion || null;
    }
    if (fields.Cantidad !== undefined) {
      updateFields.push("Cantidad = @Cantidad");
      params.Cantidad = fields.Cantidad ? parseInt(fields.Cantidad) : 0;
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const queryText = `
      UPDATE Componentes 
      SET ${updateFields.join(", ")}
      WHERE IdComponente = @IdComponente
    `;

    await executeQuery(queryText, params);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PATCH /api/componentes:", error);
    return NextResponse.json(
      { error: "Error al actualizar el componente" },
      { status: 500 }
    );
  }
}

// Eliminar un componente
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Debe proporcionar el ID del componente" },
        { status: 400 }
      );
    }

    await executeQuery("DELETE FROM Componentes WHERE IdComponente = @IdComponente", {
      IdComponente: parseInt(id),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/componentes:", error);
    return NextResponse.json(
      { error: "Error al eliminar el componente" },
      { status: 500 }
    );
  }
}
