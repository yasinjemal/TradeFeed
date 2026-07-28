# Geoapify location-normalization pilot

## Scope

The pilot is intentionally limited to **Dashboard → Shop settings**. Sellers can
search for a South African address, select a suggestion, and still type or
correct every field manually.

The selected result fills:

- street address
- city/town
- province
- postal code
- latitude and longitude

TradeFeed records `locationProvider`, `locationGeocodedAt`, and
`locationPublishedAt` when a changed location is saved. A seller must
explicitly confirm that the business/collection/showroom address and exact
map pin may be public before the update is accepted.

Existing shops and the shop-creation journey continue to work without
Geoapify. The additive metadata migration has no backfill requirement.

## Configuration

Create a Geoapify project key and set this server-only environment variable:

```text
GEOAPIFY_API_KEY=<secret>
```

Do not prefix the key with `NEXT_PUBLIC_`. The browser calls
`/api/location/autocomplete`; only the server-side proxy talks to Geoapify.
If the key is absent, invalid, rate-limited, or Geoapify is unavailable, the
form silently retains manual entry.

## Data and privacy boundaries

- Requests are restricted to South Africa.
- The proxy returns only the allowlisted fields needed by shop settings.
- Raw provider payloads are not stored.
- The browser sends autocomplete text in an authenticated POST body rather
  than the URL. TradeFeed does not add application logs for search text;
  infrastructure/provider processing still follows their respective privacy
  terms.
- Coordinates are saved only after the seller selects a suggestion, uses
  device location, or enters a manual pin and then saves the settings form.
- Editing the selected address, city, province, or postal code clears the
  selected map pin so coordinates cannot silently describe a different place.
- The settings UI persistently displays both Geoapify and OpenStreetMap
  attribution, and provider-derived public locations repeat that attribution
  on the catalogue.

The saved street address and exact coordinates are intentionally public:
TradeFeed uses them in the catalogue map, directions links, and structured
search metadata. Treat them as seller business data. The form warns sellers
not to enter a home address unless they are comfortable publishing it. Do not
use the pilot to infer a seller's home address, buyer location, or delivery
behavior.

Legacy rows are not treated as confirmed. Their street address and exact map
pin remain hidden from the public catalogue until a seller opens settings,
checks the public-location acknowledgement, and saves. City and province stay
public for broad marketplace discovery.

## Launch QA

Test with the production key in a preview deployment:

1. Search and select an address in Johannesburg.
2. Confirm city, Gauteng, postal code, latitude, and longitude are populated.
3. Repeat with Cape Town, Durban, and a small South African town.
4. Enter a valid town manually without choosing a suggestion and save it.
5. Disconnect or remove the API key and confirm manual entry still works.
6. Enter an invalid province and confirm validation rejects it.
7. Confirm the network response never contains the Geoapify key.
8. Confirm the catalogue exposes coordinates only after the seller checks the
   public-location acknowledgement, and that clearing the location removes the
   public map/structured coordinates.

## Pilot decision

Run the settings-only pilot for two weeks before expanding it to shop creation
or marketplace radius search. Review:

- suggestion selection rate
- form-save errors
- support reports about wrong city/province/postal code
- API credit consumption

Expand only if normalization improves address quality without creating seller
friction. Radius search and map browsing remain out of scope.
