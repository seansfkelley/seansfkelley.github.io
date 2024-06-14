#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"

# workaround for https://github.com/jekyll/jekyll/issues/5454 because this should be served as plain text
cp generate.py generate.txt
