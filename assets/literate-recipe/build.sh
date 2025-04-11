#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"

yarn tsc
