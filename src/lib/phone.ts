import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
  type CountryCode,
  type MetadataJson,
} from "libphonenumber-js/core";
import type { Examples } from "libphonenumber-js";
import rawExamples from "libphonenumber-js/mobile/examples";
import rawMetadata from "libphonenumber-js/metadata.max.json";

function asMetadata(value: unknown): MetadataJson {
  if (value && typeof value === "object" && "countries" in value) {
    return value as MetadataJson;
  }
  if (value && typeof value === "object" && "default" in value) {
    return asMetadata((value as { default: unknown }).default);
  }
  throw new Error("libphonenumber metadata failed to load");
}

const metadata = asMetadata(rawMetadata);

function asExamples(value: unknown): Examples {
  if (value && typeof value === "object" && "AE" in value) {
    return value as Examples;
  }
  if (value && typeof value === "object" && "default" in value) {
    return asExamples((value as { default: unknown }).default);
  }
  return {} as Examples;
}

const mobileExamples = asExamples(rawExamples);

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** UAE first, then the markets we see most, then the rest A–Z. */
const COMMON_ISO = ["SA", "IN", "PK", "GB", "FR", "RU", "EG", "LB", "PH", "US"] as const;

export type PhoneOk = {
  ok: true;
  e164: string;
  country: string;
  type: string;
};

export type PhoneFail = {
  ok: false;
  reason: string;
};

export type CountryOption = {
  iso2: string;
  name: string;
  dialCode: string;
  flag: string;
};

export function countryName(iso2: string): string {
  const code = iso2.toUpperCase();
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function flagEmoji(iso2: string): string {
  const code = iso2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(
    127397 + code.charCodeAt(0),
    127397 + code.charCodeAt(1)
  );
}

function toCountry(iso2: string): CountryOption | null {
  try {
    const dial = getCountryCallingCode(iso2 as CountryCode, metadata);
    return {
      iso2,
      name: countryName(iso2),
      dialCode: `+${dial}`,
      flag: flagEmoji(iso2),
    };
  } catch {
    return null;
  }
}

function buildCountries(): CountryOption[] {
  const byIso = new Map<string, CountryOption>();
  for (const iso of getCountries(metadata)) {
    const entry = toCountry(iso);
    if (entry) byIso.set(iso, entry);
  }
  const uae = byIso.get("AE");
  const common = COMMON_ISO.map((iso) => byIso.get(iso)).filter(
    (entry): entry is CountryOption => Boolean(entry)
  );
  const pinned = new Set<string>(["AE", ...COMMON_ISO]);
  const rest = Array.from(byIso.values())
    .filter((entry) => !pinned.has(entry.iso2))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
  return [...(uae ? [uae] : []), ...common, ...rest];
}

export const COUNTRIES: CountryOption[] = buildCountries();

function invalidFor(countryIso2: string): string {
  return `Please enter a valid ${countryName(countryIso2)} mobile number.`;
}

/**
 * National (or full international) input for one country.
 * Valid only when libphonenumber marks it valid for that country and the
 * type is MOBILE or FIXED_LINE_OR_MOBILE. A leading trunk 0 is accepted.
 */
export function validatePhone(
  nationalInput: string,
  countryIso2: string
): PhoneOk | PhoneFail {
  const trimmed = String(nationalInput ?? "").trim();
  if (!trimmed) return { ok: false, reason: "Phone number is required." };

  const iso = countryIso2.toUpperCase();
  let parsed: ReturnType<typeof parsePhoneNumberFromString>;
  try {
    parsed = parsePhoneNumberFromString(trimmed, iso as CountryCode, metadata);
  } catch {
    return { ok: false, reason: invalidFor(iso) };
  }
  if (!parsed || !parsed.isValid() || parsed.country !== iso) {
    return { ok: false, reason: invalidFor(iso) };
  }

  const type = parsed.getType();
  if (type !== "MOBILE" && type !== "FIXED_LINE_OR_MOBILE") {
    return { ok: false, reason: "Please enter a mobile number." };
  }

  return {
    ok: true,
    e164: parsed.number,
    country: parsed.country ?? iso,
    type,
  };
}

export function formatForDisplay(e164: string): string {
  const parsed = parsePhoneNumberFromString(String(e164 ?? "").trim(), metadata);
  if (!parsed) return String(e164 ?? "");
  return parsed.formatInternational();
}

/**
 * National example for the number field, without the trunk prefix
 * (the user already sees the dial code beside it). Empty when the
 * country has no mobile example.
 */
export function nationalPlaceholder(iso2: string): string {
  const iso = iso2.toUpperCase() as CountryCode;
  let example: ReturnType<typeof getExampleNumber>;
  try {
    example = getExampleNumber(iso, mobileExamples, metadata);
  } catch {
    return "";
  }
  if (!example) return "";

  const formatted = example.formatNational();
  const national = String(example.nationalNumber);
  const digits = formatted.replace(/\D/g, "");
  if (digits.endsWith(national) && digits.length > national.length) {
    const prefix = digits.slice(0, digits.length - national.length);
    if (formatted.startsWith(prefix)) {
      return formatted.slice(prefix.length).trim();
    }
  }
  return formatted;
}
