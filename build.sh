#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"

for script in assets/*/build.sh ; do
  echo "running $script..."
  "$script"
done

echo 'done!'
