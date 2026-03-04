import 'dotenv/config';
import { connectDb } from '../config/db.js';
import { User } from '../models/User.model.js';
import { hashPassword } from '../utils/hash.js';
import { hashLookupValue, normalizeEmailForLookup } from '../utils/fieldCrypto.js';

const defaults = {
  email: 'admin1@gmail.com',
  password: 'Admin12345!',
  name: 'Super',
  lastName: 'Admin',
  document: '0000000000',
  phone: '3000000000'
};

async function run() {
  await connectDb();

  const email = normalizeEmailForLookup(process.env.ADMIN_EMAIL || defaults.email);
  const password = process.env.ADMIN_PASSWORD || defaults.password;
  const name = process.env.ADMIN_NAME || defaults.name;
  const lastName = process.env.ADMIN_LASTNAME || defaults.lastName;
  const document = process.env.ADMIN_DOCUMENT || defaults.document;
  const phone = process.env.ADMIN_PHONE || defaults.phone;

  const exists = await User.findOne({ emailHash: hashLookupValue(email) });
  if (exists) {
    console.log(`[seed] admin already exists: ${email}`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);
  await User.create({
    role: 'ADMIN',
    name,
    lastName,
    document,
    email,
    phone,
    passwordHash,
    emailVerified: true,
    status: 'ACTIVE'
  });

  console.log(`[seed] admin created: ${email}`);
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
