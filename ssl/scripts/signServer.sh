#!/bin/bash

cd ~/refPlayer/ssl
 
mkdir -p server/certs

openssl ca -config config/openssl.cnf \
      -extensions server_cert -days 9135 -notext -md sha256 -policy policy_loose \
      -in server/csr/refPlayer.csr.pem \
      -out server/certs/refPlayer.cert.pem
       
openssl x509 -noout -text -in server/certs/refPlayer.cert.pem


openssl verify -CAfile root/certs/ca.cert.pem server/certs/refPlayer.cert.pem

