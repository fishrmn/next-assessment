#!/usr/bin/env sh
set -e

cd "$(dirname "$0")/.."

open_url() {
  url=$1
  case "$(uname -s)" in
    Darwin) open "$url" ;;
    Linux)
      if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$url"
      fi
      ;;
    MINGW* | MSYS* | CYGWIN*)
      if command -v cmd.exe >/dev/null 2>&1; then
        cmd.exe /c start "" "$url"
      fi
      ;;
  esac
}

wait_for_http() {
  url=$1
  max=${2:-90}
  i=0

  while [ "$i" -lt "$max" ]; do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 "$url" 2>/dev/null || echo "000")
    if [ "$code" -ge 200 ] && [ "$code" -lt 500 ]; then
      return 0
    fi
    i=$((i + 1))
    sleep 1
  done

  echo "Timed out waiting for $url" >&2
  return 1
}

docker compose up --build -d

if [ "${DOCKER_OPEN_BROWSER:-1}" != "0" ]; then
  wait_for_http "http://localhost:3000"
  open_url "http://localhost:3000"
fi

docker compose logs -f
