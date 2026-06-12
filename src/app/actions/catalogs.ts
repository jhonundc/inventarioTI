"use server";

import { executeQuery } from "@/lib/db";

export async function getMarcas() {
  const result = await executeQuery("SELECT * FROM Marcas WHERE Activo = 1");
  return result.recordset;
}

export async function getModelos(idMarca?: number, idCategoria?: number) {
  let sql = "SELECT * FROM Modelos WHERE Activo = 1";
  const params: Record<string, any> = {};
  if (idMarca) {
    sql += " AND IdMarca = @IdMarca";
    params.IdMarca = idMarca;
  }
  if (idCategoria) {
    sql += " AND IdCategoria = @IdCategoria";
    params.IdCategoria = idCategoria;
  }
  const result = await executeQuery(sql, params);
  return result.recordset;
}

export async function getAreas() {
  const result = await executeQuery("SELECT * FROM Areas WHERE Activo = 1");
  return result.recordset;
}

export async function getCondiciones() {
  const result = await executeQuery("SELECT * FROM CondicionesBien WHERE Activo = 1");
  return result.recordset;
}

export async function getEstados() {
  const result = await executeQuery("SELECT * FROM EstadosDelBien WHERE Activo = 1");
  return result.recordset;
}

export async function getCategorias() {
  const result = await executeQuery("SELECT * FROM CategoriasBienes WHERE Activo = 1");
  return result.recordset;
}

export async function getTiposEstacion() {
  const result = await executeQuery("SELECT * FROM TiposEstacion WHERE Activo = 1");
  return result.recordset;
}

export async function getSoftwareCatalogo() {
  const result = await executeQuery("SELECT * FROM SoftwareCatalogo WHERE Activo = 1 ORDER BY NombreSoftware ASC");
  return result.recordset;
}

export async function getTiposSoftware() {
  const result = await executeQuery("SELECT * FROM TipoSoftware WHERE Activo = 1 ORDER BY TipoSoftware ASC");
  return result.recordset;
}

export async function getTiposLicencia() {
  const result = await executeQuery("SELECT * FROM TipoLicencia WHERE Activo = 1 ORDER BY TipoLicencia ASC");
  return result.recordset;
}

export async function getTiposAsignacionSoftware() {
  const result = await executeQuery("SELECT * FROM TipoAsignacionSoftware WHERE Activo = 1 ORDER BY TipoAsignacion ASC");
  return result.recordset;
}

export async function getTiposBien() {
  // Since there's no dedicated table for TipoBien, we'll return hardcoded values
  // based on the requirements: informatico, comunicacion, electrico
  return [
    { IdTipoBien: 1, TipoBien: "Informático" },
    { IdTipoBien: 2, TipoBien: "Comunicación" },
    { IdTipoBien: 3, TipoBien: "Eléctrico" },
  ];
}

export async function getBienes() {
  const queryText = `
    SELECT 
        b.*,
        m.Marca AS Marca_Marca, m.Activo AS Marca_Activo,
        mo.Modelo AS Modelo_Modelo, mo.Activo AS Modelo_Activo, mo.IdMarca AS Modelo_IdMarca, mo.IdCategoria AS Modelo_IdCategoria,
        a.NombreArea AS Area_NombreArea, a.Piso AS Area_Piso, a.Referencia AS Area_Referencia, a.Activo AS Area_Activo,
        c.Condicion AS Condicion_Condicion, c.Activo AS Condicion_Activo,
        e.EstadoBien AS Estado_EstadoBien, e.Activo AS Estado_Activo
    FROM Bienes b
    LEFT JOIN Marcas m ON b.IdMarca = m.IdMarca
    LEFT JOIN Modelos mo ON b.IdModelo = mo.IdModelo
    LEFT JOIN Areas a ON b.IdArea = a.IdArea
    LEFT JOIN CondicionesBien c ON b.IdCondicion = c.IdCondicion
    LEFT JOIN EstadosDelBien e ON b.IdEstadoBien = e.IdEstadoBien
    WHERE b.Activo = 1
  `;
  const result = await executeQuery(queryText);
  return result.recordset.map((row: any) => ({
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
  }));
}

export async function getPrioridades() {
  const result = await executeQuery("SELECT * FROM Prioridades WHERE Activo = 1");
  return result.recordset;
}

export async function createArea(data: { nombre: string }) {
  const result = await executeQuery(
    "INSERT INTO Areas (NombreArea, Activo) OUTPUT INSERTED.* VALUES (@nombre, 1)",
    { nombre: data.nombre }
  );
  return result.recordset[0];
}

export async function createBien(data: {
  codigoInventario: string;
  codigoPatrimonial: string;
  descripcion: string;
  numeroSerie: string;
  marca: string;
  modelo: string;
  idArea: number;
}) {
  // Buscar o crear la Marca
  let marcaId: number;
  const getMarcaResult = await executeQuery(
    "SELECT IdMarca FROM Marcas WHERE Marca = @Marca",
    { Marca: data.marca }
  );
  if (getMarcaResult.recordset.length > 0) {
    marcaId = getMarcaResult.recordset[0].IdMarca;
  } else {
    const createMarcaResult = await executeQuery(
      "INSERT INTO Marcas (Marca, Activo) OUTPUT INSERTED.IdMarca VALUES (@Marca, 1)",
      { Marca: data.marca }
    );
    marcaId = createMarcaResult.recordset[0].IdMarca;
  }

  // Buscar o crear el Modelo
  let modeloId: number;
  const getModeloResult = await executeQuery(
    "SELECT IdModelo FROM Modelos WHERE Modelo = @Modelo",
    { Modelo: data.modelo }
  );
  if (getModeloResult.recordset.length > 0) {
    modeloId = getModeloResult.recordset[0].IdModelo;
  } else {
    const createModeloResult = await executeQuery(
      "INSERT INTO Modelos (Modelo, IdMarca, Activo) OUTPUT INSERTED.IdModelo VALUES (@Modelo, @IdMarca, 1)",
      { Modelo: data.modelo, IdMarca: marcaId }
    );
    modeloId = createModeloResult.recordset[0].IdModelo;
  }

  const createBienResult = await executeQuery(
    `INSERT INTO Bienes (CodigoInventario, CodigoPatrimonial, Descripcion, NumeroSerie, IdMarca, IdModelo, IdArea, Activo, FechaRegistro)
     OUTPUT INSERTED.*
     VALUES (@CodigoInventario, @CodigoPatrimonial, @Descripcion, @NumeroSerie, @IdMarca, @IdModelo, @IdArea, 1, GETDATE())`,
    {
      CodigoInventario: data.codigoInventario,
      CodigoPatrimonial: data.codigoPatrimonial,
      Descripcion: data.descripcion,
      NumeroSerie: data.numeroSerie,
      IdMarca: marcaId,
      IdModelo: modeloId,
      IdArea: data.idArea,
    }
  );

  return createBienResult.recordset[0];
}

