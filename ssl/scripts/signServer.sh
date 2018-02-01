#!/bin/bash

cd ..

rm -f root/tmp/index.txt* root/tmp/serial*

mkdir -p root/tmp/

touch root/tmp/index.txt.attr
touch root/tmp/index.txt

echo 1000 > root/tmp/serial
 
mkdir -p server/certs

openssl ca -config config/openssl-san.cnf \
      -extensions server_cert -days 9135 -notext -md sha256 -policy policy_loose \
      -in server/csr/refPlayer.csr.pem \
      -out server/certs/refPlayer.cert.pem
       
openssl x509 -noout -text -in server/certs/refPlayer.cert.pem


openssl verify -CAfile root/certs/ca.cert.pem server/certs/refPlayer.cert.pem

