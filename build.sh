#!/bin/sh

mkdir -p out/fonts
cp -u fonts/*/webfonts/* out/fonts

esbuild="./node_modules/esbuild/bin/esbuild"
echo $esbuild
if [ "$1" = "dist" ]; then
    $esbuild scripts/main.js --bundle --minify --outfile=out/out.js
    sass style/main.sass out/main.css --style=compressed
else
    $esbuild scripts/main.js --bundle --sourcemap --outfile=out/out.js
    sass style/main.sass out/main.css --source-map
fi
