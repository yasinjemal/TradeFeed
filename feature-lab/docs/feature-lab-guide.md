# Feature Lab Guide

## How to Use the Feature Lab

### Adding a New Feature

1. Create a new folder under `feature-lab/features/` with naming convention: `feature-XX-short-name`
2. Add a `SPEC.md` file with the feature specification
3. Add an `IMPLEMENTATION.md` file as you build
4. Add a `TESTS.md` file with test cases and results
5. Update `docs/phasetrack.md` with status

### Feature Folder Structure

```
feature-XX-short-name/
├── SPEC.md              # Feature specification
├── IMPLEMENTATION.md    # Implementation notes and decisions
├── TESTS.md             # Test cases and results
└── assets/              # Diagrams, screenshots, etc.
```

### Moving to Production

1. All tests in `TESTS.md` must pass
2. Feature flag must be implemented (`lib/config/feature-flags.ts`)
3. Feature must be reviewed against phasetrack spec
4. Database migrations must be reviewed
5. Rollback plan must be documented

### Feature Flag Convention

```typescript
// lib/config/feature-flags.ts
export const FEATURE_FLAGS = {
  WHATSAPP_PRODUCT_IMPORT: process.env.FF_WHATSAPP_IMPORT === 'true',
  AUTO_ORDER_REPLY: process.env.FF_AUTO_ORDER_REPLY === 'true',
  PAYMENT_LINKS: process.env.FF_PAYMENT_LINKS === 'true',
  // ... add new features here
}
```
