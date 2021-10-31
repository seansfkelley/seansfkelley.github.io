#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

rm -rf .git/hooks
ln -s ../hooks .git/hooks
