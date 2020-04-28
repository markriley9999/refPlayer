#!/bin/bash
LOGFILE="$1"
TXT="$2"

echo "logfile: $LOGFILE"
echo "txt: $TXT"

touch "$LOGFILE"
cp "$LOGFILE" log.tmp
echo "$TXT" >> log.tmp  
tail -n 100 log.tmp > "$LOGFILE" 
rm log.tmp


