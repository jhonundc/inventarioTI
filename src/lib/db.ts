import sql from "mssql";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });

const config: sql.config = {
  server: process.env.DB_SERVER || "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  database: process.env.DB_NAME || process.env.DB_DATABASE || "SoporteTI",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASS || "",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    cryptoCredentialsDetails: {
      minVersion: "TLSv1",
    }
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 15000,
  },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

declare global {
  var mssqlPool: sql.ConnectionPool | undefined;
}

async function createPool(): Promise<sql.ConnectionPool> {
  const pool = new sql.ConnectionPool(config);
  pool.on("error", (err) => {
    console.error("SQL Pool error:", err);
    globalThis.mssqlPool = undefined;
  });
  await pool.connect();
  return pool;
}

export async function getPool(): Promise<sql.ConnectionPool> {
  // Si el pool global existe y está conectado, úsalo
  if (globalThis.mssqlPool?.connected) {
    return globalThis.mssqlPool;
  }

  // Si existe pero no está conectado, limpiarlo
  if (globalThis.mssqlPool && !globalThis.mssqlPool.connected) {
    try {
      await globalThis.mssqlPool.close();
    } catch {}
    globalThis.mssqlPool = undefined;
  }

  // Crear nueva conexión
  globalThis.mssqlPool = await createPool();
  return globalThis.mssqlPool;
}

function addParams(request: sql.Request, params: Record<string, any>) {
  for (const [key, value] of Object.entries(params)) {
    const lowerKey = key.toLowerCase();
    try {
      if (value === null || value === undefined) {
        if (lowerKey.includes("id")) {
          request.input(key, sql.Int, null);
        } else if (lowerKey.includes("fecha")) {
          request.input(key, sql.Date, null);
        } else if (lowerKey.includes("activo")) {
          request.input(key, sql.Bit, null);
        } else {
          request.input(key, sql.VarChar, null);
        }
      } else if (typeof value === "number") {
        if (!Number.isFinite(value)) {
          request.input(key, sql.Int, null);
        } else {
          request.input(key, sql.Int, value);
        }
      } else if (typeof value === "string") {
        if (lowerKey.includes("id") && /^\d+$/.test(value)) {
          request.input(key, sql.Int, parseInt(value, 10));
        } else if (lowerKey.includes("fecha") && !Number.isNaN(Date.parse(value))) {
          request.input(key, sql.Date, new Date(value));
        } else if (lowerKey.includes("activo") && /^(true|false)$/i.test(value)) {
          request.input(key, sql.Bit, value.toLowerCase() === "true");
        } else {
          request.input(key, sql.VarChar, value);
        }
      } else if (value instanceof Date) {
        request.input(key, sql.Date, value);
      } else if (typeof value === "boolean") {
        request.input(key, sql.Bit, value);
      } else {
        request.input(key, sql.VarChar, String(value));
      }
    } catch (err) {
      try {
        request.input(key, value as any);
      } catch (e) {
        console.warn(`No se pudo asignar parámetro ${key}`, e);
      }
    }
  }
}

export async function executeQuery<T = any>(
  sqlQuery: string,
  params: Record<string, any> = {}
): Promise<sql.IResult<T>> {
  const connectionPool = await getPool();
  const request = connectionPool.request();
  addParams(request, params);
  try {
    return await request.query<T>(sqlQuery);
  } catch (err: any) {
    // Si la conexión se cerró durante la consulta, reintentar una vez
    if (err?.code === "ECONNCLOSED" || err?.code === "ECONNRESET") {
      globalThis.mssqlPool = undefined;
      const freshPool = await getPool();
      const retryRequest = freshPool.request();
      addParams(retryRequest, params);
      return retryRequest.query<T>(sqlQuery);
    }
    throw err;
  }
}

export { sql };
