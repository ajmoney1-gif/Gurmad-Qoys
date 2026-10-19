/**
 * Form and input validation utilities for GURMAD QOYS.
 */

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

export function validatePhone(phone: string): { valid: boolean; normalized: string; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, normalized: '', error: 'Fadlan geli lambarka taleefanka.' };
  }
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  // Validates common Somali phone formats (e.g. +25261xxxxxxx, 061xxxxxxx, 25261xxxxxxx, 61xxxxxxx) or international
  if (/^(\+?252|0)?[679]\d{7,8}$/.test(clean) || /^\+?\d{8,15}$/.test(clean)) {
    let normalized = clean;
    if (normalized.startsWith('0')) {
      normalized = '+252' + normalized.slice(1);
    } else if (!normalized.startsWith('+')) {
      normalized = normalized.startsWith('252') ? '+' + normalized : '+252' + normalized;
    }
    return { valid: true, normalized };
  }
  return { valid: false, normalized: clean, error: 'Lambarka taleefanka ma saxna (tusaale: 061xxxxxxx ama +25261xxxxxxx).' };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 6) {
    return { valid: false, error: 'Furaha sirta ah waa inuu ugu yaraan ka koobnaadaa 6 xaraf.' };
  }
  return { valid: true };
}

export function validateReportSubmission(data: {
  name?: string;
  age?: number | string;
  location?: string;
  lastSeen?: string;
  phone?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Fadlan geli magaca oo buuxa ee qofka maqan.';
  }

  if (!data.location || data.location.trim().length < 2) {
    errors.location = 'Fadlan geli goobtii ama degmadii ugu dambeysay.';
  }

  if (!data.lastSeen || data.lastSeen.trim().length < 2) {
    errors.lastSeen = 'Fadlan geli taariikhda ama waqtiga ugu dambeysay.';
  }

  if (data.phone) {
    const phoneCheck = validatePhone(data.phone);
    if (!phoneCheck.valid) {
      errors.phone = phoneCheck.error || 'Lambarka taleefanka ma saxna.';
    }
  }

  if (data.age !== undefined && data.age !== null && data.age !== '') {
    const num = Number(data.age);
    if (isNaN(num) || num < 0 || num > 130) {
      errors.age = "Fadlan geli da' sax ah (0-130).";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
