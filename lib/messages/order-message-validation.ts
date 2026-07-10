import { z } from "zod";

export const orderMessageBodySchema = z
  .string()
  .trim()
  .min(1, "Write a message before sending.")
  .max(1500, "Messages can be up to 1,500 characters.")
  .refine(
    (value) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value),
    "The message contains unsupported characters.",
  );

export function parseOrderMessageBody(input: unknown) {
  return orderMessageBodySchema.safeParse(input);
}
