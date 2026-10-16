# vinext + varlock repro (for varlock Discord)

Minimal reproduction: a tiny vinext App Router app using
`@varlock/cloudflare-integration`'s `varlockCloudflareVitePlugin` builds fine,
but the built worker **crashes at boot** with `initVarlockEnv failed` — no
`__VARLOCK_ENV` blob is ever supplied outside `varlock-wrangler deploy`.

Nothing here touches Infisical, real credentials, or any Cloudflare account.
Everything fails 100% locally (`wrangler dev`). The `.env` file holds obvious
dummy values and is committed intentionally so the repro runs with zero setup.

## Versions (all verified installed)

| package | version |
|---|---|
| vinext | 1.2.0 |
| vite | 8.0.14 |
| react / react-dom / react-server-dom-webpack | 19.2.6 |
| @vitejs/plugin-react | 6.0.2 |
| @vitejs/plugin-rsc | 0.5.37 |
| @cloudflare/vite-plugin | ^1.64.0 |
| wrangler | 4.151.0 |
| varlock | 1.23.0 |
| @varlock/cloudflare-integration | 1.6.2 |

macOS arm64, node v26.8.2, pnpm 11.1.3.

## Files

- `app/layout.tsx`, `app/page.tsx` — one page reading `ENV.REPRO_PUBLIC_VALUE`
  / `ENV.REPRO_SECRET_VALUE` from `varlock/env`.
- `vite.config.ts` — `vinext()` + `varlockCloudflareVitePlugin({ configPath,
  viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] } })`.
- `wrangler.jsonc` — name + `vinext/server/fetch-handler` + `nodejs_compat`.
- `.env.schema` — two items (`@sensitive=false` public, `@sensitive` secret).
  No Infisical plugin, no vaults.
- `.env` — dummy values. No `.dev.vars` (the plugin throws if one exists).

## Repro steps

```bash
pnpm install
./node_modules/.bin/vite build          # ✅ green
./node_modules/.bin/wrangler dev --config dist/server/wrangler.json --port 8788
# ❌ worker crashes before serving anything:
```

Actual output:

```
🚨 initVarlockEnv failed - no resolved env found 🚨
varlock needs the resolved env to already be present in this process. Either:
  - import `varlock/auto-load` before anything else, so it resolves at boot, or
  - launch via `varlock run -- <your-command>`, or
  - supply a pre-resolved env: the `__VARLOCK_ENV` blob (with
    `_VARLOCK_USE_INJECTED_ENV=1`), or a `varlock freeze` file.

✘ [ERROR] service core:user:vinext-varlock-repro: Uncaught Error: initVarlockEnv failed
    at null.<anonymous> (_next/static/env-Dh14o1ps.js:3:5) in P
```

Same failure was also observed wrapped: `varlock run -- wrangler dev …` crashes
identically — the wrapper does not supply the blob either.

## What works (control cases, all verified)

- `vite dev` → 200, page renders, log shows
  `🔒 [varlock] injecting resolved env into the Cloudflare worker`, and the
  `REPRO_PUBLIC_VALUE` from `.env` appears in the HTML. Dev-mode injection is fine.
- Same app with `varlockCloudflareVitePlugin()` swapped for plain `cloudflare()`
  and the `varlock/env` import removed → builds, boots, serves 200. The vinext +
  workers harness is fine; the integration is the variable.

## Setup quirks found while minimizing (not the bug, just notes)

- `viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] }` must be passed
  through (same as a full vinext app uses); without it the build dies earlier on
  `Rolldown failed to resolve import "virtual:vite-rsc/encryption-key"`.
- `pnpm install` may need `--config.minimumReleaseAge=0` — several of these
  packages are days old and trip pnpm's supply-chain age policy.

## Questions for maintainers

1. Is `varlock/env` (+ the injected ssr-init) expected to boot in a vinext-bundled
   worker served by stock `wrangler dev`? If yes, what supplies `__VARLOCK_ENV`
   there?
2. Our deploy path is `vinext-cloudflare deploy`, not `wrangler deploy`. Docs say
   only `varlock-wrangler` produces the `__VARLOCK_ENV` blob — is there any
   supported way to get it with a non-wrangler deploy tool, or is
   `varlock-wrangler` a hard requirement?
