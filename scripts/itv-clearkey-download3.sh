#!/bin/bash

clear

#SEGS=104
SEGS=2
UA="HbbTV/1.3.1 (;Panasonic;Viera2017low;3.022;5e01-0003 1000-0000;Viera2017;) FVC/2.0 (Panasonic;Viera2017;) (avdn/Panasonic.Viera2017low) Mozilla/5.0 (Linux; U; Viera; en-GB) AppleWebKit/537.36 (KHTML, like Gecko) Viera/4.0.0 Chrome/51.0.2704.100 Safari/537.36"

BASEURL="http://itvpnpctv.content.itv.com/2-4259-0298-001/20/1/VAR015/2-4259-0298-001_20_1_VAR015.ism/dash/2-4259-0298-001_20_1_VAR015-"
 
PAD="%06d"

COOKIE="hdntl=exp=1508892158~acl=%2f*~hmac=e9df324d5cb03816b022e3aee7f3c6af459c322a1fffb2e563d64b4d08388e0b"

#echo UA: $UA
2-4259-0298-001_20_1_VAR015-
./cdndownload.sh \""$UA"\" $BASEURL "video=498156.dash" "2-4259-0298-001_20_1_VAR015-video=498156.dash" 	"video=498156-" 	"itv/familyguy/dash/" "2-4259-0298-001_20_1_VAR015-video=498156-" 1 $SEGS $PAD $COOKIE
./cdndownload.sh \""$UA"\" $BASEURL "video=746786.dash" "2-4259-0298-001_20_1_VAR015-video=746786.dash"	"video=746786-" 	"itv/familyguy/dash/" "2-4259-0298-001_20_1_VAR015-video=746786-" 1 $SEGS $PAD $COOKIE
./cdndownload.sh \""$UA"\" $BASEURL "video=914553.dash" "2-4259-0298-001_20_1_VAR015-video=914553.dash"	"video=914553-" 	"itv/familyguy/dash/" "2-4259-0298-001_20_1_VAR015-video=914553-" 1 $SEGS $PAD $COOKIE
./cdndownload.sh \""$UA"\" $BASEURL "video=1061802.dash" "2-4259-0298-001_20_1_VAR015-video=1061802.dash"	"video=1061802-" 	"itv/familyguy/dash/" "2-4259-0298-001_20_1_VAR015-video=1061802-" 1 $SEGS $PAD $COOKIE


./cdndownload.sh \""$UA"\" $BASEURL "audio=128000.dash" "2-4259-0298-001_20_1_VAR015-audio=128000.dash"	"audio=128000-" 	"itv/familyguy/dash/" "2-4259-0298-001_20_1_VAR015-audio=128000-" 1 $SEGS $PAD $COOKIE


#eg.
#curl http://itvpnp-usp.test.ott.irdeto.com/MONITOR/SAMPLES/1-9360-1784-001-DVBDASH-CLEARKEY.ism/dash/2-4259-0298-001_20_1_VAR015-video=498156.dash
#curl http://itvpnp-usp.test.ott.irdeto.com/MONITOR/SAMPLES/1-9360-1784-001-DVBDASH-CLEARKEY.ism/dash/2-4259-0298-001_20_1_VAR015-video=498156-000001.m4s
#     http://itvpnpctv.content.itv.com/2-4229-0016-001/20/1/VAR015/2-4259-0298-001_20_1_VAR015.ism/dash/2-4259-0298-001_20_1_VAR015-video=1061802-1.m4s
#     http://itvpnpctv.content.itv.com/2-4259-0298-001/20/1/VAR015/2-4259-0298-001_20_1_VAR015.ism/dash/2-4259-0298-001_20_1_VAR015-video=1061802-1.m4s