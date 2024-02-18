#!/usr/bin/env zsh

set -euo pipefail

function exit_with_usage() {
  echo "usage: $0 [--overwrite] [--artwork PATH] FILES..."
  echo
  echo "note: atomicparsley will compact padding usually present in iTunes files, so"
  echo "      output files will shrink; they have not been re-encoded"
  exit
}

if ! command -v atomicparsley 1>/dev/null ; then
  # https://github.com/wez/atomicparsley
  # on a Mac, `brew install atomicparsley` should be sufficient
  echo "missing required dependency: atomicparsley"
  exit 1
fi

FILES=()
OVERWRITE=
ARTWORK=

while [[ $# -gt 0 ]] ; do
  case "$1" in
    -h|--help)
      exit_with_usage
      ;;
    --overwrite)
      OVERWRITE=1
      shift
      ;;
    --artwork)
      ARTWORK="$2"
      shift
      shift
      ;;
    -*|--*)
      echo "unknown argument $1"
      exit_with_usage
      ;;
    *)
      FILES+=("$1")
      shift
      ;;
  esac
done

ATOMS_TO_REMOVE=(
  # "----.name:[iTunNORM]" # Sound Check (volume normalization) data
  # "----.name:[iTunSMPB]" # seamless playback (gapless playback) data
  ownr # owner
  cprt # copyright
  purd # purchase date
  xid  # vendor-supplied ID
  apID # Apple ID
  cnID # iTunes catalog ID
  atID # ???
  cmID # ???
  plID # playlist ID
  geID # genre ID (redundant with genre)
  sfID # store front ID (a.k.a. Apple region)
)

ATOMICPARSLEY_ARGS=()
for atom in "${ATOMS_TO_REMOVE[@]}" ; do
  ATOMICPARSLEY_ARGS+=("--manualAtomRemove" "'moov.udta.meta.ilst.$atom'")
done

if [ -n "$ARTWORK" ] && [ ! -e "$ARTWORK" ] ; then
  echo "no such file $ARTWORK"
  exit 1
fi

for file in "${FILES[@]}" ; do
  if [ ! -e "$file" ] ; then
    echo "skipping missing file $file"
    continue
  fi

  if [ -d "$file" ] ; then
    echo "skipping directory $file"
    continue
  fi

  if ! atomicparsley "$file" -T 1>/dev/null 2>/dev/null; then
    echo "skipping non-mpeg4 file $file"
    continue
  fi

  args=("$file" "${ATOMICPARSLEY_ARGS[@]}")

  if [ -n "$ARTWORK" ] ; then
    args+=("--artwork" "$ARTWORK")
  fi

  if [ -z "$OVERWRITE" ] ; then
    mkdir -p "$(dirname "$file")/stripped"
    output="$(dirname "$file")/stripped/$(basename "$file")"
    atomicparsley "${args[@]}" -o "$output" 1>/dev/null
    echo "stripped $file -> $output"
  else
    atomicparsley "${args[@]}" --overWrite 1>/dev/null
    echo "stripped $file in-place"
  fi
done
