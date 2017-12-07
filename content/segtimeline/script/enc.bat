REM --- Encrypt ---

MP4Box -crypt crypt.xml tmp\v1.mp4 -out tmp\ev1.mp4		
MP4Box -crypt crypt.xml tmp\v2.mp4 -out tmp\ev2.mp4		
MP4Box -crypt crypt.xml tmp\v3.mp4 -out tmp\ev3.mp4		
MP4Box -crypt crypt.xml tmp\v4.mp4 -out tmp\ev4.mp4		
MP4Box -crypt crypt.xml tmp\v5.mp4 -out tmp\ev5.mp4		

MP4Box -crypt crypt.xml tmp\audio.m4a -out tmp\eaudio.m4a		


rem ffprobe -show_frames -print_format compact tmp\ev4.mp4 > tmp\frames-e.txt
rem cat frames-e.txt | awk -F '|' '($2 == "media_type=video") {if ($4 == "key_frame=1") print $6}' | awk -F '=' '{ print ($2 - i) * 1000, j; i = $2; j++ }'


REM --- DASHify ---
			
MP4Box -dash 3840 -segment-timeline -url-template -rap -frag-rap -bs-switching inband -profile dashavc264:live -segment-name $RepresentationID$/SEG$Number$ -out tmp\DASH-CLEARKEY.mpd tmp\ev1.mp4 tmp\ev2.mp4 tmp\ev3.mp4 tmp\ev4.mp4 tmp\ev5.mp4 tmp\eaudio.m4a


