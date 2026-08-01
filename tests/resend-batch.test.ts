import assert from "node:assert/strict";
import test from "node:test";

import {
  sendEmailBatch,
  type BatchEmailMessage,
} from "../lib/email/resend";

const IDEMPOTENCY_KEY = "campaign-2026-08-batch-0001";

function messages(): BatchEmailMessage[] {
  return [
    {
      to: "first@example.test",
      subject: "First account reminder",
      html: "<p>First</p>",
      text: "First",
      headers: {
        "List-Unsubscribe":
          "<https://tradefeed.co.za/email/unsubscribe?token=first>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      tags: [{ name: "campaign", value: "account_reminder" }],
    },
    {
      to: "second@example.test",
      subject: "Second account reminder",
      html: "<p>Second</p>",
      text: "Second",
      replyTo: "support@tradefeed.co.za",
      topicId: "seller-reminders",
    },
  ];
}

test(
  "sendEmailBatch validates, fails closed, and preserves provider order",
  { concurrency: false },
  async (t) => {
    const mutableEnvironment = process.env as Record<
      string,
      string | undefined
    >;
    const originalApiKey = process.env.RESEND_API_KEY;
    const originalNodeEnv = process.env.NODE_ENV;
    const originalFetch = globalThis.fetch;
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = () => undefined;
    console.error = () => undefined;
    console.warn = () => undefined;

    try {
      await t.test("rejects invalid batch boundaries and headers", async () => {
        const empty = await sendEmailBatch([], {
          idempotencyKey: IDEMPOTENCY_KEY,
        });
        assert.equal(empty.success, false);
        if (!empty.success) assert.match(empty.error.message, /between 1 and 100/);

        const oversized = await sendEmailBatch(
          Array.from({ length: 101 }, () => messages()[0]!),
          { idempotencyKey: IDEMPOTENCY_KEY },
        );
        assert.equal(oversized.success, false);

        const badSubject = messages();
        badSubject[0] = {
          ...badSubject[0]!,
          subject: "Reminder\r\nBcc: hidden@example.test",
        };
        const subjectResult = await sendEmailBatch(badSubject, {
          idempotencyKey: IDEMPOTENCY_KEY,
        });
        assert.equal(subjectResult.success, false);

        const badHeader = messages();
        badHeader[0] = {
          ...badHeader[0]!,
          headers: { "X-Campaign": "safe\r\nBcc: hidden@example.test" },
        };
        const headerResult = await sendEmailBatch(badHeader, {
          idempotencyKey: IDEMPOTENCY_KEY,
        });
        assert.equal(headerResult.success, false);

        const badKey = await sendEmailBatch(messages(), {
          idempotencyKey: "unsafe key with spaces",
        });
        assert.equal(badKey.success, false);
      });

      await t.test(
        "fails closed in production when RESEND_API_KEY is missing",
        async () => {
          delete process.env.RESEND_API_KEY;
          mutableEnvironment.NODE_ENV = "production";
          let fetchCalled = false;
          globalThis.fetch = (async () => {
            fetchCalled = true;
            throw new Error("Fetch must not run.");
          }) as typeof fetch;

          const result = await sendEmailBatch(messages(), {
            idempotencyKey: IDEMPOTENCY_KEY,
          });

          assert.equal(result.success, false);
          assert.equal(fetchCalled, false);
          if (!result.success) {
            assert.match(result.error.message, /not configured/);
          }
        },
      );

      await t.test(
        "keeps a clearly marked development log-only fallback",
        async () => {
          delete process.env.RESEND_API_KEY;
          mutableEnvironment.NODE_ENV = "development";
          let fetchCalled = false;
          globalThis.fetch = (async () => {
            fetchCalled = true;
            throw new Error("Fetch must not run.");
          }) as typeof fetch;

          const result = await sendEmailBatch(messages(), {
            idempotencyKey: IDEMPOTENCY_KEY,
          });

          assert.deepEqual(result, {
            success: true,
            fallback: true,
            ids: [],
          });
          assert.equal(fetchCalled, false);
        },
      );

      await t.test(
        "uses strict Resend batching and returns IDs in input order",
        async () => {
          process.env.RESEND_API_KEY = "re_test_batch_key";
          mutableEnvironment.NODE_ENV = "test";
          let capturedUrl = "";
          let capturedInit: RequestInit | undefined;

          globalThis.fetch = (async (
            input: string | URL | Request,
            init?: RequestInit,
          ) => {
            capturedUrl = String(input);
            capturedInit = init;
            return new Response(
              JSON.stringify({
                data: [
                  { id: "provider-first" },
                  { id: "provider-second" },
                ],
              }),
              {
                status: 200,
                headers: { "content-type": "application/json" },
              },
            );
          }) as typeof fetch;

          const result = await sendEmailBatch(messages(), {
            idempotencyKey: IDEMPOTENCY_KEY,
          });

          assert.deepEqual(result, {
            success: true,
            fallback: false,
            ids: ["provider-first", "provider-second"],
          });
          assert.equal(capturedUrl, "https://api.resend.com/emails/batch");
          assert.ok(capturedInit);

          const headers = new Headers(capturedInit.headers);
          assert.equal(
            headers.get("idempotency-key"),
            IDEMPOTENCY_KEY,
          );
          assert.equal(headers.get("x-batch-validation"), "strict");

          const payload = JSON.parse(String(capturedInit.body)) as Array<{
            to: string[];
            subject: string;
            reply_to?: string[];
            topic_id?: string;
          }>;
          assert.deepEqual(
            payload.map(({ to }) => to),
            [
              ["first@example.test"],
              ["second@example.test"],
            ],
          );
          assert.deepEqual(
            payload.map(({ subject }) => subject),
            ["First account reminder", "Second account reminder"],
          );
          assert.equal(payload[1]?.topic_id, "seller-reminders");
        },
      );

      await t.test(
        "treats provider errors and incomplete responses as failures",
        async () => {
          process.env.RESEND_API_KEY = "re_test_batch_key";
          mutableEnvironment.NODE_ENV = "test";

          globalThis.fetch = (async () =>
            new Response(
              JSON.stringify({
                name: "validation_error",
                message: "Rejected first@example.test",
                statusCode: 422,
              }),
              {
                status: 422,
                headers: { "content-type": "application/json" },
              },
            )) as typeof fetch;

          const rejected = await sendEmailBatch(messages(), {
            idempotencyKey: `${IDEMPOTENCY_KEY}-rejected`,
          });
          assert.equal(rejected.success, false);
          if (!rejected.success) {
            assert.deepEqual(rejected.ids, []);
            assert.match(rejected.error.message, /validation_error/);
            assert.doesNotMatch(
              rejected.error.message,
              /first@example\.test/,
            );
          }

          globalThis.fetch = (async () =>
            new Response(
              JSON.stringify({
                data: [{ id: "only-one-id" }],
              }),
              {
                status: 200,
                headers: { "content-type": "application/json" },
              },
            )) as typeof fetch;

          const incomplete = await sendEmailBatch(messages(), {
            idempotencyKey: `${IDEMPOTENCY_KEY}-incomplete`,
          });
          assert.equal(incomplete.success, false);
          if (!incomplete.success) {
            assert.deepEqual(incomplete.ids, []);
            assert.match(incomplete.error.message, /incomplete/);
          }
        },
      );
    } finally {
      if (originalApiKey === undefined) {
        delete process.env.RESEND_API_KEY;
      } else {
        process.env.RESEND_API_KEY = originalApiKey;
      }
      if (originalNodeEnv === undefined) {
        delete mutableEnvironment.NODE_ENV;
      } else {
        mutableEnvironment.NODE_ENV = originalNodeEnv;
      }
      globalThis.fetch = originalFetch;
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }
  },
);
