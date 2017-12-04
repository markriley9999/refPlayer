REM Prep content

set NAME=%1
set CONTENT=%2
set DURATION=%3

set DIR=tmp-%NAME%

echo Name: %NAME%
echo FileName: %CONTENT%
echo Duration: %DURATION%
echo Tmp dir: %DIR%

mkdir %DIR%



REM ---Change to mp4 container, scale and crop, aac audio ---

ffmpeg -y  -i %CONTENT% -vf "scale=-1:1080, crop=1920:1080" -c:v libx264 -r 24 -profile:v main -preset fast -c:a aac -ac 2  -movflags +faststart -r 25 -t %DURATION% %DIR%\source.mp4


REM --- Split out Video ---

ffmpeg -y  -i %DIR%\source.mp4 -map_metadata -1 -map 0:0 -c:v copy -an %DIR%\video.mp4

 



REM --- Scale and GOP align! ---

ffmpeg -y  -i %DIR%\video.mp4 -c:v libx264 -b:v 4630k -x264opts keyint=96:min-keyint=96:no-scenecut -profile:v main -preset medium -movflags +faststart %DIR%\valigned_1.mp4

ffmpeg -y  -i %DIR%\video.mp4 -vf "scale=1280:720" -c:v libx264 -b:v 2594k -x264opts keyint=96:min-keyint=96:no-scenecut -profile:v main -preset medium -movflags +faststart %DIR%\valigned_2.mp4

ffmpeg -y  -i %DIR%\video.mp4 -vf "scale=896:504" -c:v libx264 -b:v 1384k -x264opts keyint=96:min-keyint=96:no-scenecut -profile:v main -preset medium -movflags +faststart %DIR%\valigned_3.mp4

ffmpeg -y  -i %DIR%\video.mp4 -vf "scale=704:396" -c:v libx264 -b:v 823k -x264opts keyint=96:min-keyint=96:no-scenecut -profile:v main -preset medium -movflags +faststart %DIR%\valigned_4.mp4

ffmpeg -y  -i %DIR%\source.mp4 -vf "scale=512:288" -c:v libx264 -b:v 438k -x264opts keyint=96:min-keyint=96:no-scenecut -profile:v main -preset medium -movflags +faststart -c:a aac -b:a 128k -ac 2 %DIR%\avaligned_5.mp4



REM --- Clean up again (some reason a sub track gets added...?!)

ffmpeg -y  -i %DIR%\valigned_1.mp4 -map_metadata -1 -map 0:0 -c:v copy -an %DIR%\v1.mp4
ffmpeg -y  -i %DIR%\valigned_2.mp4 -map_metadata -1 -map 0:0 -c:v copy -an %DIR%\v2.mp4
ffmpeg -y  -i %DIR%\valigned_3.mp4 -map_metadata -1 -map 0:0 -c:v copy -an %DIR%\v3.mp4
ffmpeg -y  -i %DIR%\valigned_4.mp4 -map_metadata -1 -map 0:0 -c:v copy -an %DIR%\v4.mp4

ffmpeg -y  -i %DIR%\avaligned_5.mp4 -map_metadata -1 -c:v copy -c:a copy %DIR%\av5.mp4




REM --- Check frames ---

ffprobe -show_frames -print_format compact %DIR%\v1.mp4 > %DIR%\frames_1.txt
ffprobe -show_frames -print_format compact %DIR%\v2.mp4 > %DIR%\frames_2.txt
ffprobe -show_frames -print_format compact %DIR%\v3.mp4 > %DIR%\frames_3.txt
ffprobe -show_frames -print_format compact %DIR%\v4.mp4 > %DIR%\frames_4.txt
ffprobe -show_frames -print_format compact %DIR%\av5.mp4 > %DIR%\frames_5.txt

REM cat frames_1.txt | awk -F '|' '($2 == "media_type=video") {if ($4 == "key_frame=1") print $6}' | awk -F '=' '{ print $2 * 1000 / 3840, i; ++i }'
REM cat frames_2.txt | awk -F '|' '($2 == "media_type=video") {if ($4 == "key_frame=1") print $6}' | awk -F '=' '{ print $2 * 1000 / 3840, i; ++i }'
REM cat frames_3.txt | awk -F '|' '($2 == "media_type=video") {if ($4 == "key_frame=1") print $6}' | awk -F '=' '{ print $2 * 1000 / 3840, i; ++i }'
REM cat frames_4.txt | awk -F '|' '($2 == "media_type=video") {if ($4 == "key_frame=1") print $6}' | awk -F '=' '{ print $2 * 1000 / 3840, i; ++i }'
REM cat frames_5.txt | awk -F '|' '($2 == "media_type=video") {if ($4 == "key_frame=1") print $6}' | awk -F '=' '{ print $2 * 1000 / 3840, i; ++i }'







