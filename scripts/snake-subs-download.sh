#!/bin/bash

clear

UA="FVC/1.0 (VESTEL; MB100; 2.11.5.0) HbbTV/1.3.1 (; VESTEL; MB100; 2.11.5.0; ;)"
BASEURL="http://rdmedia.bbc.co.uk/dash/ondemand/elephants_dream/1/"

PAD="%06d"
COOKIE=""

echo UA: $UA


./cdndownload.sh \""$UA"\" $BASEURL "subs/snake/IS.mp4" 	"IS.mp4" "subs/snake/" 	"elephants_dream/subs/snake/" 	"" 1 64 "%05d" $COOKIE
