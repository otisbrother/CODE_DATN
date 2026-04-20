/**
 * Seed script — run with: node src/seed.js
 * Inserts proper bcrypt-hashed passwords for test accounts
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function seed() {
  try {
    const hash = await bcrypt.hash('123456', 10);
    console.log('🔑 Generated hash for "123456":', hash);

    // Update all existing users with proper hash
    await db.query('UPDATE users SET password_hash = ?', [hash]);
    console.log('✅ Updated all user passwords');

    // Verify
    const [users] = await db.query('SELECT id, full_name, email, role_id, status FROM users');
    console.log('👥 Users in database:');
    users.forEach(u => console.log(`   ${u.id}. ${u.full_name} (${u.email}) role=${u.role_id} status=${u.status}`));

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
