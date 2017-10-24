#!/bin/bash

clear

SEGS=165
#SEGS=2
UA="FVC/1.0 (VESTEL; MB100; 2.11.5.0) HbbTV/1.3.1 (; VESTEL; MB100; 2.11.5.0; ;)"
BASEURL="http://rdmedia.bbc.co.uk/dash/ondemand/elephants_dream/1/"

PAD="%06d"
COOKIE=""

echo UA: $UA


./cdndownload.sh \""$UA"\" $BASEURL "avc3/1920x1080p25/IS.mp4" 	"IS.mp4" "avc3/1920x1080p25/" 	"elephants_dream/avc3/1920x1080p25/" 	"" 1 $SEGS $PAD $COOKIE
./cdndownload.sh \""$UA"\" $BASEURL "avc3/896x504p25/IS.mp4" 	"IS.mp4" "avc3/896x504p25/" 	"elephants_dream/avc3/896x504p25/" 		"" 1 $SEGS $PAD $COOKIE
./cdndownload.sh \""$UA"\" $BASEURL "avc3/704x396p25/IS.mp4"	"IS.mp4" "avc3/704x396p25/" 	"elephants_dream/avc3/704x396p25/" 		"" 1 $SEGS $PAD $COOKIE
./cdndownload.sh \""$UA"\" $BASEURL "avc3/512x288p25/IS.mp4" 	"IS.mp4" "avc3/512x288p25/" 	"elephants_dream/avc3/512x288p25/" 		"" 1 $SEGS $PAD $COOKIE
./cdndownload.sh \""$UA"\" $BASEURL "avc3/1280x720p25/IS.mp4" 	"IS.mp4" "avc3/1280x720p25/" 	"elephants_dream/avc3/1280x720p25/" 	"" 1 $SEGS $PAD $COOKIE

./cdndownload.sh \""$UA"\" $BASEURL "audio/128kbps/IS.mp4" 	"IS.mp4" "audio/128kbps/" 	"elephants_dream/audio/128kbps/" 	"" 1 $SEGS $PAD $COOKIE

./cdndownload.sh \""$UA"\" $BASEURL "subs/english-hh/IS.mp4" 	"IS.mp4" "subs/english-hh/" 	"elephants_dream/subs/english-hh/" 	"" 1 64 "%05d" $COOKIE
