import dns from 'node:dns/promises';

function parseAllowedDomains() {
  return String(process.env.INSTITUTIONAL_EMAIL_DOMAINS || '')
    .split(',')
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);
}

function isDomainAllowedByConfig(domain, allowedDomains) {
  if (!allowedDomains.length) return false;
  return allowedDomains.some((entry) => domain === entry || domain.endsWith(`.${entry}`));
}

export async function domainHasMailRecords(domain) {
  const target = String(domain || '').trim().toLowerCase();
  if (!target) return false;

  const allowedDomains = parseAllowedDomains();
  if (isDomainAllowedByConfig(target, allowedDomains)) {
    return true;
  }

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
