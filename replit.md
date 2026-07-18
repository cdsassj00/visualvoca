# Visual Vocab

카메라로 주변을 찍으면 사진 속 사물을 인식해 목표 언어(영어·일본어·중국어·스페인어) 단어 라벨과 한글 발음 표기, TTS 발음, 상황별 실전 회화 문장까지 제공하는 언어 학습 앱. "상상 속 회화"가 아니라 지금 눈앞의 상황에서 말문을 트게 하는 것이 목표다. 제품 전략은 `docs/PRODUCT_ROADMAP.md` 참고.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

- 장면 스캔: 카메라 촬영/앨범 사진에서 사물 5~10개 인식, 바운딩 박스 + 번역 라벨 오버레이
- 발음 지원: 로마자 표기 + 한글 외래어 발음 표기(일본어·중국어), TTS 재생(mp3, 캐싱)
- 라이브 모드: 카메라를 비추는 동안 실시간 연속 분석
- 상황 회화: 인식된 사물로 상황(카페·주방 등)을 추론해 실전 문장 5개 추천
- 단어장: 단어 저장/재생/삭제 (현재 로컬 저장)
- 타겟: 한국어 화자 — 여행객(구조 모드)과 어린이 학습자(키즈 모드)가 핵심 페르소나 (`docs/PRODUCT_ROADMAP.md`)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
