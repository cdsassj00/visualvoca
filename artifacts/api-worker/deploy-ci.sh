#!/bin/sh
# Cloudflare Workers Builds 배포 스크립트.
#
# 대시보드의 "Build variables"에 넣은 OPENAI_API_KEY / APP_TOKEN 은 빌드 환경에만
# 존재하고, 배포된 Worker의 런타임(c.env)에는 자동으로 들어가지 않는다.
# 그래서 배포 후 wrangler secret 로 런타임 시크릿을 심어준다. (이미 있으면 갱신)
set -e

pnpm exec wrangler deploy

if [ -n "$OPENAI_API_KEY" ]; then
  printf '%s' "$OPENAI_API_KEY" | pnpm exec wrangler secret put OPENAI_API_KEY
else
  echo "WARNING: OPENAI_API_KEY build variable is not set — vocab endpoints will fail at runtime."
fi

if [ -n "$APP_TOKEN" ]; then
  printf '%s' "$APP_TOKEN" | pnpm exec wrangler secret put APP_TOKEN
else
  echo "WARNING: APP_TOKEN build variable is not set — /api/vocab/* will reject all requests."
fi
