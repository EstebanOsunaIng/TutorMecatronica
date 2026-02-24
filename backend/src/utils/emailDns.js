import dns from 'node:dns/promises';

export async function domainHasMailRecords(domain) {
  const target = String(domain || '').trim().toLowerCase();
  if (!target) return false;

  try {
    const mx = await dns.resolveMx(target);
    if (Array.isArray(mx) && mx.length > 0) return true;
  } catch (_err) {
    // fallback to A record
  }

  try {
    const records = await dns.resolve4(target);
    return Array.isArray(records) && records.length > 0;
  } catch (_err) {
    return false;
  }
}
