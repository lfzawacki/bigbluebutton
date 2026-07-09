#!/usr/bin/env bash

# Incremental build by default (zinc only recompiles what changed).
# Pass --clean to force a full rebuild from scratch.
SBT_TASKS=(stage)
for var in "$@"
do
    if [[ $var == --clean ]] ; then
        SBT_TASKS=(clean stage)
    fi
done

sbt "${SBT_TASKS[@]}"
sudo service bbb-apps-akka stop
cd target/universal/stage || exit 1
exec ./bin/bbb-apps-akka
