import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { executeQuery } from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

function parseNullableInt(value: any) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeComponentesRecord(record: any) {
  if (!record || typeof record !== "object") return record;
  const normalized = { ...record };
  if (normalized.Marca && typeof normalized.Marca === "object") {
    normalized.Marca = normalized.Marca.Marca ?? "";
  }
  if (normalized.EstadoEquipo && typeof normalized.EstadoEquipo === "object") {
    normalized.EstadoEquipo = normalized.EstadoEquipo.EstadoEquipo ?? "";
  }
  return normalized;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const catalog = url.searchParams.get("catalog") === "true";
    const codigoParam = url.searchParams.get("codigoPatrimonial");
    const serieParam = url.searchParams.get("serie");
    const idBienComponenteParam = parseNullableInt(url.searchParams.get("idBienComponente"));

    if (catalog) {
      const result = await executeQuery(
        `SELECT IdComponente, NombreComponente, IdMarca, Modelo, NumeroSerie, Capacidad, Observacion, Cantidad, Activo
         FROM Componentes
         ORDER BY NombreComponente ASC`
      );
      return NextResponse.json(result.recordset);
    }

    // Si piden un registro específico por IdBienComponente
    if (idBienComponenteParam) {
      const single = await executeQuery(
        `EXEC pro_ObtenerBienComponentePorId @IdBienComponente = @IdBienComponente`,
        { IdBienComponente: idBienComponenteParam }
      );
      const records = single.recordset || [];
      if (records.length === 0) return NextResponse.json([]);

      // Enriquecer con nombres
      const rec = records[0];
      const [bRes, cRes] = await Promise.all([
        rec.IdBien ? executeQuery(`SELECT IdBien, CodigoInventario, Descripcion FROM Bienes WHERE IdBien = @IdBien`, { IdBien: rec.IdBien }) : Promise.resolve({ recordset: [] }),
        rec.IdComponente ? executeQuery(`SELECT IdComponente, NombreComponente, Modelo FROM Componentes WHERE IdComponente = @IdComponente`, { IdComponente: rec.IdComponente }) : Promise.resolve({ recordset: [] }),
      ]);

      const enriched = normalizeComponentesRecord({
        ...rec,
        BienDescripcion: (bRes.recordset[0] && bRes.recordset[0].Descripcion) || null,
        CodigoInventario: (bRes.recordset[0] && bRes.recordset[0].CodigoInventario) || null,
        NombreComponente: (cRes.recordset[0] && cRes.recordset[0].NombreComponente) || null,
        ComponenteModelo: (cRes.recordset[0] && cRes.recordset[0].Modelo) || null,
      });

      return NextResponse.json(enriched);
    }

    // Si se busca por código patrimonial
    if (codigoParam) {
      const result = await executeQuery(
        `EXEC pro_BuscarBienComponentePorCodigo @CodigoPatrimonial = @CodigoPatrimonial`,
        { CodigoPatrimonial: codigoParam }
      );
      const records = result.recordset || [];
      if (records.length === 0) return NextResponse.json(records);

      // continuar con enriquecimiento múltiple
      const bienIds = Array.from(new Set(records.map((r: any) => parseNullableInt(r.IdBien)).filter((id) => id !== null)));
      const componenteIds = Array.from(new Set(records.map((r: any) => parseNullableInt(r.IdComponente)).filter((id) => id !== null)));

      const [bienesResult, componentesResult] = await Promise.all([
        bienIds.length
          ? executeQuery(`SELECT IdBien, CodigoInventario, Descripcion FROM Bienes WHERE IdBien IN (${bienIds.join(",")})`)
          : Promise.resolve({ recordset: [] }),
        componenteIds.length
          ? executeQuery(`SELECT IdComponente, NombreComponente, Modelo FROM Componentes WHERE IdComponente IN (${componenteIds.join(",")})`)
          : Promise.resolve({ recordset: [] }),
      ]);

      const bienesMap = new Map((bienesResult.recordset || []).map((b: any) => [b.IdBien, b]));
      const componentesMap = new Map((componentesResult.recordset || []).map((c: any) => [c.IdComponente, c]));

      const enrichedRecords = records.map((record: any) => normalizeComponentesRecord({
        ...record,
        BienDescripcion: bienesMap.get(record.IdBien)?.Descripcion || null,
        CodigoInventario: bienesMap.get(record.IdBien)?.CodigoInventario || null,
        NombreComponente: componentesMap.get(record.IdComponente)?.NombreComponente || null,
        ComponenteModelo: componentesMap.get(record.IdComponente)?.Modelo || null,
      }));

      return NextResponse.json(enrichedRecords);
    }

    // Si se busca por serie
    if (serieParam) {
      const result = await executeQuery(
        `SELECT * FROM BienesComponentes WHERE Serie LIKE '%' + @Serie + '%' AND Activo = 1`,
        { Serie: serieParam }
      );
      const records = result.recordset || [];
      if (records.length === 0) return NextResponse.json(records);

      const bienIds = Array.from(new Set(records.map((r: any) => parseNullableInt(r.IdBien)).filter((id) => id !== null)));
      const componenteIds = Array.from(new Set(records.map((r: any) => parseNullableInt(r.IdComponente)).filter((id) => id !== null)));

      const [bienesResult, componentesResult] = await Promise.all([
        bienIds.length
          ? executeQuery(`SELECT IdBien, CodigoInventario, Descripcion FROM Bienes WHERE IdBien IN (${bienIds.join(",")})`)
          : Promise.resolve({ recordset: [] }),
        componenteIds.length
          ? executeQuery(`SELECT IdComponente, NombreComponente, Modelo FROM Componentes WHERE IdComponente IN (${componenteIds.join(",")})`)
          : Promise.resolve({ recordset: [] }),
      ]);

      const bienesMap = new Map((bienesResult.recordset || []).map((b: any) => [b.IdBien, b]));
      const componentesMap = new Map((componentesResult.recordset || []).map((c: any) => [c.IdComponente, c]));

      const enrichedRecords = records.map((record: any) => normalizeComponentesRecord({
        ...record,
        BienDescripcion: bienesMap.get(record.IdBien)?.Descripcion || null,
        CodigoInventario: bienesMap.get(record.IdBien)?.CodigoInventario || null,
        NombreComponente: componentesMap.get(record.IdComponente)?.NombreComponente || null,
        ComponenteModelo: componentesMap.get(record.IdComponente)?.Modelo || null,
      }));

      return NextResponse.json(enrichedRecords);
    }

    const result = await executeQuery(`EXEC pro_ObtenerBienesComponentes`);

    const records = result.recordset || [];
    if (records.length === 0) {
      return NextResponse.json(records);
    }

    const bienIds = Array.from(
      new Set(records.map((r: any) => parseNullableInt(r.IdBien)).filter((id) => id !== null))
    );
    const componenteIds = Array.from(
      new Set(records.map((r: any) => parseNullableInt(r.IdComponente)).filter((id) => id !== null))
    );

    const [bienesResult, componentesResult] = await Promise.all([
      bienIds.length
        ? executeQuery(
            `SELECT IdBien, CodigoInventario, Descripcion FROM Bienes WHERE IdBien IN (${bienIds.join(",")})`
          )
        : Promise.resolve({ recordset: [] }),
      componenteIds.length
        ? executeQuery(
            `SELECT IdComponente, NombreComponente, Modelo FROM Componentes WHERE IdComponente IN (${componenteIds.join(",")})`
          )
        : Promise.resolve({ recordset: [] }),
    ]);

    const bienesMap = new Map(
      (bienesResult.recordset || []).map((b: any) => [b.IdBien, b])
    );
    const componentesMap = new Map(
      (componentesResult.recordset || []).map((c: any) => [c.IdComponente, c])
    );

    const enrichedRecords = records.map((record: any) => normalizeComponentesRecord({
      ...record,
      BienDescripcion: bienesMap.get(record.IdBien)?.Descripcion || null,
      CodigoInventario: bienesMap.get(record.IdBien)?.CodigoInventario || null,
      NombreComponente: componentesMap.get(record.IdComponente)?.NombreComponente || null,
      ComponenteModelo: componentesMap.get(record.IdComponente)?.Modelo || null,
    }));

    return NextResponse.json(enrichedRecords);
  } catch (error) {
    console.error("Error en GET /api/componentes:", error);
    return NextResponse.json(
      { error: "Error al obtener los componentes de bienes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const data = await request.json();

    if (!data.IdBien || !data.IdComponente) {
      return NextResponse.json(
        { error: "IdBien e IdComponente son requeridos" },
        { status: 400 }
      );
    }

    await executeQuery(
      `EXEC pro_RegistrarBienComponente
        @IdBien = @IdBien,
        @IdComponente = @IdComponente,
        @Observacion = @Observacion,
        @IdUsuario = @IdUsuario,
        @Cantidad = @Cantidad,
        @TipoEquipo = @TipoEquipo,
        @DescripcionModelo = @DescripcionModelo,
        @Marca = @Marca,
        @Serie = @Serie,
        @CodigoPatrimonial = @CodigoPatrimonial,
        @ProcesadorEspecificaciones = @ProcesadorEspecificaciones,
        @RAM = @RAM,
        @Almacenamiento = @Almacenamiento,
        @SistemaOperativo = @SistemaOperativo,
        @UbicacionFisica = @UbicacionFisica,
        @UsuarioAsignado = @UsuarioAsignado,
        @EstadoEquipo = @EstadoEquipo`,
      {
        IdBien: parseNullableInt(data.IdBien),
        IdComponente: parseNullableInt(data.IdComponente),
        Observacion: data.Observacion || null,
        IdUsuario: payload.id,
        Cantidad: parseNullableInt(data.Cantidad),
        TipoEquipo: data.TipoEquipo || null,
        DescripcionModelo: data.DescripcionModelo || null,
        Marca: data.Marca || null,
        Serie: data.Serie || null,
        CodigoPatrimonial: data.CodigoPatrimonial || null,
        ProcesadorEspecificaciones: data.ProcesadorEspecificaciones || null,
        RAM: data.RAM || null,
        Almacenamiento: data.Almacenamiento || null,
        SistemaOperativo: data.SistemaOperativo || null,
        UbicacionFisica: data.UbicacionFisica || null,
        UsuarioAsignado: data.UsuarioAsignado || null,
        EstadoEquipo: data.EstadoEquipo || null,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en POST /api/componentes:", error);
    return NextResponse.json(
      { error: "Error al registrar el componente del bien" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();

    // Preferir el uso del IdBienComponente y del procedimiento almacenado
    const idBienComponente = parseNullableInt(data.IdBienComponente);

    if (idBienComponente) {
      const params: Record<string, any> = {
        IdBienComponente: idBienComponente,
        IdBien: parseNullableInt(data.IdBien) || null,
        IdComponente: parseNullableInt(data.IdComponente) || null,
        Observacion: data.Observacion || null,
        Cantidad: parseNullableInt(data.Cantidad) || null,
        TipoEquipo: data.TipoEquipo || null,
        DescripcionModelo: data.DescripcionModelo || null,
        Marca: data.Marca || null,
        Serie: data.Serie || null,
        CodigoPatrimonial: data.CodigoPatrimonial || null,
        ProcesadorEspecificaciones: data.ProcesadorEspecificaciones || null,
        RAM: data.RAM || null,
        Almacenamiento: data.Almacenamiento || null,
        SistemaOperativo: data.SistemaOperativo || null,
        UbicacionFisica: data.UbicacionFisica || null,
        UsuarioAsignado: data.UsuarioAsignado || null,
        EstadoEquipo: data.EstadoEquipo || null,
      };
      // Si se solicita desactivación explícita, usar el procedimiento
      if (data.Activo === false) {
        await executeQuery(`EXEC pro_DesactivarBienComponente @IdBienComponente = @IdBienComponente`, { IdBienComponente: idBienComponente });
        return NextResponse.json({ success: true });
      }

      // Reactivar (no hay proc explícito) -> simple UPDATE
      if (data.Activo === true) {
        await executeQuery(`UPDATE BienesComponentes SET Activo = 1 WHERE IdBienComponente = @IdBienComponente`, { IdBienComponente: idBienComponente });
        return NextResponse.json({ success: true });
      }

      // Edición normal: usar procedimiento de actualización existente
      await executeQuery(
        `EXEC pro_ActualizarBienComponente
          @IdBienComponente = @IdBienComponente,
          @IdBien = @IdBien,
          @IdComponente = @IdComponente,
          @Observacion = @Observacion,
          @Cantidad = @Cantidad,
          @TipoEquipo = @TipoEquipo,
          @DescripcionModelo = @DescripcionModelo,
          @Marca = @Marca,
          @Serie = @Serie,
          @CodigoPatrimonial = @CodigoPatrimonial,
          @ProcesadorEspecificaciones = @ProcesadorEspecificaciones,
          @RAM = @RAM,
          @Almacenamiento = @Almacenamiento,
          @SistemaOperativo = @SistemaOperativo,
          @UbicacionFisica = @UbicacionFisica,
          @UsuarioAsignado = @UsuarioAsignado,
          @EstadoEquipo = @EstadoEquipo`,
        params
      );

      return NextResponse.json({ success: true });
    }

    // Compatibilidad: si no se proporciona IdBienComponente, usar la lógica anterior
    if (!data.IdBien || !data.IdComponente) {
      return NextResponse.json(
        { error: "IdBien e IdComponente son requeridos para actualizar" },
        { status: 400 }
      );
    }

    const updateFields: string[] = [];
    const params: Record<string, any> = {
      IdBien: parseNullableInt(data.IdBien),
      IdComponente: parseNullableInt(data.IdComponente),
    };

    const maybeSet = (field: string, value: any, parser?: (value: any) => any) => {
      if (value !== undefined) {
        updateFields.push(`${field} = @${field}`);
        params[field] = parser ? parser(value) : value || null;
      }
    };

    maybeSet("Observacion", data.Observacion);
    maybeSet("Cantidad", data.Cantidad, parseNullableInt);
    maybeSet("TipoEquipo", data.TipoEquipo);
    maybeSet("DescripcionModelo", data.DescripcionModelo);
    maybeSet("Marca", data.Marca);
    maybeSet("Serie", data.Serie);
    maybeSet("CodigoPatrimonial", data.CodigoPatrimonial);
    maybeSet("ProcesadorEspecificaciones", data.ProcesadorEspecificaciones);
    maybeSet("RAM", data.RAM);
    maybeSet("Almacenamiento", data.Almacenamiento);
    maybeSet("SistemaOperativo", data.SistemaOperativo);
    maybeSet("UbicacionFisica", data.UbicacionFisica);
    maybeSet("UsuarioAsignado", data.UsuarioAsignado);
    maybeSet("EstadoEquipo", data.EstadoEquipo);
    maybeSet("Activo", data.Activo, (value) => (value ? 1 : 0));

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    const query = `
      UPDATE BienesComponentes
      SET ${updateFields.join(", ")}
      WHERE IdBien = @IdBien AND IdComponente = @IdComponente
    `;

    await executeQuery(query, params);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PATCH /api/componentes:", error);
    return NextResponse.json(
      { error: "Error al actualizar el componente del bien" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idBien = parseNullableInt(searchParams.get("idBien"));
    const idComponente = parseNullableInt(searchParams.get("idComponente"));

    if (!idBien || !idComponente) {
      return NextResponse.json(
        { error: "idBien y idComponente son requeridos para eliminar" },
        { status: 400 }
      );
    }

    await executeQuery(
      `DELETE FROM BienesComponentes
       WHERE IdBien = @IdBien AND IdComponente = @IdComponente`,
      { IdBien: idBien, IdComponente: idComponente }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/componentes:", error);
    return NextResponse.json(
      { error: "Error al eliminar el componente del bien" },
      { status: 500 }
    );
  }
}
