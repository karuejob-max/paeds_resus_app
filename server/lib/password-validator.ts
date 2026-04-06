/**
 * Password Validation & Strength Checker
 * 
 * Implements OWASP-compliant password requirements:
 * - Minimum 8 characters
 * - Mix of uppercase, lowercase, numbers, special characters
 * - No excessive repetition
 * - Prevents common patterns
 */

export interface PasswordValidationResult {
  valid: boolean;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
}

const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  MAX_CONSECUTIVE: 3,
};

/**
 * Validate password strength against security requirements
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Check length
  if (!password || password.length === 0) {
    errors.push('Password is required');
    return { valid: false, score: 0, errors, warnings };
  }

  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters`);
  } else {
    score += 20;
  }

  if (password.length > PASSWORD_REQUIREMENTS.MAX_LENGTH) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.MAX_LENGTH} characters`);
  }

  // Check character types
  if (PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  } else if (/[A-Z]/.test(password)) {
    score += 15;
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  } else if (/[a-z]/.test(password)) {
    score += 15;
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  } else if (/[0-9]/.test(password)) {
    score += 15;
  }

  if (PASSWORD_REQUIREMENTS.REQUIRE_SPECIAL) {
    const hasSpecial = new RegExp(`[${PASSWORD_REQUIREMENTS.SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password);
    if (!hasSpecial) {
      errors.push(`Password must contain at least one special character (${PASSWORD_REQUIREMENTS.SPECIAL_CHARS})`);
    } else {
      score += 20;
    }
  }

  // Check for excessive repetition
  const repetitionPattern = new RegExp(`(.)\\1{${PASSWORD_REQUIREMENTS.MAX_CONSECUTIVE},}`);
  if (repetitionPattern.test(password)) {
    errors.push(`Password cannot contain more than ${PASSWORD_REQUIREMENTS.MAX_CONSECUTIVE} consecutive identical characters`);
  } else {
    score += 15;
  }

  // Check for common patterns
  if (/^(123|234|345|456|567|678|789|890|abc|bcd|cde|def|qwerty|asdfgh|zxcvbn)/.test(password.toLowerCase())) {
    warnings.push('Password contains common sequential pattern');
    score -= 10;
  }

  // Check for keyboard patterns
  if (/^(qwerty|asdfgh|zxcvbn|qazwsx|12345|abcde)$/.test(password.toLowerCase())) {
    warnings.push('Password is too similar to keyboard layout');
    score -= 15;
  }

  // Ensure score doesn't go below 0 or above 100
  score = Math.max(0, Math.min(100, score));

  return {
    valid: errors.length === 0,
    score,
    errors,
    warnings,
  };
}

/**
 * Check if password matches a previously used password (for history)
 * Uses bcrypt comparison
 */
export async function compareWithPasswordHistory(
  newPassword: string,
  passwordHistoryHashes: string[]
): Promise<boolean> {
  // This would use bcrypt.compare() in actual implementation
  // For now, return false (no matches)
  // In production: for (const hash of passwordHistoryHashes) {
  //   if (await bcrypt.compare(newPassword, hash)) return true;
  // }
  return false;
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): string {
  if (score >= 80) return 'Very Strong';
  if (score >= 60) return 'Strong';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Weak';
  return 'Very Weak';
}

/**
 * Get password strength color (for UI)
 */
export function getPasswordStrengthColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'blue';
  if (score >= 40) return 'yellow';
  if (score >= 20) return 'orange';
  return 'red';
}
