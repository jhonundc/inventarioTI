/* const sql = require("mssql");
require("dotenv").config();
const bcrypt = require("bcrypt");

const config = {
  server: process.env.DB_SERVER || "localhost",
  port: parseInt(process.env.DB_PORT || "1433"),
  database: process.env.DB_NAME || "SoporteTI",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASS || "",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    cryptoCredentialsDetails: {
      minVersion: "TLSv1",
    }
  },
};

async function main() {
  console.log("Starting seed with mssql...");
  const pool = await sql.connect(config);

  // Create roles if they don't exist
  const roles = [
    { NombreRol: "Administrador", Activo: true },
    { NombreRol: "Técnico", Activo: true },
    { NombreRol: "Usuario", Activo: true },
  ];

  for (const roleData of roles) {
    const existingRoleResult = await pool
      .request()
      .input("NombreRol", sql.VarChar(50), roleData.NombreRol)
      .query("SELECT * FROM Roles WHERE NombreRol = @NombreRol");

    if (existingRoleResult.recordset.length === 0) {
      await pool
        .request()
        .input("NombreRol", sql.VarChar(50), roleData.NombreRol)
        .input("Activo", sql.Bit, roleData.Activo)
        .query("INSERT INTO Roles (NombreRol, Activo) VALUES (@NombreRol, @Activo)");
      console.log(`Created role: ${roleData.NombreRol}`);
    } else {
      console.log(`Role already exists: ${roleData.NombreRol}`);
    }
  }

  // Create a default admin user
  const adminRoleResult = await pool
    .request()
    .query("SELECT * FROM Roles WHERE NombreRol = 'Administrador'");
  const adminRole = adminRoleResult.recordset[0];

  if (!adminRole) {
    console.error("Admin role not found!");
    await pool.close();
    return;
  }

  const existingAdminResult = await pool
    .request()
    .query("SELECT * FROM Usuarios WHERE Usuario = 'admin'");

  if (existingAdminResult.recordset.length === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await pool
      .request()
      .input("Usuario", sql.VarChar(50), "admin")
      .input("Clave", sql.VarChar(200), hashedPassword)
      .input("Nombres", sql.VarChar(150), "Administrador Sistema")
      .input("Cargo", sql.VarChar(100), "Administrador")
      .input("IdRol", sql.Int, adminRole.IdRol)
      .input("Activo", sql.Bit, true)
      .query(
        "INSERT INTO Usuarios (Usuario, Clave, Nombres, Cargo, IdRol, Activo, FechaCreacion) VALUES (@Usuario, @Clave, @Nombres, @Cargo, @IdRol, @Activo, GETDATE())"
      );
    console.log("Created admin user: admin / admin123");
  } else {
    console.log("Admin user already exists");
  }

  // Create some basic catalog data if empty
  const areasCountResult = await pool.request().query("SELECT COUNT(*) AS count FROM Areas");
  if (areasCountResult.recordset[0].count === 0) {
    const areas = [
      "Unidad de Estadística e Informática",
      "Recursos Humanos",
      "Finanzas",
      "Operaciones",
    ];
    for (const area of areas) {
      await pool
        .request()
        .input("NombreArea", sql.VarChar(150), area)
        .query("INSERT INTO Areas (NombreArea, Activo) VALUES (@NombreArea, 1)");
    }
    console.log("Created basic areas");
  }

  const condicionesCountResult = await pool
    .request()
    .query("SELECT COUNT(*) AS count FROM CondicionesBien");
  if (condicionesCountResult.recordset[0].count === 0) {
    const condiciones = ["Operativo", "Inoperativo"];
    for (const cond of condiciones) {
      await pool
        .request()
        .input("Condicion", sql.VarChar(50), cond)
        .query("INSERT INTO CondicionesBien (Condicion, Activo) VALUES (@Condicion, 1)");
    }
    console.log("Created basic conditions");
  }

  const estadosCountResult = await pool
    .request()
    .query("SELECT COUNT(*) AS count FROM EstadosDelBien");
  if (estadosCountResult.recordset[0].count === 0) {
    const estados = ["Bueno", "Regular", "Reparar", "Baja"];
    for (const est of estados) {
      await pool
        .request()
        .input("EstadoBien", sql.VarChar(50), est)
        .query("INSERT INTO EstadosDelBien (EstadoBien, Activo) VALUES (@EstadoBien, 1)");
    }
    console.log("Created basic states");
  }

  const prioridadesCountResult = await pool
    .request()
    .query("SELECT COUNT(*) AS count FROM Prioridades");
  if (prioridadesCountResult.recordset[0].count === 0) {
    const prioridades = [
      { NombrePrioridad: "Baja", HorasAtencion: 24 },
      { NombrePrioridad: "Media", HorasAtencion: 8 },
      { NombrePrioridad: "Alta", HorasAtencion: 4 },
      { NombrePrioridad: "Urgente", HorasAtencion: 1 },
    ];
    for (const prio of prioridades) {
      await pool
        .request()
        .input("NombrePrioridad", sql.VarChar(50), prio.NombrePrioridad)
        .input("HorasAtencion", sql.Int, prio.HorasAtencion)
        .query(
          "INSERT INTO Prioridades (NombrePrioridad, HorasAtencion, Activo) VALUES (@NombrePrioridad, @HorasAtencion, 1)"
        );
    }
    console.log("Created basic priorities");
  }

  const marcasCountResult = await pool.request().query("SELECT COUNT(*) AS count FROM Marcas");
  if (marcasCountResult.recordset[0].count === 0) {
    const marcas = ["KYOCERA", "HP", "Dell", "Lenovo", "Canon"];
    for (const marca of marcas) {
      await pool
        .request()
        .input("Marca", sql.VarChar(100), marca)
        .query("INSERT INTO Marcas (Marca, Activo) VALUES (@Marca, 1)");
    }
    console.log("Created basic brands");
  }

  const categoriasCountResult = await pool
    .request()
    .query("SELECT COUNT(*) AS count FROM CategoriasBienes");
  if (categoriasCountResult.recordset[0].count === 0) {
    const categorias = [
      "Equipo de Cómputo",
      "Impresora",
      "Equipo de Red",
      "Muebles",
      "Equipo de Comunicación",
    ];
    for (const cat of categorias) {
      await pool
        .request()
        .input("CategoriaBien", sql.VarChar(100), cat)
        .query(
          "INSERT INTO CategoriasBienes (CategoriaBien, Activo) VALUES (@CategoriaBien, 1)"
        );
    }
    console.log("Created basic categories");
  }

  await pool.close();
  console.log("Seed completed successfully!");
}

main().catch((e) => {
  console.error("Error during seed:", e);
});}
*/

const sql = require("mssql");
require("dotenv").config();
const bcrypt = require("bcrypt");

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,

  options: {
    encrypt: false,
    trustServerCertificate: true,
    trustedConnection: true,
  },
};

async function main() {
  try {
    console.log("Starting seed with mssql...");

    const pool = await sql.connect(config);

    console.log("✅ Connected to SQL Server");

    // Create roles if they don't exist
    const roles = [
      { NombreRol: "Administrador", Activo: true },
      { NombreRol: "Técnico", Activo: true },
      { NombreRol: "Usuario", Activo: true },
    ];

    for (const roleData of roles) {
      const existingRoleResult = await pool
        .request()
        .input("NombreRol", sql.VarChar(50), roleData.NombreRol)
        .query("SELECT * FROM Roles WHERE NombreRol = @NombreRol");

      if (existingRoleResult.recordset.length === 0) {
        await pool
          .request()
          .input("NombreRol", sql.VarChar(50), roleData.NombreRol)
          .input("Activo", sql.Bit, roleData.Activo)
          .query(`
            INSERT INTO Roles (NombreRol, Activo)
            VALUES (@NombreRol, @Activo)
          `);

        console.log(`✅ Created role: ${roleData.NombreRol}`);
      }
    }

    // Buscar rol admin
    const adminRoleResult = await pool
      .request()
      .query("SELECT * FROM Roles WHERE NombreRol = 'Administrador'");

    const adminRole = adminRoleResult.recordset[0];

    if (!adminRole) {
      console.error("❌ Admin role not found");
      return;
    }

    // Verificar usuario admin
    const existingAdminResult = await pool
      .request()
      .query("SELECT * FROM Usuarios WHERE Usuario = 'admin'");

    if (existingAdminResult.recordset.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);

      await pool
        .request()
        .input("Usuario", sql.VarChar(50), "admin")
        .input("Clave", sql.VarChar(200), hashedPassword)
        .input("Nombres", sql.VarChar(150), "Administrador Sistema")
        .input("Cargo", sql.VarChar(100), "Administrador")
        .input("IdRol", sql.Int, adminRole.IdRol)
        .input("Activo", sql.Bit, true)
        .query(`
          INSERT INTO Usuarios
          (
            Usuario,
            Clave,
            Nombres,
            Cargo,
            IdRol,
            Activo,
            FechaCreacion
          )
          VALUES
          (
            @Usuario,
            @Clave,
            @Nombres,
            @Cargo,
            @IdRol,
            @Activo,
            GETDATE()
          )
        `);

      console.log("✅ Created admin user: admin / admin123");
    } else {
      console.log("ℹ️ Admin user already exists");
    }

    await pool.close();

    console.log("✅ Seed completed successfully!");

  } catch (e) {
    console.error("❌ Error during seed:", e);
  }
}

main();