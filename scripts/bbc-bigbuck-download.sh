#!/bin/bash

clear

SEGS=150
#SEGS=2
UA="FVC/1.0 (VESTEL; MB100; 2.11.5.0) HbbTV/1.3.1 (; VESTEL; MB100; 2.11.5.0; ;)"
BASEURL="http://rdmedia.bbc.co.uk/dash/ondemand/bbb/2/"
PAD="%06d"


# http://rdmedia.bbc.co.uk/dash/ondemand/bbb/2/avc3/1280x720p25/000007.m4s

echo UA: $UA

./cdndownload.sh \""$UA"\" $BASEURL "avc3/1920x1080p25/IS.mp4" 	"IS.mp4" "avc3/1920x1080p25/" 	"bbb/avc3/1920x1080p25/" 	"" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "avc3/896x504p25/IS.mp4" 	"IS.mp4" "avc3/896x504p25/" 	"bbb/avc3/896x504p25/" 		"" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "avc3/704x396p25/IS.mp4"	"IS.mp4" "avc3/704x396p25/" 	"bbb/avc3/704x396p25/" 		"" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "avc3/512x288p25/IS.mp4" 	"IS.mp4" "avc3/512x288p25/" 	"bbb/avc3/512x288p25/" 		"" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "avc3/1280x720p25/IS.mp4" 	"IS.mp4" "avc3/1280x720p25/" 	"bbb/avc3/1280x720p25/" 	"" 1 $SEGS $PAD

./cdndownload.sh \""$UA"\" $BASEURL "audio/160kbps/IS.mp4" 	"IS.mp4" "audio/160kbps/" 	"bbb/audio/160kbps/" 	"" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "audio/96kbps/IS.mp4" 	"IS.mp4" "audio/96kbps/" 	"bbb/audio/96kbps/" 	"" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "audio/128kbps/IS.mp4" 	"IS.mp4" "audio/128kbps/" 	"bbb/audio/128kbps/" 	"" 1 $SEGS $PAD

