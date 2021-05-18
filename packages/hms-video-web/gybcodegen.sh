#!/bin/bash
find "$(pwd -P)"  -name '*.gyb' |
while read file; do
   ./gyb --line-directive '' -o "${file%.gyb}" "$file";
done
