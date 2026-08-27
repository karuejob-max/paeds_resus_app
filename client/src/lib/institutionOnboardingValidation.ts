const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSecondAdminContact(input: {
  secondAdminName: string;
  secondAdminEmail: string;
  contactEmail: string;
}) {
  const name = input.secondAdminName.trim();
  const email = input.secondAdminEmail.trim();
  const primaryEmail = input.contactEmail.trim();

  if (!name || !email) {
    return "Add a second named administrator before creating the institution account. This person must be different from the primary contact.";
  }
  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address for the second administrator.";
  }
  if (email.toLowerCase() === primaryEmail.toLowerCase()) {
    return "Use a different email address for the second administrator so the institution can recover access if one administrator is unavailable.";
  }
  return null;
}
