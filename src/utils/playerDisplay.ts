const LETTER_OR_NUMBER = /[\p{L}\p{N}]/u;

/**
 * استخراج حرفين آمنين لعرضهما داخل دائرة اللاعب.
 * يتعامل مع الأسماء العربية، الأسماء المركبة، والرموز التعبيرية التي
 * تلحق بأسماء البوتات (مثل «فهد 🤖») دون إنتاج نصف رمز تالف.
 */
export function getPlayerInitials(name?: string | null): string {
  const cleaned = (name || "").trim();
  if (!cleaned) return "؟";

  const words = cleaned.split(/\s+/).filter(Boolean);
  const meaningfulWords = words
    .map((word) => Array.from(word).filter((char) => LETTER_OR_NUMBER.test(char)))
    .filter((letters) => letters.length > 0);

  if (meaningfulWords.length >= 2) {
    return `${meaningfulWords[0][0]}${meaningfulWords[1][0]}`.toUpperCase();
  }

  if (meaningfulWords.length === 1) {
    return meaningfulWords[0].slice(0, 2).join("").toUpperCase();
  }

  return Array.from(cleaned)[0]?.toUpperCase() || "؟";
}

/** حرف واحد للعرضات المضغوطة جداً. */
export function getPlayerInitial(name?: string | null): string {
  return Array.from(getPlayerInitials(name))[0] || "؟";
}
