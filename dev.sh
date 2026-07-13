#!/bin/bash
# Single entry point for the per-service dev scripts scattered around the
# repo. Wraps each service's own run-dev.sh/deploy.sh and systemd unit —
# it adds no behavior of its own beyond 'status'.
#
#   ./dev.sh status              overview: services, html5 serving mode
#   ./dev.sh run <service>       start the service in dev mode (run-dev.sh)
#   ./dev.sh deploy <service>    build + install + restart (deploy.sh)
#   ./dev.sh logs <service>      follow the service's journal
#   ./dev.sh services            list known services
set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

# name|directory|systemd unit ('-' = none)
SERVICES="
akka-apps|akka-bbb-apps|bbb-apps-akka
fsesl|akka-bbb-fsesl|bbb-fsesl-akka
web|bigbluebutton-web|bbb-web
html5|bigbluebutton-html5|-
graphql-server|bbb-graphql-server|bbb-graphql-server
graphql-actions|bbb-graphql-actions|bbb-graphql-actions
graphql-middleware|bbb-graphql-middleware|bbb-graphql-middleware
common-message|bbb-common-message|-
common-web|bbb-common-web|-
"

lookup() {
    echo "$SERVICES" | grep "^$1|" || {
        echo "Unknown service: $1" >&2
        echo "Known services:" >&2
        list_services >&2
        exit 1
    }
}

list_services() {
    echo "$SERVICES" | awk -F'|' 'NF {printf "  %-20s %s\n", $1, $2}'
}

html5_mode() {
    local link target port
    link=/usr/share/bigbluebutton/nginx/bbb-html5.nginx
    target=$(readlink -f "$link" 2>/dev/null || true)
    case $target in
        *dev*)
            port=$(grep -oP 'proxy_pass\s+http://localhost:\K[0-9]+' "$target" 2>/dev/null | head -1)
            echo "dev (webpack dev server, port ${port:-unknown})"
            ;;
        *static*) echo "static (deployed build in /usr/share/bigbluebutton/html5-client)" ;;
        *)        echo "unknown ($target)" ;;
    esac
}

# Shared libs that are only ever deployed (no run-dev.sh, no independent
# process), so systemd/dev-process status is meaningless noise for them.
STATUS_HIDDEN="common-message common-web"

# Recognize the interpreter/build-tool a service's run-dev.sh execs into
# (sbt, gradlew, npm/node, go run, webpack) running with its cwd set to the
# service's own directory - that combination is specific enough to tell a
# real dev run apart from an unrelated process that happens to sit in the
# same tree (e.g. an editor).
DEV_PROC_PATTERN='sbt-launch|gradlew|npm|node|go run|webpack'

is_dev_running() {
    local abs="$REPO_ROOT/$1" pid cwd cmd
    for pid in /proc/[0-9]*; do
        pid=${pid#/proc/}
        cwd=$(readlink -f "/proc/$pid/cwd" 2>/dev/null) || continue
        [ "$cwd" = "$abs" ] || continue
        cmd=$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null)
        if [[ $cmd =~ $DEV_PROC_PATTERN ]]; then
            return 0
        fi
    done
    return 1
}

cmd_status() {
    echo "Services:"
    echo "$SERVICES" | while IFS='|' read -r name dir unit; do
        [ -z "$name" ] && continue
        [[ " $STATUS_HIDDEN " == *" $name "* ]] && continue
        local state=""
        if is_dev_running "$dir"; then
            state="running (dev)"
        elif [ "$unit" != "-" ]; then
            state=$(systemctl is-active "$unit" 2>/dev/null || true)
        else
            state="(no systemd unit)"
        fi
        printf "  %-20s %s\n" "$name" "$state"
    done
    echo ""
    echo "html5 serving mode: $(html5_mode)"
    if pgrep -f "webpack serve" > /dev/null 2>&1; then
        echo "webpack dev server: running"
    fi
}

run_script() {
    local service=$1 script=$2 entry dir
    entry=$(lookup "$service")
    dir=$(echo "$entry" | cut -d'|' -f2)
    if [ ! -x "$REPO_ROOT/$dir/$script" ]; then
        echo "$service has no $script" >&2
        exit 1
    fi
    exec "$REPO_ROOT/$dir/$script" "${@:3}"
}

cmd_logs() {
    local entry unit
    entry=$(lookup "$1")
    unit=$(echo "$entry" | cut -d'|' -f3)
    if [ "$unit" = "-" ]; then
        echo "$1 has no systemd unit to read logs from" >&2
        exit 1
    fi
    exec journalctl -u "$unit" -f
}

case ${1:-} in
    status)   cmd_status ;;
    services) list_services ;;
    run)      [ -n "${2:-}" ] || { echo "Usage: $0 run <service>" >&2; exit 1; }
              run_script "$2" run-dev.sh "${@:3}" ;;
    deploy)   [ -n "${2:-}" ] || { echo "Usage: $0 deploy <service>" >&2; exit 1; }
              run_script "$2" deploy.sh "${@:3}" ;;
    logs)     [ -n "${2:-}" ] || { echo "Usage: $0 logs <service>" >&2; exit 1; }
              cmd_logs "$2" ;;
    *)
        sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'
        exit 1
        ;;
esac
