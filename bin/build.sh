#!bash
# Build akme-core.js
#

exec 2>&1 # send stderr(2) to stdout(1)
yuid=$PWD

pushd ../src

file=../web/common/akme-core

echo "$file.src.js"
echo>"$file.src.js" // ${file##*/}

for a in akme-core.js akme-context.js akme-dom.js akme-more.js akme-storage.js akme-couch.js; do
    cat>>"$file.src.js" "$a"
done

echo>"$file.min.js" // ${file##*/}
java -jar $yuid/yuicompressor/yuicompressor.jar --type js --preserve-semi --verbose \
    2>"${0%.*}.log" 1>>"$file.min.js" "$file.src.js"

# TODO: use node with npm install -g jshint@2.8 and requirejs for minification
# TODO: remove useless warnings
# cscript.exe //nologo "%yuid%\%~n0.js" <"%yuid%\%~n0_.log" >"%yuid%\%~n0.log" && del /f /q "%yuid%\%~n0_.log"

popd

echo $(date) Done.
exit 0
