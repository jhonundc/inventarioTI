import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

function parseNullableInt(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseNullableBoolean(value: any): boolean | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;
  const text = String(value).toLowerCase();
  if (text === "1" || text === "true" || text === "yes") return true;
  if (text === "0" || text === "false" || text === "no") return false;
  return null;
}

function formatSoftwareRow(row: any) {
  return {
    IdSoftware: row.IdSoftware,
    NombreSoftware: row.NombreSoftware,
    TipoSoftware: row.TipoSoftware,
    VersionSoftware: row.VersionSoftware,
    ProveedorEntidad: row.ProveedorEntidad,
    TipoLicencia: row.TipoLicencia,
    CantidadLicencias: row.CantidadLicencias,
    EstadoLicencia: row.EstadoLicencia,
    FechaCaducidad: row.FechaCaducidad,
    EquiposUsuariosAsignados: row.EquiposUsuariosAsignados,
    UsoFinalidad: row.UsoFinalidad,
    FechaRegistro: row.FechaRegistro,
    Activo: row.Activo,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const idSoftware = parseNullableInt(url.searchParams.get("id"));
    const activo = parseNullableBoolean(url.searchParams.get("activo"));

    if (idSoftware) {
      const result = await executeQuery(
        `EXEC pro_ObtenerBienSoftwarePorId @IdSoftware = @IdSoftware`,
        { IdSoftware: idSoftware }
      );
      const record = result.recordset?.[0] ?? null;
      return NextResponse.json(record ? formatSoftwareRow(record) : null);
    }

    const result = await executeQuery(
      `EXEC pro_ObtenerBienesSoftware @Activo = @Activo`,
      { Activo: activo }
    );

    const softs = (result.recordset || []).map(formatSoftwareRow);
    return NextResponse.json(softs);
  } catch (error) {
    console.error("Error en GET /api/software:", error);
    return NextResponse.json(
      { error: "Error al obtener los software" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const requiredFields = [
      "NombreSoftware",
      "TipoSoftware",
      "VersionSoftware",
      "ProveedorEntidad",
      "TipoLicencia",
      "CantidadLicencias",
      "EstadoLicencia",
    ];

    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0) {
        return NextResponse.json(
          { error: `El campo ${field} es obligatorio.` },
          { status: 400 }
        );
      }
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

    const result = await executeQuery(
      `EXEC pro_InsertarBienSoftware
        @NombreSoftware = @NombreSoftware,
        @TipoSoftware = @TipoSoftware,
        @VersionSoftware = @VersionSoftware,
        @ProveedorEntidad = @ProveedorEntidad,
        @TipoLicencia = @TipoLicencia,
        @CantidadLicencias = @CantidadLicencias,
        @EstadoLicencia = @EstadoLicencia,
        @FechaCaducidad = @FechaCaducidad,
        @EquiposUsuariosAsignados = @EquiposUsuariosAsignados,
        @UsoFinalidad = @UsoFinalidad`,
      {
        NombreSoftware: String(data.NombreSoftware),
        TipoSoftware: String(data.TipoSoftware),
        VersionSoftware: String(data.VersionSoftware),
        ProveedorEntidad: String(data.ProveedorEntidad),
        TipoLicencia: String(data.TipoLicencia),
        CantidadLicencias: parseNullableInt(data.CantidadLicencias),
        EstadoLicencia: String(data.EstadoLicencia),
        FechaCaducidad: data.FechaCaducidad || null,
        EquiposUsuariosAsignados: data.EquiposUsuariosAsignados ? String(data.EquiposUsuariosAsignados) : null,
        UsoFinalidad: data.UsoFinalidad ? String(data.UsoFinalidad) : null,
      }
    );

    const created = result.recordset?.[0] ?? null;
    return NextResponse.json(created ?? { success: true }, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/software:", error);
    const message = (error as any)?.message || "Error al crear el software";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const idSoftware = parseNullableInt(data.IdSoftware);
    if (!idSoftware) {
      return NextResponse.json({ error: "IdSoftware es requerido." }, { status: 400 });
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

    if (Object.keys(data).length === 2 && typeof data.Activo !== "undefined") {
      const procedure = data.Activo ? "pro_ActivarBienSoftware" : "pro_DesactivarBienSoftware";
      await executeQuery(
        `EXEC ${procedure} @IdSoftware = @IdSoftware`,
        { IdSoftware: idSoftware }
      );
      return NextResponse.json({ success: true });
    }

    const cantidadLicencias = parseNullableInt(data.CantidadLicencias);
    if (cantidadLicencias !== null && cantidadLicencias < 0) {
      return NextResponse.json(
        { error: "La cantidad de licencias no puede ser negativa." },
        { status: 400 }
      );
    }

    await executeQuery(
      `EXEC pro_ActualizarBienSoftware
        @IdSoftware = @IdSoftware,
        @NombreSoftware = @NombreSoftware,
        @TipoSoftware = @TipoSoftware,
        @VersionSoftware = @VersionSoftware,
        @ProveedorEntidad = @ProveedorEntidad,
        @TipoLicencia = @TipoLicencia,
        @CantidadLicencias = @CantidadLicencias,
        @EstadoLicencia = @EstadoLicencia,
        @FechaCaducidad = @FechaCaducidad,
        @EquiposUsuariosAsignados = @EquiposUsuariosAsignados,
        @UsoFinalidad = @UsoFinalidad`,
      {
        IdSoftware: idSoftware,
        NombreSoftware: String(data.NombreSoftware),
        TipoSoftware: String(data.TipoSoftware),
        VersionSoftware: String(data.VersionSoftware),
        ProveedorEntidad: String(data.ProveedorEntidad),
        TipoLicencia: String(data.TipoLicencia),
        CantidadLicencias: cantidadLicencias,
        EstadoLicencia: String(data.EstadoLicencia),
        FechaCaducidad: data.FechaCaducidad || null,
        EquiposUsuariosAsignados: data.EquiposUsuariosAsignados ? String(data.EquiposUsuariosAsignados) : null,
        UsoFinalidad: data.UsoFinalidad ? String(data.UsoFinalidad) : null,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PATCH /api/software:", error);
    const message = (error as any)?.message || "Error al actualizar el software";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const idSoftware = parseNullableInt(url.searchParams.get("id"));
    if (!idSoftware) {
      return NextResponse.json({ error: "IdSoftware es requerido." }, { status: 400 });
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

    await executeQuery(`EXEC pro_DesactivarBienSoftware @IdSoftware = @IdSoftware`, {
      IdSoftware: idSoftware,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/software:", error);
    const message = (error as any)?.message || "Error al desactivar el software";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
