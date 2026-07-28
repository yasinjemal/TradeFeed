import * as path from "node:path";
import {
  ApiCheck,
  AssertionBuilder,
  BrowserCheck,
  Frequency,
} from "checkly/constructs";

const productionBaseUrl = (
  process.env.CHECKLY_PRODUCTION_BASE_URL ?? "https://tradefeed.co.za"
).replace(/\/+$/, "");

const accountVariable = (name: string) => `{{${name}}}`;

new ApiCheck("tradefeed-production-health", {
  name: "TradeFeed production API health",
  description:
    "Checks the public health contract and its database connectivity signal from Frankfurt, a Hobby-plan location.",
  activated: true,
  frequency: Frequency.EVERY_5M,
  locations: ["eu-central-1"],
  tags: ["tradefeed", "production", "api", "read-only"],
  degradedResponseTime: 5_000,
  maxResponseTime: 15_000,
  request: {
    method: "GET",
    url: `${productionBaseUrl}/api/health`,
    followRedirects: true,
    headers: [
      {
        key: "User-Agent",
        value: "TradeFeed-Checkly/1.0 (+https://www.checklyhq.com/)",
      },
      {
        key: "x-tradefeed-synthetic",
        value: "checkly",
      },
    ],
    queryParameters: [
      {
        key: "synthetic",
        value: "checkly",
      },
    ],
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.headers("content-type").contains("application/json"),
      AssertionBuilder.jsonBody("$.status").equals("ok"),
      AssertionBuilder.jsonBody("$.db.status").equals("connected"),
    ],
  },
});

new BrowserCheck("tradefeed-production-buyer-journey", {
  name: "TradeFeed production buyer journey",
  description:
    "Marketplace -> catalogue -> product -> local cart -> checkout-control validation. It never submits checkout or creates an order.",
  activated: true,
  frequency: Frequency.EVERY_1H,
  locations: ["eu-central-1"],
  tags: ["tradefeed", "production", "browser", "buyer", "read-only"],
  environmentVariables: [
    {
      key: "CHECKLY_BUYER_BASE_URL",
      value: productionBaseUrl,
    },
    {
      key: "CHECKLY_BUYER_SHOP_SLUG",
      value: accountVariable("CHECKLY_BUYER_SHOP_SLUG"),
    },
    {
      key: "CHECKLY_BUYER_PRODUCT_REF",
      value: accountVariable("CHECKLY_BUYER_PRODUCT_REF"),
    },
    {
      key: "CHECKLY_BUYER_MARKETPLACE_SEARCH",
      value: accountVariable("CHECKLY_BUYER_MARKETPLACE_SEARCH"),
    },
  ],
  code: {
    entrypoint: path.join(__dirname, "buyer.spec.ts"),
  },
});

new BrowserCheck("tradefeed-staging-seller-journey", {
  name: "TradeFeed staging seller journey",
  description:
    "Authenticates a dedicated synthetic seller, publishes and edits a product, verifies it publicly, then deletes it.",
  activated: true,
  frequency: Frequency.EVERY_24H,
  locations: ["eu-central-1"],
  tags: ["tradefeed", "staging", "browser", "seller", "mutation"],
  environmentVariables: [
    {
      key: "CHECKLY_SELLER_BASE_URL",
      value: accountVariable("CHECKLY_SELLER_BASE_URL"),
    },
    {
      key: "CHECKLY_SELLER_EXPECTED_HOST",
      value: accountVariable("CHECKLY_SELLER_EXPECTED_HOST"),
    },
    {
      key: "CHECKLY_SELLER_SHOP_SLUG",
      value: accountVariable("CHECKLY_SELLER_SHOP_SLUG"),
    },
    {
      key: "CHECKLY_SELLER_EMAIL",
      value: accountVariable("CHECKLY_SELLER_EMAIL"),
      secret: true,
    },
    {
      key: "CHECKLY_SELLER_MUTATION_ACK",
      value: accountVariable("CHECKLY_SELLER_MUTATION_ACK"),
      secret: true,
    },
    {
      key: "CHECKLY_CLERK_FRONTEND_API_URL",
      value: accountVariable("CHECKLY_CLERK_FRONTEND_API_URL"),
    },
    {
      key: "CLERK_SECRET_KEY",
      value: accountVariable("CHECKLY_CLERK_SECRET_KEY"),
      secret: true,
    },
  ],
  code: {
    entrypoint: path.join(__dirname, "seller.spec.ts"),
  },
});
