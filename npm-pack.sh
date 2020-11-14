#!/bin/bash
# Helper script to swap and npm pack a different package.json.
# e.g.:
#   ./npm-pack.sh package-test.json
#

function finish {
	popd
	if [[ $1 != 0 ]]; then
		echo
		echo 'Use  npm install <package>.tgz  for local or  install -g  for global.'
		echo 'To extract in place:'
		echo '[ -r <package>.tgz ] && tar -xvf <package>.tgz && rm <package>.tgz && mv -f package/* .'
		echo
	fi
	exit $1
}

pkg="$1"
[ "${pkg%.*}.json" == "$pkg" ] || { echo "Package '$pkg' must be a .json file." ; exit 1 ; }
[ -r "$pkg" ] || { echo "Package '$pkg' not found." ; exit 1 ; }

# Change to directory to that of the package and get the json package filename.
[ "${pkg%/*}" == "$pkg" ] && pushd . || pushd "${pkg%/*}"
pkg=${pkg##*/}
trap 'finish $?' EXIT HUP INT TERM

[ -r package-old.json ] && { echo "package-old.json already exists." ; finish 1 ; }
[ -r package.json ] && mv package.json package-old.json
mv "$pkg" package.json
echo
echo Packaging "$pkg" with npm pack ...
npm pack
mv package.json "$pkg"
[ -r package-old.json ] && mv package-old.json package.json

