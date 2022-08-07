#!/bin/bash
# getopts-not-sample.sh
#

set -eu

usage="Use: $0 [-a ...] [-b ...] c"
a=
b=

function get_arg2 {
  (( $# > 1 )) && echo "$2" || echo ""
}

while (( $# > 0 )); do
  case "$1" in
  -a) echo a=$(get_arg2 "$@"); shift;;
  -b) echo b=$(get_arg2 "$@"); shift;;
  c) echo "$1";;
  *) echo $usage; exit 1;;
  esac
  shift
done
