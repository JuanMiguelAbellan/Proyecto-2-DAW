import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const dbHost = process.env.POSTGRES_HOST;
const dbUser = process.env.POSTGRES_USER;
const dbPassword = process.env.POSTGRES_PASSWORD;
const dbName = process.env.POSTGRES_DB;
const pgPort = process.env.POSTGRES_PORT

const pool = new Pool({
  max: 1000,
  connectionString: `postgres://${dbUser}:${dbPassword}@${dbHost}:${pgPort}/${dbName}`,
  idleTimeoutMillis: 30000,
  ssl:{
    rejectUnauthorized: false
  }
});

const executeQuery = async (sql: any, data?: any[]): Promise<any> => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(sql, data);
    client.release();
    return rows;
  } catch (err) {
    console.error(err);
    client.release();
    return null;
  }
};

export default executeQuery;