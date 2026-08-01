const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  const users = await pool.query("SELECT id, email, first_name, last_name FROM users");
  console.log("Users in DB:", users.rows);

  await pool.end();
}
run();
