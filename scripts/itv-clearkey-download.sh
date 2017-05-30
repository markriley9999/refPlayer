#!/bin/bash

clear

SEGS=201
#SEGS=2
UA="FVC/1.0 (VESTEL; MB100; 2.11.5.0) HbbTV/1.3.1 (; VESTEL; MB100; 2.11.5.0; ;)"

BASEURL="http://itvpnp-usp.test.ott.irdeto.com/MONITOR/SAMPLES/1-9360-1784-001-DVBDASH-CLEARKEY.ism/dash/1-9360-1784-001-DVBDASH-CLEARKEY-"

PAD="%06d"

#echo UA: $UA

./cdndownload.sh \""$UA"\" $BASEURL "video=579029.dash" "1-9360-1784-001-DVBDASH-CLEARKEY-video=579029.dash" 	"video=579029-" 	"itv/clearkey/dash/" "1-9360-1784-001-DVBDASH-CLEARKEY-video=579029-" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "video=909972.dash" "1-9360-1784-001-DVBDASH-CLEARKEY-video=909972.dash"	"video=909972-" 	"itv/clearkey/dash/" "1-9360-1784-001-DVBDASH-CLEARKEY-video=909972-" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "video=1187006.dash" "1-9360-1784-001-DVBDASH-CLEARKEY-video=1187006.dash"	"video=1187006-" 	"itv/clearkey/dash/" "1-9360-1784-001-DVBDASH-CLEARKEY-video=1187006-" 1 $SEGS $PAD
./cdndownload.sh \""$UA"\" $BASEURL "video=1466985.dash" "1-9360-1784-001-DVBDASH-CLEARKEY-video=1466985.dash"	"video=1466985-" 	"itv/clearkey/dash/" "1-9360-1784-001-DVBDASH-CLEARKEY-video=1466985-" 1 $SEGS $PAD


./cdndownload.sh \""$UA"\" $BASEURL "audio=128000.dash" "1-9360-1784-001-DVBDASH-CLEARKEY-audio=128000.dash"	"audio=128000-" 	"itv/clearkey/dash/" "1-9360-1784-001-DVBDASH-CLEARKEY-audio=128000-" 1 $SEGS $PAD


#eg.
#curl http://itvpnp-usp.test.ott.irdeto.com/MONITOR/SAMPLES/1-9360-1784-001-DVBDASH-CLEARKEY.ism/dash/1-9360-1784-001-DVBDASH-CLEARKEY-video=579029.dash
#curl http://itvpnp-usp.test.ott.irdeto.com/MONITOR/SAMPLES/1-9360-1784-001-DVBDASH-CLEARKEY.ism/dash/1-9360-1784-001-DVBDASH-CLEARKEY-video=579029-000001.m4s
