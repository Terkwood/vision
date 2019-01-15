#!/bin/sh
cargo web build --target=wasm32-unknown-unknown --release
cp target/wasm32-unknown-unknown/release/vision.wasm static/.
cp target/wasm32-unknown-unknown/release/vision.js static/.
wasm-opt -Os -o static/vision-min.wasm static/vision.wasm
mv static/vision-min.wasm static/vision.wasm

