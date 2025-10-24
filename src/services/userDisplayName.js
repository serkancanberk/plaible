export function deriveDisplayNameFromEmail(email) {
  try {
    if (!email || typeof email !== 'string') return 'Player';
    const at = email.indexOf('@');
    const local = at > 0 ? email.slice(0, at) : email;
    const parts = local.split(/[.\-_]+/).filter(Boolean);
    if (parts.length === 0) return 'Player';
    return parts
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  } catch {
    return 'Player';
  }
}


