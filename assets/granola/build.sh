#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"

# "CDN"
cp ../../node_modules/juxtaposejs/build/js/juxtapose.js .
cp ../../node_modules/juxtaposejs/build/css/juxtapose.css .
