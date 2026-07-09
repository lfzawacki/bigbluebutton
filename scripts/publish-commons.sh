#!/bin/bash
# Publish the shared Scala libraries (bbb-common-message, then bbb-common-web,
# in dependency order) to the local maven/ivy repos consumed by akka-bbb-apps
# and bigbluebutton-web.
#
# By default this uses sbt's thin client (sbt --client), which keeps a warm
# sbt server per project between runs: every plain `sbt` batch invocation pays
# a fixed ~8-9s JVM + project-load startup cost, while a warm client run skips
# it entirely. The first client run still pays it once to boot the server.
#
# Usage:
#   scripts/publish-commons.sh              # publish both libs (client mode)
#   scripts/publish-commons.sh --batch      # one-shot batch sbt, no daemons
#   scripts/publish-commons.sh --shutdown   # stop the sbt servers and exit
#
# SBT_CLIENT=0 in the environment is equivalent to --batch. Use --shutdown
# (or --batch permanently) on memory-constrained machines: each sbt server
# is a resident JVM sized by the project's .jvmopts.
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECTS=(bbb-common-message bbb-common-web)

SBT_MODE=client
for var in "$@"
do
    case $var in
        --batch) SBT_MODE=batch ;;
        --shutdown) SBT_MODE=shutdown ;;
        *) echo "Unknown option: $var" >&2; exit 1 ;;
    esac
done
if [[ "${SBT_CLIENT:-1}" == "0" && "$SBT_MODE" == "client" ]] ; then
    SBT_MODE=batch
fi

for project in "${PROJECTS[@]}"
do
    cd "$REPO_ROOT/$project"
    case $SBT_MODE in
        client)
            echo "==> $project: publish + publishLocal (sbt client)"
            sbt --client 'publish; publishLocal'
            ;;
        batch)
            echo "==> $project: publish + publishLocal (sbt batch)"
            sbt publish publishLocal
            ;;
        shutdown)
            echo "==> $project: shutting down sbt server"
            sbt --client shutdown || true
            ;;
    esac
done
