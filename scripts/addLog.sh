#!/bin/bash

echo "logfile: $1"
echo "txt: $2"

touch "$1"
cp "$1" log.tmp
echo "$2" >> log.tmp  
tail -n 100 log.tmp 
mv log.tmp "$1"
