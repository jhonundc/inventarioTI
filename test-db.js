/*import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

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
  console.log('Testing database connection with mssql...');
  const pool = await sql.connect(config);
  
  // Try to count users
  const countResult = await pool.request().query("SELECT COUNT(*) AS count FROM Usuarios");
  const count = countResult.recordset[0].count;
  console.log(`Found ${count} users in database`);
  
  // List first 5 users
  const usersResult = await pool.request().query("SELECT TOP 5 IdUsuario, Usuario, Nombres, Activo FROM Usuarios");
  console.log('Users:', usersResult.recordset);
  
  await pool.close();
}

main()
  .catch(e => {
    console.error('Database error:', e);
  });
*/

import sql from "mssql";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });

const config = {
  server: process.env.DB_SERVER || "localhost",
  port: parseInt(process.env.DB_PORT || "1433"),
  database: process.env.DB_NAME || process.env.DB_DATABASE || "SoporteTI",
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function main() {
  try {
    console.log("Testing database connection with mssql...");

    const pool = await sql.connect(config);

    console.log("✅ Connected to SQL Server");

    const result = await pool
      .request()
      .query("SELECT COUNT(*) AS count FROM Usuarios");

    console.log(result.recordset);

    await pool.close();
  } catch (e) {
    console.error("❌ Database error:", e);
  }
}

main();