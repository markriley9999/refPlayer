#!/bin/bash

clear

#SEGS=240
SEGS=2
UA="HbbTV/1.3.1 (;Panasonic;Viera2017low;3.022;5e01-0003 1000-0000;Viera2017;) FVC/2.0 (Panasonic;Viera2017;) (avdn/Panasonic.Viera2017low) Mozilla/5.0 (Linux; U; Viera; en-GB) AppleWebKit/537.36 (KHTML, like Gecko) Viera/4.0.0 Chrome/51.0.2704.100 Safari/537.36"

BASEURL="http://itvpnpctv.content.itv.com/2-4229-0016-001/20/1/VAR015/2-4229-0016-001_20_1_VAR015.ism/dash/2-4229-0016-001_20_1_VAR015-"

PAD="%06d"

COOKIE="hdntl=exp=1508876282~acl=%2f*~hmac=89f43f1543540a4d4c473e3885c7d4876bbf7c19fe2040aba763d0f5caabbdad"

#echo UA: $UA

./cdndownload.sh \""$UA"\" $BASEURL "video=507585.dash" "2-4229-0016-001_20_1_VAR015-video=507585.dash" 	"video=507585-" 	"itv/victoria/dash/" "2-4229-0016-001_20_1_VAR015-video=507585-" 1 $SEGS $PAD $COOKIE
./cdndownload.sh \""$UA"\" $BASEURL "video=809026.dash" "2-4229-0016-001_20_1_VAR015-video=809026.dash"	"video=809026-" 	"itv/victoria/dash/" "2-4229-0016-001_20_1_VAR015-video=809026-" 1 $SEGS $PAD $COOKIE
./cdndownload.sh \""$UA"\" $BASEURL "video=1087740.dash" "2-4229-0016-001_20_1_VAR015-video=1087740.dash"	"video=1087740-" 	"itv/victoria/dash/" "2-4229-0016-001_20_1_VAR015-video=1087740-" 1 $SEGS $PAD $COOKIE
./cdndownload.sh \""$UA"\" $BASEURL "video=1376270.dash" "2-4229-0016-001_20_1_VAR015-video=1376270.dash"	"video=1376270-" 	"itv/victoria/dash/" "2-4229-0016-001_20_1_VAR015-video=1376270-" 1 $SEGS $PAD $COOKIE


./cdndownload.sh \""$UA"\" $BASEURL "audio=128000.dash" "2-4229-0016-001_20_1_VAR015-audio=128000.dash"	"audio=128000-" 	"itv/victoria/dash/" "2-4229-0016-001_20_1_VAR015-audio=128000-" 1 $SEGS $PAD $COOKIE


#eg.
#curl http://itvpnp-usp.test.ott.irdeto.com/MONITOR/SAMPLES/1-9360-1784-001-DVBDASH-CLEARKEY.ism/dash/2-4229-0016-001_20_1_VAR015-video=507585.dash
#curl http://itvpnp-usp.test.ott.irdeto.com/MONITOR/SAMPLES/1-9360-1784-001-DVBDASH-CLEARKEY.ism/dash/2-4229-0016-001_20_1_VAR015-video=507585-000001.m4s
#     http://itvpnpctv.content.itv.com/2-4229-0016-001/20/1/VAR015/2-4229-0016-001_20_1_VAR015.ism/dash/2-4229-0016-001_20_1_VAR015-video=1376270-1.m4s