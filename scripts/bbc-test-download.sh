#!/bin/bash

clear

SEGS=938
#SEGS=2
UA="FVC/1.0 (VESTEL; MB100; 2.11.5.0) HbbTV/1.3.1 (; VESTEL; MB100; 2.11.5.0; ;)"
BASEURL="http://rdmedia.bbc.co.uk/dash/ondemand/testcard/1/"
PAD="%06d"


echo UA: $UA
		
./cdndownload.sh \""$UA"\" $BASEURL "avc3-events/960x540p50/IS.mp4" 	"IS.mp4" "avc3-events/960x540p50/" 		"test/avc3-events/960x540p50/" 	"" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "avc3-events/704x396p50/IS.mp4" 	"IS.mp4" "avc3-events/704x396p50/" 		"test/avc3-events/704x396p50/" 		"" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "avc3-events/1920x1080i25/IS.mp4"	"IS.mp4" "avc3-events/1920x1080i25/" 	"test/avc3-events/1920x1080i25/" 		"" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "avc3-events/512x288p25/IS.mp4" 	"IS.mp4" "avc3-events/512x288p25/" 		"test/avc3-events/512x288p25/" 		"" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "avc3-events/384x216p25/IS.mp4" 	"IS.mp4" "avc3-events/384x216p25/" 		"test/avc3-events/384x216p25/" 	"" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "avc3-events/1280x720p50/IS.mp4" 	"IS.mp4" "avc3-events/1280x720p50/" 	"test/avc3-events/1280x720p50/" 		"" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "avc3-events/704x396p25/IS.mp4" 	"IS.mp4" "avc3-events/704x396p25/" 		"test/avc3-events/704x396p25/" 	"" 1 $SEGS $PAD

./cdndownload.sh \""$UA"\" $BASEURL "audio/320kbps-5_1/IS.mp4" 	"IS.mp4" "audio/320kbps-5_1/" 	"test/audio/320kbps-5_1/" 	"" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "audio/128kbps/IS.mp4" 		"IS.mp4" "audio/128kbps/" 		"test/audio/128kbps/" 		"" 1 $SEGS $PAD

