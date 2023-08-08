#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"

nearleyc grammar.ne -o grammar.js
cp grammar.ne grammar.txt
cp ../../node_modules/nearley/lib/nearley.js nearley.js
