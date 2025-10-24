import { deriveDisplayNameFromEmail } from '../services/userDisplayName';

export function formatUserName(user: any): string {
  try {
    const d = user?.identity?.displayName;
    const fn = user?.identity?.firstName;
    const ln = user?.identity?.lastName;
    const em = user?.email;
    const id = user?._id || user?.id;

    if (d && typeof d === 'string' && d.trim()) return d;
    const name = [fn, ln].filter(Boolean).join(' ').trim();
    if (name) return name;
    if (em) return deriveDisplayNameFromEmail(em);
    return `User #${String(id || '').slice(-4) || '----'}`;
  } catch {
    return 'User';
  }
}


