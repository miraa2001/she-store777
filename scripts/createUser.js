// scripts/createUser.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../db'); // uses your existing db.js

async function main() {
  // ✏️ You can change these values if you want
  const username = 'rahaf';
  const plainPassword = 'rahaf123';
  const name = 'Rahaf';

  try {
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const result = await db.query(
      `INSERT INTO users (username, password_hash, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (username)
       DO UPDATE SET password_hash = EXCLUDED.password_hash,
                     name = EXCLUDED.name
       RETURNING id, username, name`,
      [username, passwordHash, name]
    );

    console.log('User upserted:');
    console.log(result.rows[0]);
    console.log('--------------------------------');
    console.log('Login with:');
    console.log('username:', username);
    console.log('password:', plainPassword);
  } catch (err) {
    console.error('Error inserting user:', err);
  } finally {
    process.exit(0);
  }
}

main();
