# Feature 01: WhatsApp Product Import — Test Cases

## Unit Tests

### Price Parser
| Input | Expected | Status |
|-------|----------|--------|
| "R250" | 25000 (cents) | ⏳ |
| "250" | 25000 | ⏳ |
| "R 250.00" | 25000 | ⏳ |
| "250.00" | 25000 | ⏳ |
| "R1,250" | 125000 | ⏳ |
| "R1 250" | 125000 | ⏳ |
| "from R250" | 25000 | ⏳ |
| "250-500" | min: 25000, max: 50000 | ⏳ |
| "R250-R500" | min: 25000, max: 50000 | ⏳ |
| "no price here" | null (error) | ⏳ |

### Size Parser
| Input | Expected Sizes | Status |
|-------|---------------|--------|
| "S-XL" | [S, M, L, XL] | ⏳ |
| "S M L XL" | [S, M, L, XL] | ⏳ |
| "S, M, L" | [S, M, L] | ⏳ |
| "size 6-12" | [6, 8, 10, 12] | ⏳ |
| "28-34" | [28, 30, 32, 34] | ⏳ |
| "one size" | [One Size] | ⏳ |
| "free size" | [One Size] | ⏳ |

### Image Analysis (GPT-4o Vision)
| Image Type | Expected Output | Status |
|-----------|-----------------|--------|
| Clear product photo (single item) | Name + description + category | ⏳ |
| Multiple items in one photo | Primary item identified | ⏳ |
| Blurry/dark photo | Error: "Please send a clearer photo" | ⏳ |
| Non-product image (selfie, landscape) | Error: "This doesn't look like a product" | ⏳ |
| Product on model | Name + description (fashion context) | ⏳ |
| Product on flat surface | Name + description (product context) | ⏳ |

## Integration Tests

### Webhook Processing
| Scenario | Expected | Status |
|----------|----------|--------|
| Valid image + price text | Product created, reply sent | ⏳ |
| Image only (no text) | AI generates all fields, asks for price | ⏳ |
| Text only (no image) | Error: "Please include a product photo" | ⏳ |
| Unknown sender (no shop) | Error: "Please register on tradefeed.co.za first" | ⏳ |
| Duplicate image (same hash) | Warning: "Similar product already exists: [link]" | ⏳ |
| Rate limit exceeded | Error: "You've reached your import limit. Try again in X minutes" | ⏳ |

### End-to-End Flow
| Test | Status |
|------|--------|
| Send photo + "Red dress R250 S-XL" → product created with 4 variants | ⏳ |
| Send photo + "500" → product created with R500 price | ⏳ |
| Send photo + "R250-R500 S M L XL" → product with price range and 4 variants | ⏳ |
| Created product visible on catalog page | ⏳ |
| Created product appears in marketplace search | ⏳ |
| Seller can edit AI-generated product from dashboard | ⏳ |
| Product has correct shop association (multi-tenant safe) | ⏳ |

**Status Legend**: ⏳ Not Run | ✅ Pass | ❌ Fail | 🔄 In Progress
