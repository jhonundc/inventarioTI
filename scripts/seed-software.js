import sql from "mssql";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });

const config = {
  server: process.env.DB_SERVER || "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  database: process.env.DB_NAME || process.env.DB_DATABASE || "SoporteTI",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASS || "",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const softwareItems = Array.from({ length: 10 }, (_, index) => {
  const i = index + 1;
  return {
    NombreSoftware: `PruebaSoftware ${i}`,
    TipoSoftware: i % 2 === 0 ? "Aplicación" : "Sistema",
    VersionSoftware: `1.0.${i}`,
    ProveedorEntidad: `Proveedor Prueba ${((i - 1) % 3) + 1}`,
    TipoLicencia: i % 2 === 0 ? "Suscripción" : "Perpetua",
    CantidadLicencias: 5 + i,
    EstadoLicencia: "1",
    FechaCaducidad: i % 2 === 0 ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) : null,
    EquiposUsuariosAsignados: i % 3 === 0 ? `Equipo ${i}` : null,
    UsoFinalidad: `Uso de prueba número ${i}`,
  };
});

async function main() {
  console.log("Conectando a la base de datos...");
  const pool = await sql.connect(config);

  try {
    for (const item of softwareItems) {
      await pool
        .request()
        .input("NombreSoftware", sql.VarChar(250), item.NombreSoftware)
        .input("TipoSoftware", sql.VarChar(150), item.TipoSoftware)
        .input("VersionSoftware", sql.VarChar(50), item.VersionSoftware)
        .input("ProveedorEntidad", sql.VarChar(200), item.ProveedorEntidad)
        .input("TipoLicencia", sql.VarChar(100), item.TipoLicencia)
        .input("CantidadLicencias", sql.Int, item.CantidadLicencias)
        .input("EstadoLicencia", sql.VarChar(10), item.EstadoLicencia)
        .input("FechaCaducidad", sql.Date, item.FechaCaducidad)
        .input("EquiposUsuariosAsignados", sql.VarChar(500), item.EquiposUsuariosAsignados)
        .input("UsoFinalidad", sql.VarChar(500), item.UsoFinalidad)
        .query(`EXEC pro_InsertarBienSoftware
          @NombreSoftware = @NombreSoftware,
          @TipoSoftware = @TipoSoftware,
          @VersionSoftware = @VersionSoftware,
          @ProveedorEntidad = @ProveedorEntidad,
          @TipoLicencia = @TipoLicencia,
          @CantidadLicencias = @CantidadLicencias,
          @EstadoLicencia = @EstadoLicencia,
          @FechaCaducidad = @FechaCaducidad,
          @EquiposUsuariosAsignados = @EquiposUsuariosAsignados,
          @UsoFinalidad = @UsoFinalidad`);
      console.log(`Insertado: ${item.NombreSoftware}`);
    }

    console.log("Se insertaron 10 datos de prueba en el registro de software.");
  } catch (error) {
    console.error("Error al insertar datos de prueba:", error);
    process.exit(1);
  } finally {
    await pool.close();
  }
}

main();
