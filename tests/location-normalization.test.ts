import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeCityName,
  normalizeProvinceName,
  provinceForCity,
} from "@/lib/location/south-africa";
import {
  buildGeoapifyAutocompleteUrl,
  parseGeoapifySuggestions,
} from "@/lib/location/geoapify";
import { shopSettingsSchema } from "@/lib/validation/shop-settings";

test("normalizes legacy city names and province aliases", () => {
  assert.equal(normalizeCityName(" port elizabeth "), "Gqeberha");
  assert.equal(normalizeCityName("nelspruit"), "Mbombela");
  assert.equal(normalizeProvinceName("KZN"), "KwaZulu-Natal");
  assert.equal(provinceForCity("queenstown"), "Eastern Cape");
});

test("normalizes unknown towns without rejecting manual entry", () => {
  assert.equal(normalizeCityName("  bela-bela  "), "Bela-Bela");
  assert.equal(normalizeProvinceName("Atlantis"), null);
});

test("builds a South Africa-restricted Geoapify request", () => {
  const url = buildGeoapifyAutocompleteUrl("62 Jeppe Street", "secret-key");
  assert.equal(url.origin, "https://api.geoapify.com");
  assert.equal(url.searchParams.get("filter"), "countrycode:za");
  assert.equal(url.searchParams.get("bias"), "countrycode:za");
  assert.equal(url.searchParams.get("apiKey"), "secret-key");
});

test("parses and allowlists valid South African suggestions", () => {
  const suggestions = parseGeoapifySuggestions({
    results: [
      {
        place_id: "one",
        formatted: "62 Jeppe Street, Johannesburg, South Africa",
        address_line1: "62 Jeppe Street",
        city: "johannesburg",
        state: "gauteng",
        postcode: "2001",
        lat: -26.2041,
        lon: 28.0473,
        country_code: "za",
      },
      {
        place_id: "outside",
        formatted: "London",
        city: "London",
        state: "England",
        lat: 51.5,
        lon: -0.1,
        country_code: "gb",
      },
    ],
  });

  assert.deepEqual(suggestions, [
    {
      id: "one",
      label: "62 Jeppe Street, Johannesburg, South Africa",
      address: "62 Jeppe Street",
      city: "Johannesburg",
      province: "Gauteng",
      postalCode: "2001",
      latitude: -26.2041,
      longitude: 28.0473,
    },
  ]);
});

test("drops incomplete and unknown-province provider results", () => {
  assert.deepEqual(
    parseGeoapifySuggestions({
      results: [
        { country_code: "za", city: "Unknown", state: "Unknown", lat: 1, lon: 2 },
        { country_code: "za", city: "Cape Town", state: "Western Cape" },
      ],
    }),
    [],
  );
});

test("clears map coordinates instead of coercing blank fields to zero", () => {
  const result = shopSettingsSchema.parse({
    latitude: "",
    longitude: "",
  });

  assert.equal(result.latitude, null);
  assert.equal(result.longitude, null);
});

test("requires latitude and longitude as a complete pair", () => {
  const result = shopSettingsSchema.safeParse({
    latitude: "-26.2041",
    longitude: "",
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(
      result.error.issues.some(
        (issue) => issue.path[0] === "longitude",
      ),
    );
  }
});
