#!/bin/bash
set -e

SRC="/Users/admin/Desktop/KOKO-app/云归"
DST="/Users/admin/Desktop/KOKO-app/云归-标准发布"

mkdir -p "$DST"

cp "$SRC/index.html" "$DST/index.html"
cp "$SRC/styles.css" "$DST/styles.css"
cp "$SRC/app.js" "$DST/app.js"
cp "$SRC/张国荣.jpg" "$DST/张国荣.jpg"
cp "$SRC/default-custom.png" "$DST/default-custom.png"
cp "$SRC/蜡烛.mp4" "$DST/蜡烛.mp4"
cp "$SRC/蜡烛5.mp4" "$DST/蜡烛5.mp4"
cp "$SRC/logo.svg" "$DST/logo.svg"
cp "$SRC/转发.svg" "$DST/转发.svg"
cp "$SRC/看过.svg" "$DST/看过.svg"
cp "$SRC/全屏.svg" "$DST/全屏.svg"

echo "✅ 标准发布文件已生成在：$DST"
