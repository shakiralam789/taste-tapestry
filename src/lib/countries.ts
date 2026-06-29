// ISO 3166-1 alpha-2 country codes. Names are derived at runtime via
// Intl.DisplayNames so we don't hand-maintain (and mistype) ~250 names.

export const COUNTRY_CODES: string[] = [
  "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW",
  "AU", "AT", "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT",
  "BO", "BA", "BW", "BR", "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA",
  "KY", "CF", "TD", "CL", "CN", "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR",
  "CU", "CW", "CY", "CZ", "DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER",
  "EE", "SZ", "ET", "FJ", "FI", "FR", "GF", "PF", "GA", "GM", "GE", "DE", "GH",
  "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HN",
  "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP",
  "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS",
  "LR", "LY", "LI", "LT", "LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH",
  "MQ", "MR", "MU", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM",
  "NA", "NR", "NP", "NL", "NC", "NZ", "NI", "NE", "NG", "NU", "MK", "NO", "OM",
  "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PL", "PT", "PR", "QA", "RE",
  "RO", "RU", "RW", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK",
  "SI", "SB", "SO", "ZA", "SS", "ES", "LK", "SD", "SR", "SE", "CH", "SY", "TW",
  "TJ", "TZ", "TH", "TL", "TG", "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG",
  "UA", "AE", "GB", "US", "UY", "UZ", "VU", "VA", "VE", "VN", "YE", "ZM", "ZW",
];

/** Converts a 2-letter country code into its flag emoji using regional indicators. */
export function codeToFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return "";
  const OFFSET = 0x1f1e6 - 0x41; // regional indicator 'A' minus ASCII 'A'
  return String.fromCodePoint(
    upper.charCodeAt(0) + OFFSET,
    upper.charCodeAt(1) + OFFSET,
  );
}

let regionNames: Intl.DisplayNames | null = null;
function getRegionNames(): Intl.DisplayNames | null {
  if (regionNames) return regionNames;
  try {
    regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    regionNames = null;
  }
  return regionNames;
}

/** Human-readable country name for a code (falls back to the code itself). */
export function countryName(code: string): string {
  if (!code) return "";
  const dn = getRegionNames();
  return dn?.of(code.toUpperCase()) ?? code.toUpperCase();
}

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

/** All countries as { code, name, flag }, sorted alphabetically by name. */
export const COUNTRIES: CountryOption[] = COUNTRY_CODES.map((code) => ({
  code,
  name: countryName(code),
  flag: codeToFlag(code),
})).sort((a, b) => a.name.localeCompare(b.name));

/** Display helper: "🇯🇵 Japan" for a code, or "" if unknown/empty. */
export function countryLabel(code: string | null | undefined): string {
  if (!code) return "";
  return `${codeToFlag(code)} ${countryName(code)}`.trim();
}

/**
 * Best-effort guess of the user's country from the browser locale,
 * used only to prefill the picker (never as the source of truth).
 * Returns a known ISO code or null.
 */
export function guessCountryCode(): string | null {
  if (typeof navigator === "undefined") return null;
  const langs = [navigator.language, ...(navigator.languages ?? [])];
  for (const lang of langs) {
    if (!lang) continue;
    try {
      const region = new Intl.Locale(lang).maximize().region;
      if (region && COUNTRY_CODES.includes(region)) return region;
    } catch {
      // ignore malformed locale strings
    }
  }
  return null;
}

/**
 * Detects the user's country from their IP via a keyless geolocation service,
 * falling back to the browser locale. Used only to prefill the picker — the
 * user can always change it. Returns a known ISO code or null.
 */
export async function detectCountryCode(
  timeoutMs = 3500,
): Promise<string | null> {
  if (typeof fetch !== "undefined") {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch("https://ipapi.co/country/", {
        signal: controller.signal,
      });
      if (res.ok) {
        const code = (await res.text()).trim().toUpperCase();
        if (COUNTRY_CODES.includes(code)) return code;
      }
    } catch {
      // network/abort errors fall through to the locale guess
    } finally {
      clearTimeout(timer);
    }
  }
  return guessCountryCode();
}
