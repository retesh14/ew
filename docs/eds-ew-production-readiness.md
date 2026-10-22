# EDS + EW: POC → Production Readiness (Architect's Conversation Guide)

> Purpose: a POC proves **feasibility**. A real project needs **governance, ownership,
> and operations** agreed before code scales. This is the set of conversations to plan,
> grouped by who needs to be in the room, plus the single biggest gap to close first.

---

## TL;DR — the one slide for kickoff

> The POC proved **EDS + App Builder (EW-authored)** works. To productionize we must agree on:
> **ownership** (org-owned repos, not personal) · **environments & promotion** ·
> **quality gates** (required checks) · **security** (secrets, auth, CORS, PII) ·
> **integration contracts** (endpoint teams + SLAs) · **operations** (monitoring, runbook).

**Biggest POC→prod gap to name first:** move off *personal GitHub + personal DA.live sandbox*
onto **org-owned, access-controlled infrastructure**. Everything else builds on that.

---

## 1. Content & authoring model — with content strategy + authors

- **Source of truth** — DA.live vs SharePoint/GDrive vs hybrid. Who authors, who approves,
  what is the draft → preview → publish workflow.
- **Information architecture** — page templates, reusable blocks, fragments, and a
  **naming / folder convention** that scales to 100s of pages.
- **Localization** — locales, `#_dnt` (do-not-translate) rules, translation vendor flow.
- **Governance** — who can introduce a new block type? A signed-off **block library**
  prevents 50 one-off variants.

## 2. Environments & promotion path — with DevOps / platform

- **Org/repo strategy** — POC lives on a personal GitHub + personal DA sandbox.
  Production needs an **org-owned repo** and an org-owned DA space. *(Migrate this first.)*
- **Stage vs Prod** — EDS `--branch` previews; App Builder Stage/Prod workspaces.
  Define what "prod" means and the promotion flow.
- **Production domain + CDN** — real `robots.txt`/SEO (preview hosts block crawlers by
  design), BYO-CDN, `x-forwarded-host` correctness.

## 3. Quality gates & CI/CD — with dev leads

- **Branch protection** — make **PageSpeed (`aem-psi-check`) and lint REQUIRED** checks,
  not advisory. Define score thresholds via the `psi-check` site config.
- **PR policy** — CODEOWNERS, who may merge to `main`.
- **App Builder CI** — GitHub Actions deploy pipeline + service-account **secrets** setup.

## 4. Security & secrets — with security / InfoSec

- **Secrets** — API keys in `.env` / GitHub secrets, never in the repo. Rotation policy.
- **Auth posture** — which actions are public web actions vs `require-adobe-auth`;
  user-data endpoints require IMS.
- **CORS** — lock origins for real (not `*`).
- **Data privacy / PII** — for forms: where PII goes, retention, consent.

## 5. Integrations & data — with backend / enterprise-systems teams

- **Endpoint contract per source** — schema, auth, rate limits, SLAs, error behavior.
- **Caching & resilience** — TTLs, graceful fallback when upstream is down, upstream
  uptime ownership.

## 6. Operations & ownership — with the run team

- **Monitoring / logging** — App Builder logs, RUM, alerting, BYO-logging (Splunk/Coralogix).
- **Runbook & on-call** — who fixes a broken publish or a down action.
- **Performance budgets** — Lighthouse/Baseline bar as an ongoing SLO, not a one-time check.

## 7. People & delivery — with the program lead

- **RACI** — authors / block devs / App Builder devs / platform. Make the split explicit.
- **Onboarding & standards** — `.nvmrc`, `.env.example`, README, coding-convention ownership
  (shared engine vs project files).
- **Training & enablement** — the session series.

---

## Reference / proof points

- **Verifiable:** AEM Edge Delivery Services has many public production go-lives and a public
  performance showcase — see **https://www.aem.live** (success stories + RUM/Core Web Vitals
  leaderboard). Use this for the "EDS is production-proven" claim.
- **TODO (do not fabricate):** an *approved, citable* reference for a project that went live
  using **EDS + EW-agentic authoring together** — source this from the Adobe/partner account
  team before quoting it in a stakeholder deck. As of this writing it is **not** independently
  confirmed here.

---

## Readiness checklist (copy into a tracker)

- [ ] Org-owned GitHub repo (off personal account)
- [ ] Org-owned DA.live space + author roles
- [ ] Stage/Prod environments + promotion flow defined
- [ ] Production domain + CDN + real robots.txt configured
- [ ] Branch protection: lint + PSI required, thresholds set
- [ ] Secrets in GitHub/`.env`, rotation policy, `.env.example` committed
- [ ] Auth posture per action (public vs IMS) documented
- [ ] CORS origins locked to real hosts
- [ ] PII handling / consent / retention signed off
- [ ] Integration contract per endpoint (schema, auth, rate limit, SLA, fallback)
- [ ] Caching/TTL strategy + upstream-down behavior
- [ ] Monitoring, logging, alerting, on-call runbook
- [ ] Performance budget as ongoing SLO
- [ ] RACI + onboarding docs + block-library governance
