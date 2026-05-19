#!/usr/bin/env sh
# Fast-forward develop to match main after a production release.
set -e
git fetch origin
git checkout develop
git merge origin/main -m "chore: sync develop with main"
git push origin develop
echo "develop is now at: $(git rev-parse --short HEAD)"
