# @workspace/api-worker — Cloudflare Workers 백엔드

Express 서버(`artifacts/api-server`)와 동일한 API(`/api/healthz`, `/api/vocab/analyze|phrases|speech`)를 Cloudflare Workers + Hono로 제공한다. 생성된 앱 클라이언트(`@workspace/api-client-react`)를 그대로 쓸 수 있도록 요청/응답 형태를 맞췄다.

**왜 Workers인가:** 서버 상시 구동 비용이 없다. 무료 티어(일 10만 요청)로 시작하고, 유료여도 월 $5 수준. 실제 비용의 대부분은 OpenAI API 호출이므로 이 워커에 두 가지 가드레일을 넣었다:

- **APP_TOKEN 인증** — `/api/vocab/*`는 `Authorization: Bearer <APP_TOKEN>` 필수. 토큰 없이 배포하면 아무나 내 OpenAI 크레딧을 소모할 수 있다.
- **일일 스캔 한도** — 비전 분석(`/analyze`)만 IP당 하루 `FREE_DAILY_SCANS`회(기본 30). 초과 시 429 + `DAILY_LIMIT_REACHED`. KV 카운터(48시간 TTL) 기반 소프트 한도.

## 배포

```bash
pnpm --filter @workspace/api-worker exec wrangler login
pnpm --filter @workspace/api-worker exec wrangler kv namespace create USAGE_KV
# → 출력된 id를 wrangler.jsonc의 kv_namespaces[0].id에 반영

cd artifacts/api-worker
pnpm exec wrangler secret put OPENAI_API_KEY   # OpenAI API 키
pnpm exec wrangler secret put APP_TOKEN        # 긴 랜덤 문자열 (openssl rand -hex 32)

pnpm run deploy
```

배포 후 나오는 `https://visualvoca-api.<계정>.workers.dev`가 API 주소다.

## 앱 연결

Expo 앱 빌드/실행 시 환경변수 두 개를 준다:

```bash
EXPO_PUBLIC_API_URL=https://visualvoca-api.<계정>.workers.dev
EXPO_PUBLIC_APP_TOKEN=<APP_TOKEN 시크릿과 같은 값>
```

`app/_layout.tsx`가 `EXPO_PUBLIC_API_URL`이 있으면 그 주소를, 없으면 기존 Replit 도메인을 사용한다.

## 로컬 개발

```bash
# .dev.vars 파일에 OPENAI_API_KEY, APP_TOKEN 작성 (gitignore됨)
pnpm --filter @workspace/api-worker run dev
```

## 환경변수

| 이름 | 종류 | 기본값 | 설명 |
|---|---|---|---|
| `OPENAI_API_KEY` | secret | — | OpenAI API 키 |
| `APP_TOKEN` | secret | — | 앱 인증 토큰 |
| `OPENAI_BASE_URL` | var | `https://api.openai.com/v1` | 프록시 사용 시 교체 |
| `OPENAI_MODEL` | var | `gpt-5.4` | 비전/회화 모델. 비용 절감이 필요하면 더 저렴한 티어로 교체 |
| `OPENAI_TTS_MODEL` | var | `gpt-4o-mini-tts` | TTS 모델 |
| `OPENAI_TTS_VOICE` | var | (없음→`alloy`) | TTS 보이스 id. 다른 제공사 TTS 쓸 때 그쪽 보이스로 |
| `OPENROUTER_PROVIDER` | var | (없음) | OpenRouter 전용. 상위 프로바이더 고정, 예: `Groq` |
| `FREE_DAILY_SCANS` | var | `30` | IP당 일일 무료 스캔 한도. `0` 이하면 한도 해제 |

## OpenRouter로 전환 (모델 A/B 테스트·저지연)

OpenRouter는 비전(`/chat/completions`)과 TTS(`/audio/speech`) 모두 OpenAI 호환이라 **코드 수정 없이 env만** 바꾸면 된다. 모델명만 바꿔가며 제일 빠른/싼 모델을 실험할 수 있다.

```
OPENAI_BASE_URL   = https://openrouter.ai/api/v1
OPENAI_API_KEY    = <OpenRouter 키, sk-or-v1-...>
OPENAI_MODEL      = google/gemini-2.5-flash-lite   # 비전 지원 모델
OPENAI_TTS_MODEL  = openai/gpt-4o-mini-tts         # voice=alloy 그대로 사용 가능
OPENROUTER_PROVIDER = Groq                          # (선택) 비전 최저 지연
```

- `OPENAI_MODEL` 은 반드시 **비전(이미지 입력) 지원 모델**이어야 한다.
- OpenAI 이외 TTS(Grok Voice, MiniMax 등)를 쓰면 `OPENAI_TTS_VOICE` 를 그 제공사 보이스 id로 설정.
- 저지연 확정 후에는 해당 제공사에 직접 붙어(프록시 홉 제거) 마지막 지연까지 줄일 수 있다.
