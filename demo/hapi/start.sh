#!/usr/bin/env bash
# Start a local HAPI FHIR JPA server (FHIR R4, clinical reasoning enabled) in podman,
# capped at 2 GB, with its H2 database in a named volume so that a restart keeps the data.
# Waits until http://localhost:8080/fhir/metadata answers.
#
#   demo/hapi/start.sh          # start (or keep running) the server
#   HAPI_PORT=8081 demo/hapi/start.sh
#
# Stop it with demo/hapi/stop.sh.
set -euo pipefail

IMAGE="${HAPI_IMAGE:-docker.io/hapiproject/hapi:v8.12.0-2}"
NAME="${HAPI_CONTAINER:-west-a-hapi}"
VOLUME="${HAPI_VOLUME:-west-a-hapi-data}"
PORT="${HAPI_PORT:-8080}"
BASE="http://localhost:${PORT}/fhir"

# Rootless podman without a subordinate UID range (no /etc/subuid entry) maps only one
# UID: the image's files cannot be chowned to its user 65532, so pull with chown errors
# ignored and run as the container's root, which is the calling user on the host.
PODMAN=(podman)
RUN_AS=()
if ! grep -q "^$(id -un):" /etc/subuid 2>/dev/null; then
  driver=$(podman info --format '{{.Store.GraphDriverName}}')
  PODMAN+=(--storage-opt "${driver}.ignore_chown_errors=true")
  RUN_AS=(--user 0:0)
fi

if [ "$("${PODMAN[@]}" ps -q --filter "name=^${NAME}$")" != "" ]; then
  echo "HAPI is already running as ${NAME}"
else
  "${PODMAN[@]}" rm -f "${NAME}" >/dev/null 2>&1 || true
  "${PODMAN[@]}" image exists "${IMAGE}" || "${PODMAN[@]}" pull "${IMAGE}"
  "${PODMAN[@]}" volume exists "${VOLUME}" || "${PODMAN[@]}" volume create "${VOLUME}" >/dev/null
  "${PODMAN[@]}" run -d --name "${NAME}" "${RUN_AS[@]}" \
    -m 2g --memory-swap 2g \
    -p "${PORT}:8080" \
    -v "${VOLUME}:/data" \
    -e JAVA_TOOL_OPTIONS="-Xmx1300m -Xss512k -XX:MaxMetaspaceSize=320m -XX:ReservedCodeCacheSize=128m -XX:+UseSerialGC" \
    -e HAPI_FHIR_FHIR_VERSION=R4 \
    -e HAPI_FHIR_CR_ENABLED=true \
    -e HAPI_FHIR_CORS_ALLOWED_ORIGIN_0='*' \
    -e HAPI_FHIR_ALLOW_EXTERNAL_REFERENCES=true \
    -e SPRING_AI_MCP_SERVER_ENABLED=false \
    -e SPRING_DATASOURCE_URL="jdbc:h2:file:/data/h2" \
    -e SPRING_APPLICATION_JSON='{"hapi":{"fhir":{"reuse_cached_search_results_millis":0,"cr":{"cql":{"data":{"terminology_parameter_mode":"USE_INLINE_CODES"}}}}}}' \
    "${IMAGE}" >/dev/null
  echo "Started ${NAME} from ${IMAGE}"
fi

echo -n "Waiting for ${BASE}/metadata "
for _ in $(seq 1 180); do
  if curl -fs -o /dev/null "${BASE}/metadata"; then
    echo " up"
    exit 0
  fi
  if [ "$("${PODMAN[@]}" ps -q --filter "name=^${NAME}$")" = "" ]; then
    echo " the container stopped:"
    "${PODMAN[@]}" logs --tail 50 "${NAME}"
    exit 1
  fi
  echo -n "."
  sleep 2
done
echo " timed out"
"${PODMAN[@]}" logs --tail 50 "${NAME}"
exit 1
