/** Minimum age required to create an account. Mirrors the backend gate. */
export const MIN_SIGNUP_AGE = 13;

/**
 * Computes age in whole years from a date of birth (Date or "YYYY-MM-DD").
 * Returns null when the input is missing or unparseable.
 */
export function ageFromDateOfBirth(
  dateOfBirth: string | Date | null | undefined,
): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

/** The latest date of birth (YYYY-MM-DD) that satisfies the minimum age, for input max attrs. */
export function maxDateOfBirthForMinAge(minAge: number = MIN_SIGNUP_AGE): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - minAge);
  return d.toISOString().slice(0, 10);
}
