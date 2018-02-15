#!/bin/bash

clear

#VAR=$(curl -A "FVC/1.0 (VESTEL; MB100; 2.11.5.0) HbbTV/1.3.1 (; VESTEL; MB100; 2.11.5.0; ;)"  http://vs-dash-ww-rd-live.bbcfmt.hs.llnwd.net/al/hevc1/client_manifest.mpd | egrep -m 1 -o "startNumber=\"([0-9]+)" | egrep -o "[0-9]+")


START=$[$1+30]
SEGS=$[$START+300]


echo "$START"
echo "$SEGS"

rm -r content/bbc/


#read -p "Press enter to continue"


UA="HbbTV/1.4.1 ( DRM; TCL; MS86; V8-S586XXX-LF1XXX ; MS86; com.tcl.MS86;) FVC/2.0 (TCL; com.tcl.MS86;)"
BASEURL="http://vs-dash-ww-rd-live.bbcfmt.hs.llnwd.net/al/"
PAD="%06d"


echo UA: $UA
		
./cdndownload.sh \""$UA"\" $BASEURL "hevc1/3840x2160p50/IS.mp4" 	"IS.mp4" "hevc1/3840x2160p50/" 		"bbc/hevc1/3840x2160p50/" 		"" $START $SEGS $PAD 0 &
./cdndownload.sh \""$UA"\" $BASEURL "hevc1/1920x1080p50/IS.mp4" 	"IS.mp4" "hevc1/1920x1080p50/" 		"bbc/hevc1/1920x1080p50/" 		"" $START $SEGS $PAD 2 &
#./cdndownload.sh \""$UA"\" $BASEURL "hevc1/2560x1440p50/IS.mp4" 	"IS.mp4" "hevc1/2560x1440p50/" 		"bbc/hevc1/2560x1440p50/" 	"" $START $SEGS $PAD 1 &

./cdndownload.sh \""$UA"\" $BASEURL "hevc1/192kbps/IS.mp4" 	"IS.mp4" "hevc1/192kbps/" 	"bbc/hevc1/192kbps/" 	"" $START $SEGS $PAD 3 &


