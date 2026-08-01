// ============================================================
// Resend Email Client — Singleton
// ============================================================
// Centralized Resend instance for all transactional emails.
// Set RESEND_API_KEY in your .env to enable.
//
// NOTE: In development without a key, emails are logged to console.
// ============================================================

import { Resend, type Tag } from "resend";

let _resend: Resend | null = null;

const DEFAULT_FROM_ADDRESS =
  "TradeFeed <notifications@tradefeed.co.za>";
const MAX_BATCH_SIZE = 100;
const MAX_IDEMPOTENCY_KEY_LENGTH = 256;
const MAX_SUBJECT_LENGTH = 998;
const MAX_HEADER_VALUE_LENGTH = 998;
const MAX_ADDRESS_FIELD_LENGTH = 320;
const MAX_TOPIC_ID_LENGTH = 256;
const SIMPLE_EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const TAG_FIELD_PATTERN = /^[A-Za-z0-9_-]+$/;
const SAFE_IDEMPOTENCY_KEY_PATTERN = /^[\x21-\x7e]+$/;
const UNSAFE_INLINE_CONTROL_PATTERN =
  /[\u0000-\u001f\u007f]/;

export interface BatchEmailMessage {
  /**
   * Exactly one recipient. One message per recipient prevents accidental
   * disclosure through a shared To header.
   */
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string | string[];
  headers?: Record<string, string>;
  tags?: Tag[];
  topicId?: string;
}

export interface SendEmailBatchRequestOptions {
  idempotencyKey: string;
}

export type SendEmailBatchResult =
  | {
      success: true;
      fallback: false;
      /** Resend IDs in the same order as the input messages. */
      ids: string[];
    }
  | {
      success: true;
      fallback: true;
      /** Empty because development log-only mode did not contact Resend. */
      ids: [];
    }
  | {
      success: false;
      fallback: false;
      ids: [];
      error: Error;
    };

interface PreparedBatchEmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from: string;
  replyTo?: string | string[];
  headers?: Record<string, string>;
  tags?: Tag[];
  topicId?: string;
}

class EmailBatchValidationError extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = "EmailBatchValidationError";
  }
}

function validateInlineField(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw new EmailBatchValidationError(
      `${fieldName} must be a string.`,
    );
  }

  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > maxLength ||
    UNSAFE_INLINE_CONTROL_PATTERN.test(normalized)
  ) {
    throw new EmailBatchValidationError(
      `${fieldName} is empty, too long, or contains unsafe characters.`,
    );
  }

  return normalized;
}

function validateRecipient(value: unknown, fieldName: string): string {
  const email = validateInlineField(
    value,
    fieldName,
    MAX_ADDRESS_FIELD_LENGTH,
  );

  if (!SIMPLE_EMAIL_PATTERN.test(email)) {
    throw new EmailBatchValidationError(
      `${fieldName} must contain one valid email address.`,
    );
  }

  return email;
}

function validateReplyTo(
  value: BatchEmailMessage["replyTo"],
  fieldName: string,
): string | string[] | undefined {
  if (value === undefined) return undefined;

  if (typeof value === "string") {
    return validateRecipient(value, fieldName);
  }

  if (!Array.isArray(value) || value.length === 0) {
    throw new EmailBatchValidationError(
      `${fieldName} must contain at least one email address.`,
    );
  }

  return value.map((email, index) =>
    validateRecipient(email, `${fieldName}[${index}]`),
  );
}

function validateHeaders(
  value: BatchEmailMessage["headers"],
  fieldName: string,
): Record<string, string> | undefined {
  if (value === undefined) return undefined;
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new EmailBatchValidationError(
      `${fieldName} must be a header record.`,
    );
  }

  const headers: Record<string, string> = {};
  for (const [name, rawValue] of Object.entries(value)) {
    if (!HEADER_NAME_PATTERN.test(name)) {
      throw new EmailBatchValidationError(
        `${fieldName} contains an invalid header name.`,
      );
    }

    headers[name] = validateInlineField(
      rawValue,
      `${fieldName}.${name}`,
      MAX_HEADER_VALUE_LENGTH,
    );
  }

  return headers;
}

function validateTags(
  value: BatchEmailMessage["tags"],
  fieldName: string,
): Tag[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new EmailBatchValidationError(
      `${fieldName} must be an array.`,
    );
  }

  return value.map((tag, index) => {
    const name = validateInlineField(
      tag?.name,
      `${fieldName}[${index}].name`,
      256,
    );
    const tagValue = validateInlineField(
      tag?.value,
      `${fieldName}[${index}].value`,
      256,
    );

    if (
      !TAG_FIELD_PATTERN.test(name) ||
      !TAG_FIELD_PATTERN.test(tagValue)
    ) {
      throw new EmailBatchValidationError(
        `${fieldName}[${index}] contains unsupported characters.`,
      );
    }

    return { name, value: tagValue };
  });
}

function prepareEmailBatch(
  messages: readonly BatchEmailMessage[],
  requestOptions: SendEmailBatchRequestOptions,
): {
  messages: PreparedBatchEmailMessage[];
  idempotencyKey: string;
} {
  if (!Array.isArray(messages)) {
    throw new EmailBatchValidationError(
      "Batch messages must be an array.",
    );
  }
  if (messages.length < 1 || messages.length > MAX_BATCH_SIZE) {
    throw new EmailBatchValidationError(
      `Email batches must contain between 1 and ${MAX_BATCH_SIZE} messages.`,
    );
  }
  if (
    requestOptions === null ||
    typeof requestOptions !== "object"
  ) {
    throw new EmailBatchValidationError(
      "Batch request options are required.",
    );
  }

  const idempotencyKey = validateInlineField(
    requestOptions.idempotencyKey,
    "idempotencyKey",
    MAX_IDEMPOTENCY_KEY_LENGTH,
  );
  if (!SAFE_IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    throw new EmailBatchValidationError(
      "idempotencyKey contains unsupported characters.",
    );
  }

  const preparedMessages = messages.map((message, index) => {
    if (
      message === null ||
      typeof message !== "object" ||
      Array.isArray(message)
    ) {
      throw new EmailBatchValidationError(
        `messages[${index}] must be an email message object.`,
      );
    }

    if (typeof message.html !== "string" || message.html.length === 0) {
      throw new EmailBatchValidationError(
        `messages[${index}].html is required.`,
      );
    }
    if (
      message.text !== undefined &&
      (typeof message.text !== "string" || message.text.length === 0)
    ) {
      throw new EmailBatchValidationError(
        `messages[${index}].text must be a non-empty string when provided.`,
      );
    }

    const prepared: PreparedBatchEmailMessage = {
      to: validateRecipient(
        message.to,
        `messages[${index}].to`,
      ),
      subject: validateInlineField(
        message.subject,
        `messages[${index}].subject`,
        MAX_SUBJECT_LENGTH,
      ),
      html: message.html,
      from:
        message.from === undefined
          ? DEFAULT_FROM_ADDRESS
          : validateInlineField(
              message.from,
              `messages[${index}].from`,
              MAX_ADDRESS_FIELD_LENGTH,
            ),
    };

    if (message.text !== undefined) prepared.text = message.text;

    const replyTo = validateReplyTo(
      message.replyTo,
      `messages[${index}].replyTo`,
    );
    if (replyTo !== undefined) prepared.replyTo = replyTo;

    const headers = validateHeaders(
      message.headers,
      `messages[${index}].headers`,
    );
    if (headers !== undefined) prepared.headers = headers;

    const tags = validateTags(
      message.tags,
      `messages[${index}].tags`,
    );
    if (tags !== undefined) prepared.tags = tags;

    if (message.topicId !== undefined) {
      prepared.topicId = validateInlineField(
        message.topicId,
        `messages[${index}].topicId`,
        MAX_TOPIC_ID_LENGTH,
      );
    }

    return prepared;
  });

  return { messages: preparedMessages, idempotencyKey };
}

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — emails will be logged only.");
    return null;
  }
  if (!_resend) {
    _resend = new Resend(key);
  }
  return _resend;
}

/**
 * Send an email via Resend. Falls back to console.log in dev/no-key mode.
 */
export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string | string[];
  headers?: Record<string, string>;
  tags?: Tag[];
  topicId?: string;
  idempotencyKey?: string;
}) {
  const resend = getResend();
  const from = options.from ?? "TradeFeed <notifications@tradefeed.co.za>";

  if (!resend) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[email] Delivery unavailable because RESEND_API_KEY is not configured.",
      );
      return {
        success: false,
        error: new Error("Email delivery is not configured."),
      };
    }

    console.log("[email] Would send:", {
      from,
      to: options.to,
      subject: options.subject,
      htmlLength: options.html.length,
    });
    return { success: true, fallback: true };
  }

  try {
    const result = await resend.emails.send({
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      ...(options.text ? { text: options.text } : {}),
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
      ...(options.headers ? { headers: options.headers } : {}),
      ...(options.tags ? { tags: options.tags } : {}),
      ...(options.topicId ? { topicId: options.topicId } : {}),
    }, options.idempotencyKey
      ? { idempotencyKey: options.idempotencyKey }
      : undefined);

    if (result.error) {
      console.error("[email] Resend error:", result.error);
      return { success: false, error: result.error };
    }

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("[email] Failed to send:", error);
    return { success: false, error };
  }
}

/**
 * Send 1–100 individualized messages through Resend's strict batch endpoint.
 *
 * The batch-level idempotency key makes a retry of the same complete batch
 * safe. Callers must use a different stable key when the message set changes.
 * Development without a provider key remains log-only; production fails
 * closed and never reports a send as successful.
 */
export async function sendEmailBatch(
  options: readonly BatchEmailMessage[],
  requestOptions: SendEmailBatchRequestOptions,
): Promise<SendEmailBatchResult> {
  let prepared: ReturnType<typeof prepareEmailBatch>;
  try {
    prepared = prepareEmailBatch(options, requestOptions);
  } catch (error) {
    return {
      success: false,
      fallback: false,
      ids: [],
      error:
        error instanceof Error
          ? error
          : new EmailBatchValidationError(
              "Email batch validation failed.",
            ),
    };
  }

  const hasProviderKey =
    typeof process.env.RESEND_API_KEY === "string" &&
    process.env.RESEND_API_KEY.trim().length > 0;

  if (!hasProviderKey) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[email] Batch delivery unavailable because RESEND_API_KEY is not configured.",
      );
      return {
        success: false,
        fallback: false,
        ids: [],
        error: new Error("Email batch delivery is not configured."),
      };
    }

    console.log("[email] Would send batch:", {
      messageCount: prepared.messages.length,
    });
    return {
      success: true,
      fallback: true,
      ids: [],
    };
  }

  const resend = getResend();
  if (!resend) {
    // Defensive: the provider key check above and getResend() should agree.
    return {
      success: false,
      fallback: false,
      ids: [],
      error: new Error("Email batch delivery is unavailable."),
    };
  }

  const payload = prepared.messages.map((message) => ({
    from: message.from,
    to: [message.to],
    subject: message.subject,
    html: message.html,
    ...(message.text !== undefined ? { text: message.text } : {}),
    ...(message.replyTo !== undefined
      ? { replyTo: message.replyTo }
      : {}),
    ...(message.headers !== undefined
      ? { headers: message.headers }
      : {}),
    ...(message.tags !== undefined ? { tags: message.tags } : {}),
    ...(message.topicId !== undefined
      ? { topicId: message.topicId }
      : {}),
  }));

  try {
    const result = await resend.batch.send(payload, {
      idempotencyKey: prepared.idempotencyKey,
      batchValidation: "strict",
    });

    if (result.error) {
      console.error(
        `[email] Resend batch rejected (${result.error.name}).`,
      );
      return {
        success: false,
        fallback: false,
        ids: [],
        error: new Error(
          `Email provider rejected the batch (${result.error.name}).`,
        ),
      };
    }

    const providerItems = result.data?.data;
    if (
      !Array.isArray(providerItems) ||
      providerItems.length !== prepared.messages.length ||
      providerItems.some(
        (item) =>
          item === null ||
          typeof item !== "object" ||
          typeof item.id !== "string" ||
          item.id.length === 0,
      )
    ) {
      console.error(
        "[email] Resend batch returned an incomplete response.",
      );
      return {
        success: false,
        fallback: false,
        ids: [],
        error: new Error(
          "Email provider returned an incomplete batch response.",
        ),
      };
    }

    return {
      success: true,
      fallback: false,
      ids: providerItems.map(({ id }) => id),
    };
  } catch {
    // Do not log message payloads, recipients, provider diagnostics, or
    // idempotency keys. Provider exceptions can contain request details.
    console.error("[email] Resend batch request failed.");
    return {
      success: false,
      fallback: false,
      ids: [],
      error: new Error("Email batch delivery failed."),
    };
  }
}
