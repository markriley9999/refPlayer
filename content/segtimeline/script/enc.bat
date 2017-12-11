REM --- Initially DASHify - single file!!!!! ----

rem !!!! skip !!!! MP4Box.exe -dash 3840 -rap -frag-rap -bs-switching inband -single-file -out tmp\temp.mpd tmp\v1.mp4 tmp\v2.mp4 tmp\v3.mp4 tmp\v4.mp4 tmp\v5.mp4 tmp\audio.m4a


REM --- Encrypt ---

rem !!!! skip !!!! MP4Box -crypt crypt.xml tmp\v1_dash.mp4 -out tmp\ev1.mp4		
rem !!!! skip !!!! MP4Box -crypt crypt.xml tmp\v2_dash.mp4 -out tmp\ev2.mp4		
rem !!!! skip !!!! MP4Box -crypt crypt.xml tmp\v3_dash.mp4 -out tmp\ev3.mp4		
rem !!!! skip !!!! MP4Box -crypt crypt.xml tmp\v4_dash.mp4 -out tmp\ev4.mp4		
rem !!!! skip !!!! MP4Box -crypt crypt.xml tmp\v5_dash.mp4 -out tmp\ev5.mp4		

rem !!!! skip !!!! MP4Box -crypt crypt.xml tmp\audio_dashinit.mp4 -out tmp\eaudio.mp4		


REM --- DASHify ---
			
MP4Box -dash 3840 -segment-timeline -url-template -rap -frag-rap -bs-switching inband -profile dashavc264:live -segment-name ENC-$RepresentationID$/SEG$Number$ -out tmp\DASH-CLEARKEY.mpd tmp\ev1.mp4 tmp\ev2.mp4 tmp\ev3.mp4 tmp\ev4.mp4 tmp\ev5.mp4 tmp\eaudio.mp4


