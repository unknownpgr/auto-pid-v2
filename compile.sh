#!/bin/bash

# Maximum optimization for speed, compile every .c file in the current directory, with iteration.
for file in *.c
do
    gcc -O3 -o ${file%.*}.o $file
done