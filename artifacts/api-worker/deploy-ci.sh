#!/bin/sh
# Cloudflare Workers Builds 배포 스크립트.
#
# 대시보드의 "Build variables"에 넣은 OPENAI_API_KEY 는 빌드 환경에만 존재하고
# 배포된 Worker의 런타임(c.env)에는 자동으로 안 들어가므로, 배포 후 wrangler
# secret 로 심어준다.
#
# APP_TOKEN 은 여기서 건드리지 않는다. 이미 wrangler secret 으로 한 번 설정해 두었고
# (앱 빌드에 박힌 값과 동일해야 함), wrangler deploy 는 기존 시크릿을 보존한다.
# 여기서 매 배포마다 덮어쓰면 앱에 박힌 값과 어긋나 401 이 난다.
set -e

# 루트 디렉터리 설정과 무관하게 이 스크립트가 있는 폴더(=워커 패키지)에서 실행.
cd "$(dirname "$0")"

pnpm exec wrangler deploy

if [ -n "$OPENAI_API_KEY" ]; then
  printf '%s' "$OPENAI_API_KEY" | pnpm exec wrangler secret put OPENAI_API_KEY
else
  echo "WARNING: OPENAI_API_KEY build variable is not set — vocab endpoints will fail at runtime."
fi
