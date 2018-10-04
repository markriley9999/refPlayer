#!/bin/bash

URL=$1
FNAME=refplayer-content-$2.tar.gz
DIR="tmpdl"

echo $URL
echo $FNAME

./appinstall.sh curl
rc=$?; if [[ $rc != 0 ]]; then exit $rc; fi

mkdir -p $DIR

COUNTER=0
WAITT=4
MAXATTEMPTS=5

while [  $COUNTER -lt $MAXATTEMPTS ]; do

	if [ $COUNTER -gt 0 ]; then
		echo " - backoff wait: "$WAITT"s"
		sleep $WAITT
		let WAITT=WAITT*2
	fi
	
	http_code=$(curl --speed-limit 5 --speed-time 30 --write-out '\n%{http_code}\n' $URL/$FNAME -o $DIR/$FNAME | tail -n 1)

	if [ $? -eq 0 ]; then
		# happy path
		if [ $http_code -eq 200 ]; then
			#happy path
			tar -tf $DIR/$FNAME
			if [ $? -eq 0 ]; then
				# happy path
				tar -xzvf $DIR/$FNAME -C ../

				if [ $? -eq 0 ]; then
					# happy path
					rm $DIR/$FNAME

					echo "--- Success ---"
					exit 0
				fi
			fi

		else
			echo "***" \[$http_code\] "Server Error ***"
		fi

	fi
	
	let COUNTER=COUNTER+1
	echo "Download failed, attempt "$COUNTER
	
done

echo "!!! Aborting: Content download failed."
exit 1
