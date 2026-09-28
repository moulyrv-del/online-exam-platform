// Run with: npm run db:seed   (optional)
// Adds two ready-made exams with questions so you have content to start with.
// Run it only after "npm run db:setup", and only once.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'seed.sql'), 'utf8');
  await pool.query(sql);
  console.log('Sample exams added: "JavaScript Basics" and "General Knowledge".');
  await pool.end();
}

run().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
