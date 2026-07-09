#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "  **** This is for development only *****"
echo " "
echo " bbb-web needs write access to /var/bigbluebutton/."
echo " Grant it to your user without touching the other permissions:"
echo " "
echo " sudo setfacl -R -m \"u:\$(whoami):rwX\" -m \"d:u:\$(whoami):rwX\" /var/bigbluebutton/"
echo " "
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"


for var in "$@"
do
    if [[ $var == --build ]] ; then
       echo "Performing a full re-build..."
       "$SCRIPT_DIR/../bbb-common-web/deploy.sh"
       "$SCRIPT_DIR/build.sh"
    fi
done


sudo service bbb-web stop

exec ./gradlew bootRun --args='--server.port=8090'
