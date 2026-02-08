export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateHandle(handle: string): {
  isValid: boolean;
  error?: string;
} {
  if (handle.length < 3) {
    return { isValid: false, error: 'Handle must be at least 3 characters long' };
  }

  if (handle.length > 20) {
    return { isValid: false, error: 'Handle must be no more than 20 characters long' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
    return {
      isValid: false,
      error: 'Handle can only contain letters, numbers, and underscores',
    };
  }

  return { isValid: true };
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
