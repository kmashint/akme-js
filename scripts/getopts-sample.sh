#!/bin/bash
# getopts-sample.sh
#

set -eu

usage="Use: $0 [-a ...] [-b ...] c"
a=
b=
while getopts "a:b:" options; do
  case "$options" in
  a) echo a=$OPTARG;;
  b) echo b=$OPTARG;;
  :|?|*) echo $usage; exit $OPTERR;;
  esac
done
shift $(( OPTIND - 1 ))

while (( $# > 0 )); do
  case "$1" in
  c) echo "$1";;
  *) echo $usage; exit 3;;
  esac
  shift
done
