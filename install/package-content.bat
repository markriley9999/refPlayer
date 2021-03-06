@echo off

set NAME=%1

echo %1| sed 's#/#\-#g' > tmp.out
set /p DASHNAME= < tmp.out
rm tmp.out

echo NAME: %NAME%
echo DASHNAME: %DASHNAME%

mkdir tmp

cd ..

tar -czvPf "install/tmp/refplayer-content-%DASHNAME%.tar.gz" --exclude={*.mpd,*.xml,*.txt,*.bin} "content/%NAME%"
tar -tf "install/tmp/refplayer-content-%DASHNAME%.tar.gz"

cd install
