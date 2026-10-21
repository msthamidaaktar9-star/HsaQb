/**
 * Converts English digits (0-9) to Bengali digits (০-৯).
 * Example: toBn(12) => "১২"
 * Example: toBn("100%") => "১০০%"
 */
const bnDigits: { [key: string]: string } = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export function toBn(input: number | string | null | undefined): string {
  if (input === null || input === undefined) {
    return '';
  }
  const str = String(input);
  return str.replace(/[0-9]/g, (digit) => bnDigits[digit] || digit);
}

export default toBn;
