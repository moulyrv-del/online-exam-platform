// Run with: npm run db:setup
// Creates the tables and the admin account. Nothing else.
// WARNING: this deletes any existing data in these tables.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function run() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error('Please set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first.');
    process.exit(1);
  }
  if (process.env.ADMIN_PASSWORD.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const schema = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Tables created.');

  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
  await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', $1, $2, 'admin')",
    [process.env.ADMIN_EMAIL.trim().toLowerCase(), hash]
  );
  console.log('Admin account created:', process.env.ADMIN_EMAIL);
  console.log('Log in as admin to create exams and questions.');
  await pool.end();
}

run().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
