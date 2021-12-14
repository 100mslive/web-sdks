/**
 * Check only for presence(not truthy) of a value.
 * Use in places where 0, false need to be considered valid.
 */
export function isPresent(value: any) {
  return value !== undefined && value !== null;
}
