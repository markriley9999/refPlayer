#!/bin/bash
LOGFILE="$1"
TXT="$2"
TMP="$1~"

#echo
#echo "logfile: $LOGFILE"
#echo "txt: $TXT"

echo "$TXT" >> "$LOGFILE" 
#&& tail -n 100 "$LOGFILE" > "$TMP" && cp "$TMP" "$LOGFILE"

