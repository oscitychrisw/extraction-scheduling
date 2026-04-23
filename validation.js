import sql from "mssql";

let poolPromise;

export async function getPool() {
  if (!process.env.SQL_CONNECTION_STRING) {
    throw new Error("Missing SQL_CONNECTION_STRING environment variable.");
  }

  if (!poolPromise) {
    poolPromise = sql.connect(process.env.SQL_CONNECTION_STRING);
  }

  return poolPromise;
}

export { sql };
