#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"

nearleyc grammar.ne -o grammar.js

# "CDN"
cp grammar.ne grammar.txt
cp ../../node_modules/nearley/lib/nearley.js nearley.js
cp ../../node_modules/nearley/lib/unparse.js nearley-unparse.js
# note that randexp is committed directly because it doesn't publish a browser build

echo "successfully built $(dirname "$0")"
