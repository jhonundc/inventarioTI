import sql from "mssql";

const config: sql.config = {
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

export async function executeQuery<T = any>(
  sqlQuery: string,
  params: Record<string, any> = {}
): Promise<sql.IResult<T>> {
  const connectionPool = await getPool();
  const request = connectionPool.request();
  for (const [key, value] of Object.entries(params)) {
    request.input(key, value);
  }
  try {
    return await request.query<T>(sqlQuery);
  } catch (err: any) {
    // Si la conexión se cerró durante la consulta, reintentar una vez
    if (err?.code === "ECONNCLOSED" || err?.code === "ECONNRESET") {
      globalThis.mssqlPool = undefined;
      const freshPool = await getPool();
      const retryRequest = freshPool.request();
      for (const [key, value] of Object.entries(params)) {
        retryRequest.input(key, value);
      }
      return retryRequest.query<T>(sqlQuery);
    }
    throw err;
  }
}

export { sql };
