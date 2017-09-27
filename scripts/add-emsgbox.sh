#!/bin/bash

SEGNAME=$1
EMSG=$2
NOEMSGNAME=$SEGNAME"-noemsg"

echo Param1: $SEGNAME
echo Param2: $EMSG

if [ ! -e $SEGNAME ]; then
	echo $SEGNAME does not exist!  Exitting.
	exit 1
fi

if [ ! -e $EMSG ]; then
	echo $EMSG does not exist!  Exitting.
	exit 1
fi


if grep -q "emsg" $SEGNAME; then
    echo [emsg] already present.
	if [ -e $NOEMSGNAME ]; then
		echo Reverted using $NOEMSGNAME
		mv $NOEMSGNAME $SEGNAME
	else 	
		exit 1
	fi
fi

cp $SEGNAME $NOEMSGNAME
cat $EMSG $SEGNAME > tmp.m4s
mv tmp.m4s $SEGNAME

echo Done

