/** Quick health + quota report for the Neon free plan. `npm run db:status` */
import pg from "pg";
import { dbConfig, fmtBytes } from "./lib/env.mjs";

const { Pool } = pg;
const pool = new Pool(dbConfig());

async function status() {
  try {
    const r = await pool.query(`
      SELECT (SELECT count(*) FROM users)                          AS users,
             (SELECT count(*) FROM members)                        AS members,
             (SELECT count(*) FROM trainers)                       AS trainers,
             (SELECT count(*) FROM classes)                        AS classes,
             (SELECT count(*) FROM payments)                       AS payments,
             (SELECT count(*) FROM class_attendance)               AS attendance,
             (SELECT count(*) FROM check_ins)                      AS checkins,
             (SELECT count(*) FROM contact_messages)               AS messages,
             (SELECT COALESCE(sum(size_bytes),0)::bigint FROM media) AS media_bytes,
             (SELECT pg_size_pretty(pg_database_size(current_database()))) AS db_size
    `);
    const row = r.rows[0];
    const budgetMb = Number(process.env.MEDIA_BUDGET_MB || 120);
    const usedMb = Number(row.media_bytes) / 1024 / 1024;

    console.log("\n  Ezzy Fitness — Neon status");
    console.log("  --------------------------------------");
    console.log(`  database size : ${row.db_size}`);
    console.log(`  users         : ${row.users}   (members ${row.members}, trainers ${row.trainers})`);
    console.log(`  classes       : ${row.classes}`);
    console.log(`  payments      : ${row.payments}`);
    console.log(`  attendance    : ${row.attendance}`);
    console.log(`  check-ins     : ${row.checkins}`);
    console.log(`  messages      : ${row.messages}`);
    console.log(
      `  media stored  : ${fmtBytes(Number(row.media_bytes))} of ${budgetMb} MB budget (${usedMb.toFixed(1)}%)\n`
    );
  } catch (err) {
    console.error(`\n  [✗] ${err.message}\n`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

status();
