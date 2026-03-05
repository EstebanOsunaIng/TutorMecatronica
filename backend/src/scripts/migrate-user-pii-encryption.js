import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDb } from '../config/db.js';
import { User } from '../models/User.model.js';
import { decryptFieldValue, isEncryptedValue } from '../utils/fieldCrypto.js';

function wasLegacyPlain(user) {
  const raw = user.toObject({ getters: false });
  return {
    name: !isEncryptedValue(raw.name),
    lastName: !isEncryptedValue(raw.lastName),
    document: !isEncryptedValue(raw.document),
    email: !isEncryptedValue(raw.email),
    phone: raw.phone ? !isEncryptedValue(raw.phone) : false
  };
}

async function run() {
  await connectDb();

  const users = await User.find({});
  let migrated = 0;
  let alreadyEncrypted = 0;

  for (const user of users) {
    const legacy = wasLegacyPlain(user);
    const needsMigration = Object.values(legacy).some(Boolean) || !user.emailHash || !user.documentHash;
    if (!needsMigration) {
      alreadyEncrypted += 1;
      continue;
    }

    const plainName = decryptFieldValue(user.get('name', null, { getters: false }));
    const plainLastName = decryptFieldValue(user.get('lastName', null, { getters: false }));
    const plainDocument = decryptFieldValue(user.get('document', null, { getters: false }));
    const plainEmail = decryptFieldValue(user.get('email', null, { getters: false }));
    const plainPhone = decryptFieldValue(user.get('phone', null, { getters: false }));

    user.name = plainName;
    user.lastName = plainLastName;
    user.document = plainDocument;
    user.email = plainEmail;
    user.phone = plainPhone;
    await user.save();
    migrated += 1;
  }

  console.log('[migrate-user-pii] completed', {
    total: users.length,
    migrated,
    alreadyEncrypted
  });

  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('[migrate-user-pii] failed', error);
  await mongoose.disconnect();
  process.exit(1);
});
