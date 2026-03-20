#!/bin/bash
# ============================================================
# Vercel Ignored Build Step
# ============================================================
# Runs before every Vercel build. Exit 0 = skip build, exit 1 = proceed.
# Saves build minutes by skipping deploys when only non-app files changed.
#
# Docs: https://vercel.com/docs/projects/overview#ignored-build-step
# ============================================================

echo "🔍 Checking if build is needed..."

# Always build production (main branch)
if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then
  echo "✅ Production branch — building."
  exit 1
fi

# Skip preview builds for non-app changes (docs, tests, scripts, config)
# git diff --name-only compares HEAD vs the previous successful deployment
CHANGED=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "UNKNOWN")

if [ "$CHANGED" = "UNKNOWN" ]; then
  echo "⚠️ Could not determine changes — building to be safe."
  exit 1
fi

# Check if ANY changed file is an app/build-relevant file
echo "$CHANGED" | while IFS= read -r file; do
  case "$file" in
    docs/*|*.md|e2e/*|tests/*|scripts/*|feature-lab/*|promptfoo.yaml|playwright.config.ts|PLAN.md)
      # Non-app file — continue checking
      ;;
    *)
      # App file changed — must build
      echo "✅ App file changed: $file — building."
      exit 1
      ;;
  esac
done

# If we got here, only non-app files changed
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo "⏭️ Only docs/tests/scripts changed — skipping build."
  exit 0
fi

exit 1
