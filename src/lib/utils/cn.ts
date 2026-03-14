/**
 * lib/utils/cn.ts
 * Class name merger utility (lightweight clsx replacement).
 */

type ClassValue = string | boolean | null | undefined | ClassValue[]

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat(Infinity as 10)
    .filter((c): c is string => typeof c === 'string' && c.length > 0)
    .join(' ')
}
