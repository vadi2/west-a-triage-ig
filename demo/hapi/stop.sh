#!/usr/bin/env bash
# Stop and remove the local HAPI FHIR container that start.sh started. The H2 database
# stays in its named volume; pass --purge to delete the volume too.
set -euo pipefail

NAME="${HAPI_CONTAINER:-west-a-hapi}"
VOLUME="${HAPI_VOLUME:-west-a-hapi-data}"

podman stop -t 20 "${NAME}" >/dev/null 2>&1 || true
podman rm -f "${NAME}" >/dev/null 2>&1 || true
echo "Stopped and removed ${NAME}"

if [ "${1:-}" = "--purge" ]; then
  podman volume rm -f "${VOLUME}" >/dev/null 2>&1 || true
  echo "Removed volume ${VOLUME}"
fi
