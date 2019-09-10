#!/bin/bash

# Builds zip file with all files needed to publish the extension

filename="redireq_$(date --utc +%Y%m%d_%H%M)"
zip -q $filename images/logo-*.png popup/* background.js manifest.json
echo "$filename.zip OK"
