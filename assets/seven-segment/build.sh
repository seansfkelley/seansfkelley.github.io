#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"

# workaround for Jekyll apparently not permitting redefining MIME types for extensions/paths
cp generate.py generate.txt

echo "successfully built $(dirname "$0")"
