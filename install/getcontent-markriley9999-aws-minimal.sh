#!/bin/bash

URL="https://s3-eu-west-1.amazonaws.com/markriley9999.testbucket/refplayer-content-minimal"

./getcontent.sh $URL "adverts"
./getcontent.sh $URL "bigbuckbunny"
#./getcontent.sh $URL "elephantsdream"
./getcontent.sh $URL "itv"
./getcontent.sh $URL "mperiods"
#./getcontent.sh $URL "sintel"
#./getcontent.sh $URL "testcard"


