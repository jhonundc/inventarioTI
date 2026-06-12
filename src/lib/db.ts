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
      // null / undefined -> send explicit null with inferred type
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
        continue;
      }

      // Numbers -> Int
      if (typeof value === "number") {
        if (!Number.isFinite(value)) {
          request.input(key, sql.Int, null);
        } else {
          request.input(key, sql.Int, value);
        }
        continue;
      }

      // Strings -> try to coerce to the most appropriate type
      if (typeof value === "string") {
        if (lowerKey.includes("fecha") && !Number.isNaN(Date.parse(value))) {
          request.input(key, sql.Date, new Date(value));
        } else if (lowerKey.includes("id") && /^\d+$/.test(value)) {
          request.input(key, sql.Int, parseInt(value, 10));
        } else if (lowerKey.includes("activo") && /^(true|false)$/i.test(value)) {
          request.input(key, sql.Bit, value.toLowerCase() === "true");
        } else {
          request.input(key, sql.VarChar, value);
        }
        continue;
      }

      // Date objects
      if (value instanceof Date) {
        request.input(key, sql.Date, value);
        continue;
      }

      // Booleans
      if (typeof value === "boolean") {
        request.input(key, sql.Bit, value);
        continue;
      }

      // Buffer / ArrayBuffer -> send as VarChar(JSON) as fallback
      if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
        request.input(key, sql.VarChar, value.toString("base64"));
        continue;
      }

      // Objects (including accidental sql type objects) -> defensive handling
      if (typeof value === "object") {
        // Detect if caller accidentally passed a mssql type descriptor as the param value
        // A type descriptor created by sql.VarChar(50) will look like { type: [sql.VarChar], length: 50 }
        if ("type" in value && ("length" in value || "precision" in value || "scale" in value)) {
          // If we receive a raw type descriptor as the value, it's likely a caller mistake.
          // Log a warning and coerce to a safe pair: use Int for id-like names, otherwise VarChar.
          console.warn(`Param ${key} appears to be a mssql type descriptor; coercing to safe types.`);
          if (lowerKey.includes("id")) {
            request.input(key, sql.Int, null);
          } else {
            request.input(key, sql.VarChar, null);
          }
          continue;
        }

        // For plain objects, stringify to avoid passing unexpected shapes to the driver
        try {
          request.input(key, sql.VarChar, JSON.stringify(value));
        } catch (e) {
          request.input(key, sql.VarChar, String(value));
        }
        continue;
      }

      // Fallback: coerce to string
      request.input(key, sql.VarChar, String(value));
    } catch (err) {
      // As a last resort try the original request.input signature and log the error
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
