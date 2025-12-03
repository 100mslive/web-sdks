#!/bin/bash
lerna version $1 --no-git-tag-version --exact --yes --no-private
bun scripts/sync-versions.js