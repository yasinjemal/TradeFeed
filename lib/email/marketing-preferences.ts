import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";

export const MARKETING_EMAIL_HASH_VERSION = "v1" as const;
export const MARKETING_UNSUBSCRIBE_TOKEN_PREFIX = "tfmu" as const;
export const MARKETING_UNSUBSCRIBE_TOKEN_VERSION = "v1" as const;
export const MARKETING_FINGERPRINT_VERSION = "v1" as const;
export const MAX_MARKETING_CUSTOM_COPY_LENGTH = 1_000;
export const DEFAULT_MARKETING_INACTIVE_DAYS = 30;

const MIN_SECRET_BYTES = 32;
const EMAIL_HASH_CONTEXT =
  `tradefeed:marketing-email:${MARKETING_EMAIL_HASH_VERSION}\0`;
const UNSUBSCRIBE_SIGNATURE_CONTEXT =
  `tradefeed:marketing-unsubscribe:${MARKETING_UNSUBSCRIBE_TOKEN_VERSION}\0`;
const FINGERPRINT_CONTEXT =
  `tradefeed:marketing-fingerprint:${MARKETING_FINGERPRINT_VERSION}\0`;

export type MarketingEmailPreferenceStatus =
  | "OPTED_IN"
  | "OPTED_OUT"
  | "UNKNOWN";

export type MarketingCampaignSegment =
  | "NO_PRODUCTS"
  | "INACTIVE"
  | "ACTIVE";

export interface MarketingCampaignSegmentInput {
  productCount: number;
  lastProductAt: Date | null;
  now: Date;
  inactiveAfterDays?: number;
}

export interface CreateMarketingUnsubscribeTokenInput {
  email: string;
  secret: string;
  issuedAt: Date;
}

export interface VerifiedMarketingUnsubscribeToken {
  emailHash: string;
  issuedAt: Date;
  version: typeof MARKETING_UNSUBSCRIBE_TOKEN_VERSION;
}

export interface CampaignTemplateFingerprintInput {
  campaignKey: string;
  template: string;
}

function assertSecret(secret: string): void {
  if (Buffer.byteLength(secret, "utf8") < MIN_SECRET_BYTES) {
    throw new RangeError(
      `Marketing token secrets must contain at least ${MIN_SECRET_BYTES} bytes.`,
    );
  }
}

function assertValidDate(value: Date, fieldName: string): void {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new TypeError(`${fieldName} must be a valid Date.`);
  }
}

/**
 * Normalize the account email used as a marketing-preference identity.
 *
 * This intentionally does not apply provider-specific transformations such as
 * removing dots or plus-addressing. Those transformations could merge distinct
 * mailboxes. Clerk already validates account addresses; the checks here only
 * reject malformed identities before hashing.
 */
export function normalizeMarketingEmail(email: string): string {
  const normalized = email.normalize("NFKC").trim().toLowerCase();
  const atIndex = normalized.lastIndexOf("@");

  if (
    normalized.length === 0 ||
    normalized.length > 320 ||
    atIndex <= 0 ||
    atIndex === normalized.length - 1 ||
    normalized.includes(" ") ||
    normalized.includes("\t") ||
    normalized.includes("\n")
  ) {
    throw new TypeError("A valid email address is required.");
  }

  return normalized;
}

/**
 * Produce a stable, secret-scoped lookup key without storing the raw email.
 */
export function createMarketingEmailHash(
  email: string,
  secret: string,
): string {
  assertSecret(secret);

  return createHmac("sha256", secret)
    .update(EMAIL_HASH_CONTEXT, "utf8")
    .update(normalizeMarketingEmail(email), "utf8")
    .digest("hex");
}

/**
 * Create a durable unsubscribe token.
 *
 * Format:
 *   tfmu.v1.<issued-at-unix-seconds>.<email-hmac-hex>.<signature-base64url>
 *
 * The token contains only a secret-scoped HMAC of the normalized email. It
 * never contains the raw address. Unsubscribe tokens deliberately do not
 * expire, so an old campaign can always be opted out of.
 */
export function createMarketingUnsubscribeToken(
  input: CreateMarketingUnsubscribeTokenInput,
): string {
  assertSecret(input.secret);
  assertValidDate(input.issuedAt, "issuedAt");

  const issuedAtSeconds = Math.floor(input.issuedAt.getTime() / 1_000);
  const emailHash = createMarketingEmailHash(input.email, input.secret);
  const payload = [
    MARKETING_UNSUBSCRIBE_TOKEN_PREFIX,
    MARKETING_UNSUBSCRIBE_TOKEN_VERSION,
    String(issuedAtSeconds),
    emailHash,
  ].join(".");
  const signature = createHmac("sha256", input.secret)
    .update(UNSUBSCRIBE_SIGNATURE_CONTEXT, "utf8")
    .update(payload, "utf8")
    .digest("base64url");

  return `${payload}.${signature}`;
}

/**
 * Verify an unsubscribe token with a constant-time signature comparison.
 * Invalid or unsupported tokens return null and never expose partial claims.
 */
export function verifyMarketingUnsubscribeToken(
  token: string,
  secret: string,
): VerifiedMarketingUnsubscribeToken | null {
  assertSecret(secret);

  const parts = token.split(".");
  if (parts.length !== 5) return null;

  const [prefix, version, issuedAtPart, emailHash, providedSignature] =
    parts;
  if (
    prefix !== MARKETING_UNSUBSCRIBE_TOKEN_PREFIX ||
    version !== MARKETING_UNSUBSCRIBE_TOKEN_VERSION ||
    !/^(0|[1-9]\d*)$/.test(issuedAtPart ?? "") ||
    !/^[a-f0-9]{64}$/.test(emailHash ?? "") ||
    !/^[A-Za-z0-9_-]{43}$/.test(providedSignature ?? "")
  ) {
    return null;
  }

  const issuedAtSeconds = Number(issuedAtPart);
  if (
    !Number.isSafeInteger(issuedAtSeconds) ||
    issuedAtSeconds < 0 ||
    issuedAtSeconds > Math.floor(8.64e15 / 1_000)
  ) {
    return null;
  }

  const payload = parts.slice(0, 4).join(".");
  const expectedSignature = createHmac("sha256", secret)
    .update(UNSUBSCRIBE_SIGNATURE_CONTEXT, "utf8")
    .update(payload, "utf8")
    .digest();
  const providedSignatureBytes = Buffer.from(
    providedSignature as string,
    "base64url",
  );

  if (
    providedSignatureBytes.length !== expectedSignature.length ||
    !timingSafeEqual(providedSignatureBytes, expectedSignature)
  ) {
    return null;
  }

  return {
    emailHash: emailHash as string,
    issuedAt: new Date(issuedAtSeconds * 1_000),
    version: MARKETING_UNSUBSCRIBE_TOKEN_VERSION,
  };
}

/**
 * Fail closed: only an explicit opt-in is eligible for a marketing campaign.
 */
export function isMarketingEmailEligible(
  status: MarketingEmailPreferenceStatus | null | undefined,
): boolean {
  return status === "OPTED_IN";
}

/**
 * Select copy based on catalogue state, using a caller-supplied clock so the
 * result is deterministic in jobs, previews, and tests.
 */
export function selectMarketingCampaignSegment(
  input: MarketingCampaignSegmentInput,
): MarketingCampaignSegment {
  if (
    !Number.isSafeInteger(input.productCount) ||
    input.productCount < 0
  ) {
    throw new RangeError("productCount must be a non-negative integer.");
  }
  assertValidDate(input.now, "now");

  const inactiveAfterDays =
    input.inactiveAfterDays ?? DEFAULT_MARKETING_INACTIVE_DAYS;
  if (
    !Number.isSafeInteger(inactiveAfterDays) ||
    inactiveAfterDays < 1 ||
    inactiveAfterDays > 3_650
  ) {
    throw new RangeError(
      "inactiveAfterDays must be an integer between 1 and 3650.",
    );
  }

  if (input.productCount === 0) return "NO_PRODUCTS";
  if (input.lastProductAt === null) return "INACTIVE";

  assertValidDate(input.lastProductAt, "lastProductAt");
  const inactiveCutoff =
    input.now.getTime() - inactiveAfterDays * 24 * 60 * 60 * 1_000;

  return input.lastProductAt.getTime() <= inactiveCutoff
    ? "INACTIVE"
    : "ACTIVE";
}

/**
 * Normalize optional admin copy and reject oversized input instead of silently
 * truncating a campaign. The returned value remains plain text and must be
 * HTML-escaped by the template renderer.
 */
export function normalizeMarketingCustomCopy(
  customCopy: string | null | undefined,
): string | undefined {
  if (customCopy === null || customCopy === undefined) return undefined;

  const normalized = customCopy
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim();

  if (normalized.length === 0) return undefined;
  if (
    Array.from(normalized).length > MAX_MARKETING_CUSTOM_COPY_LENGTH
  ) {
    throw new RangeError(
      `Custom marketing copy cannot exceed ${MAX_MARKETING_CUSTOM_COPY_LENGTH} characters.`,
    );
  }

  return normalized;
}

function fingerprintField(value: string): string {
  const normalized = value.replace(/\r\n?/g, "\n");
  return `${Buffer.byteLength(normalized, "utf8")}:${normalized}`;
}

/**
 * Bind the campaign identity to its rendered template for send idempotency and
 * audit records. Length-prefixing prevents ambiguous field concatenation.
 */
export function createCampaignTemplateFingerprint(
  input: CampaignTemplateFingerprintInput,
): string {
  if (input.campaignKey.trim().length === 0) {
    throw new TypeError("campaignKey is required.");
  }
  if (input.template.length === 0) {
    throw new TypeError("template is required.");
  }

  const canonical = [
    FINGERPRINT_CONTEXT,
    fingerprintField(input.campaignKey),
    fingerprintField(input.template),
  ].join("\0");

  return createHash("sha256").update(canonical, "utf8").digest("hex");
}
