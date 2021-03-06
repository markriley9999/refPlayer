#!/bin/bash


REPSPATH=$1
BEGINREP=$2
ENDREP=$3
TOTALSEGS=$4
PREFIX=$5

COPYTO=$REPSPATH$PREFIX"MIX/"

COUNTER=1

mkdir -p $COPYTO

while [  $COUNTER -le $TOTALSEGS ]; do
	echo --- Segment = $COUNTER
	
	let "CURRENTREP=($COUNTER%($ENDREP-$BEGINREP+1))+$BEGINREP"
	
	SEGPATH=$REPSPATH$PREFIX$CURRENTREP"/SEG"$COUNTER".m4s"
	
	echo cp $SEGPATH $COPYTO
	cp $SEGPATH $COPYTO
	
	let "COUNTER=COUNTER+1"
	
done