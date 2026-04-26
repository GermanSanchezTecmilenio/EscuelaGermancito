/* eslint-disable no-console */

try {
  // eslint-disable-next-line global-require
  require("dotenv").config();
} catch {
  // ignore
}

const mysql = require("mysql2/promise");

const DEFAULT_DB_HOST = "localhost";
const DEFAULT_DB_USER = "root";
const DEFAULT_DB_PASSWORD = "1234";
const DEFAULT_DB_APP_NAME = "germancito";

const DB_HOST = (process.env.DB_HOST || DEFAULT_DB_HOST).trim();
const DB_USER = (process.env.DB_USER || DEFAULT_DB_USER).trim();
const DB_PASSWORD =
  process.env.DB_PASSWORD && process.env.DB_PASSWORD.length > 0 ? process.env.DB_PASSWORD : DEFAULT_DB_PASSWORD;
const DB_APP_NAME = (process.env.DB_APP_NAME || DEFAULT_DB_APP_NAME).trim();

function isSafeIdentifier(value) {
  return typeof value === "string" && /^[A-Za-z0-9_]+$/.test(value);
}

if (!DB_HOST) throw new Error("DB_HOST vacío");
if (!DB_USER) throw new Error("DB_USER vacío");
if (!DB_APP_NAME) throw new Error("DB_APP_NAME vacío");
if (!isSafeIdentifier(DB_APP_NAME)) throw new Error(`DB_APP_NAME inválido: ${DB_APP_NAME}`);

const dropStatements = [
  "SET FOREIGN_KEY_CHECKS = 0",
  "DROP TABLE IF EXISTS quiz_summaries",
  "DROP TABLE IF EXISTS quiz_results",
  "DROP TABLE IF EXISTS quiz_options",
  "DROP TABLE IF EXISTS quiz_questions",
  "DROP TABLE IF EXISTS quizzes",
  "DROP TABLE IF EXISTS quiz_attempt_answers",
  "DROP TABLE IF EXISTS quiz_attempts",
  "SET FOREIGN_KEY_CHECKS = 1"
];

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_APP_NAME
  });

  try {
    for (const sql of dropStatements) {
      // eslint-disable-next-line no-await-in-loop
      await conn.query(sql);
    }
    console.log(`[DB] Tablas eliminadas en '${DB_APP_NAME}'. Reinicia el servidor para recrear/seed.`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[DB] Error reseteando:", err?.message || err);
  process.exitCode = 1;
});
