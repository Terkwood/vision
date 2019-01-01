#!/bin/sh
cargo web build --target=wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/debug/vision.wasm static/.
cp target/wasm32-unknown-unknown/debug/vision.js static/.
