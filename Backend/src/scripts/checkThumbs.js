require('dotenv/config');
const pool = require('../adapters/postgres/pool');

async function run() {
  const { rows } = await pool.query(
    'SELECT count(*) AS total, count(thumb_url) AS con_thumb FROM entry_photos'
  );
  console.log(rows[0]);
  process.exit(0);
}
run();
