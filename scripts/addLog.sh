#!/bin/bash
LOGFILE="$1"
TXT="$2"
TMP="$1~"

echo
echo "logfile: $LOGFILE"
echo "txt: $TXT"

touch "$LOGFILE"
cp "$LOGFILE" "$TMP"
echo "$TXT" >> "$TMP"  
tail -n 100 "$TMP" > "$LOGFILE" 
rm "$TMP"


