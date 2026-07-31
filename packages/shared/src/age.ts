/** Minimum age to use Attune (Apple / dating compliance). */
export const MIN_AGE = 18;

/** Earliest plausible birth year we accept. */
export const MIN_BIRTH_YEAR = 1940;

/** Latest birth year that still means the user is at least MIN_AGE today (UTC). */
export function maxBirthYearForMinAge(now = new Date(), minAge = MIN_AGE): number {
  return now.getUTCFullYear() - minAge;
}

export function isAtLeastAge(birthYear: number, minAge = MIN_AGE, now = new Date()): boolean {
  if (!Number.isInteger(birthYear)) return false;
  if (birthYear < MIN_BIRTH_YEAR) return false;
  return birthYear <= maxBirthYearForMinAge(now, minAge);
}
