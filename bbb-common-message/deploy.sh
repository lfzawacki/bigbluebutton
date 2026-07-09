#!/bin/bash
set -e
cd "$(dirname "$0")"

#Publish new common-message .jar
# rm -r target/ project/target/ project/project/
sbt publish publishLocal
