export function validateSecondAdminSelection(input: {
  primaryAdminUserId: number | null | undefined;
  secondAdminUserId: number | null | undefined;
}) {
  if (!input.secondAdminUserId) {
    return "Select the second administrator from the existing Paeds Resus accounts.";
  }
  if (
    input.primaryAdminUserId &&
    input.secondAdminUserId === input.primaryAdminUserId
  ) {
    return "Select a different Paeds Resus account for the second administrator.";
  }
  return null;
}
