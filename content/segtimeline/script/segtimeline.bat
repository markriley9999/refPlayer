REM --- prep content ---

mkdir tmp

call prep.bat ch4-ads rawcontent\ch4-ads.mp4 60
call prep.bat itv-ads rawcontent\itv-ads.mp4 60


REM --- 25 fps! ---
ffmpeg -y -i rawcontent\sintel-24fps.mp4  -filter_complex "[0:v]setpts=24/25*PTS[v];[0:a]atempo=25/24[a]" -map "[v]" -map "[a]" -r 25 -t 537.600 rawcontent\sintel.mp4


call prep.bat sintel rawcontent\sintel.mp4 537.600
call prep.bat bbb rawcontent\bbb-30fps.mp4 537.600


ffmpeg -y -f concat -i cat-v1.txt -c copy -t 3600 tmp\v1.mp4 
ffmpeg -y -f concat -i cat-v2.txt -c copy -t 3600 tmp\v2.mp4 
ffmpeg -y -f concat -i cat-v3.txt -c copy -t 3600 tmp\v3.mp4 
ffmpeg -y -f concat -i cat-v4.txt -c copy -t 3600 tmp\v4.mp4 
ffmpeg -y -f concat -i cat-v5.txt -c copy -t 3600 tmp\v5.mp4 
ffmpeg -y -f concat -i cat-a.txt  -c copy -t 3600 tmp\audio.m4a 


REM --- Sanity check

ffmpeg -y -i tmp\v5.mp4 -i tmp\audio.m4a -c copy tmp\checkpt.mp4



ffprobe -show_frames -print_format compact tmp\v5.mp4 > tmp\frames.txt
ffprobe -show_frames -print_format compact tmp\audio.m4a > tmp\frames-a.txt

rem cat frames.txt | awk -F '|' '($2 == "media_type=video") {if ($4 == "key_frame=1") print $6}' | awk -F '=' '{ print ($2 - i) * 1000, j; i = $2; j++ }'



MP4Box -dash 3840 -segment-timeline -url-template -rap -frag-rap -bs-switching inband -profile dashavc264:live -segment-name $RepresentationID$/SEG$Number$ -out tmp\DASH.mpd tmp\v1.mp4 tmp\v2.mp4 tmp\v3.mp4 tmp\v4.mp4 tmp\v5.mp4 tmp\audio.m4a


