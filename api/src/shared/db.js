import sql from "mssql";

let poolPromise;

export async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(process.env.SQL_CONNECTION_STRING);
  }
  return poolPromise;
}

export { sql };