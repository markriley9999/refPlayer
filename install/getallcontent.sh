#!/bin/bash

URL=$1

./getcontent.sh $URL "adverts"

./getcontent.sh $URL "sintel-init"
./getcontent.sh $URL "sintel-1-130855"
./getcontent.sh $URL "sintel-2-4655707"
./getcontent.sh $URL "sintel-3-2609528"
./getcontent.sh $URL "sintel-4-1391167"
./getcontent.sh $URL "sintel-5-829479"
./getcontent.sh $URL "sintel-6-443332"

./getcontent.sh $URL "sintel-ENC-1-136919"
./getcontent.sh $URL "sintel-ENC-2-4661006"
./getcontent.sh $URL "sintel-ENC-3-2614855"
./getcontent.sh $URL "sintel-ENC-4-1396513"
./getcontent.sh $URL "sintel-ENC-5-834834"
./getcontent.sh $URL "sintel-ENC-6-448689"

#./getcontent.sh $URL "bbb-init"
#./getcontent.sh $URL "bbb-1-130975"
#./getcontent.sh $URL "bbb-2-4641286"
#./getcontent.sh $URL "bbb-3-1391654"
#./getcontent.sh $URL "bbb-4-831650"
#./getcontent.sh $URL "bbb-5-441426"
#./getcontent.sh $URL "bbb-6-2607432"

#./getcontent.sh $URL "bbb-ENC-1-4646585"
#./getcontent.sh $URL "bbb-ENC-2-1397003"
#./getcontent.sh $URL "bbb-ENC-3-837007"
#./getcontent.sh $URL "bbb-ENC-4-446784"
#./getcontent.sh $URL "bbb-ENC-5-2612761"
#./getcontent.sh $URL "bbb-ENC-6-137036"

./getcontent.sh $URL "elephantsdream"
./getcontent.sh $URL "itv"
