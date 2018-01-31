#!/bin/bash

cd ~/refPlayer/ssl
 
openssl rsa -in server/private/refPlayer.key.pem -out server/private/refPlayer-nopass.key.pem

