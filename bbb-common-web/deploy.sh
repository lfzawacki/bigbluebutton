#!/bin/bash
set -e
cd "$(dirname "$0")"

#Publish new bbb-common-web .jar
# rm -r target/ project/target/ project/project/ lib_managed/
sbt update publish publishLocal
