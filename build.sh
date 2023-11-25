#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"

echo 'running tsc...'
yarn tsc

for script in assets/*/build.sh ; do
  echo "running $script..."
  "$script"
done

echo 'done!'
