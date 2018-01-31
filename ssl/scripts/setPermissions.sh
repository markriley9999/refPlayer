#!/bin/bash

cd ~/refPlayer/ssl/

chmod 700 root/private
chmod 400 root/private/ca.key.pem
chmod 444 root/certs/ca.cert.pem


chmod 440 server/private/refPlayer.key.pem
chmod 444 server/certs/refPlayer.cert.pem

