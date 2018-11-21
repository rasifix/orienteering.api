#!/bin/bash

echo $1
echo $2

#rasifix:or13nt33ring
curl -v -H 'Content-Type: text/plain;charset=cp1252' -X PUT -u fluffy:stuffy http://ol.zimaa.ch/api/events/$1 --data-binary @$2

