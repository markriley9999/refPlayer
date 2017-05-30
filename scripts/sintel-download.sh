#!/bin/bash

clear

SEGS=444
#SEGS=2
UA="FVC/1.0 (VESTEL; MB100; 2.11.5.0) HbbTV/1.3.1 (; VESTEL; MB100; 2.11.5.0; ;)"

BASEURL="https://bitdash-a.akamaihd.net/content/sintel/"

PAD="%06d"

#echo UA: $UA

./cdndownload.sh \""$UA"\" $BASEURL "video/250kbit/init.mp4" "init.mp4" 	"video/250kbit/segment_" 	"sintel/video/250kbit/" "segment_" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "video/500kbit/init.mp4" "init.mp4" 	"video/500kbit/segment_" 	"sintel/video/500kbit/" "segment_" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "video/800kbit/init.mp4" "init.mp4" 	"video/800kbit/segment_" 	"sintel/video/800kbit/" "segment_" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "video/1100kbit/init.mp4" "init.mp4" 	"video/1100kbit/segment_" 	"sintel/video/1100kbit/" "segment_" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "video/1500kbit/init.mp4" "init.mp4" 	"video/1500kbit/segment_" 	"sintel/video/1500kbit/" "segment_" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "video/2400kbit/init.mp4" "init.mp4" 	"video/2400kbit/segment_" 	"sintel/video/2400kbit/" "segment_" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "video/3000kbit/init.mp4" "init.mp4" 	"video/3000kbit/segment_" 	"sintel/video/3000kbit/" "segment_" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "video/4000kbit/init.mp4" "init.mp4" 	"video/4000kbit/segment_" 	"sintel/video/4000kbit/" "segment_" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "video/6000kbit/init.mp4" "init.mp4" 	"video/6000kbit/segment_" 	"sintel/video/6000kbit/" "segment_" 1 $SEGS $PAD

./cdndownload.sh \""$UA"\" $BASEURL "audio/stereo/en/128kbit/init.mp4" "init.mp4" 	"audio/stereo/en/128kbit/segment_" 	"sintel/audio/stereo/en/128kbit/" "segment_" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "audio/stereo/none/128kbit/init.mp4" "init.mp4" 	"audio/stereo/none/128kbit/segment_" 	"sintel/audio/stereo/none/128kbit/" "segment_" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "audio/surround/en/320kbit/init.mp4" "init.mp4" 	"audio/surround/en/320kbit/segment_" 	"sintel/audio/surround/en/320kbit/" "segment_" 1 $SEGS $PAD
