---
title: "EDS + EW: From POC to Production"
subtitle: "Architect's slide outline — management review handout"
date: "September 22, 2026"
---

## Slide 1 — Where we are today

- POC works: live dynamic page, author-driven content, serverless data
- Built today on **personal** GitHub + **personal** DA sandbox
- Feasibility is proven; production is a different bar — governance, ownership, operations

## Slide 2 — The #1 move

**Move onto org-owned, access-controlled infrastructure**

- Org GitHub repo (not personal)
- Org DA.live space with author roles
- Everything else builds on this — a first decision, not a later cleanup

## Slide 3 — Content & Authoring

*Owner: Content Strategy + Authors*

- Source of truth + publish workflow (draft → preview → publish)
- Templates, reusable blocks, naming conventions for 100s of pages
- Localization + block-library governance

## Slide 4 — Environments & Promotion

*Owner: DevOps / Platform*

- Stage vs Prod defined
- Production domain + CDN + real SEO / robots.txt
- Branch previews → controlled promotion

## Slide 5 — Quality Gates

*Owner: Dev Leads*

- PageSpeed + lint as **required** merge checks (not advisory)
- PR review policy, CODEOWNERS
- App Builder CI/CD pipeline

## Slide 6 — Security

*Owner: Security / InfoSec*

- Secrets managed + rotated (never in code)
- Auth per endpoint (public vs authenticated)
- CORS locked to real origins; PII / consent handling

## Slide 7 — Integrations & Data

*Owner: Backend / Enterprise Systems*

- A contract per data source: schema, auth, rate limits, **SLAs**
- Caching + graceful fallback when upstream is down

## Slide 8 — Operations

*Owner: Run Team*

- Monitoring, logging, alerting
- On-call runbook for publish / action failures
- Performance as an ongoing SLO

## Slide 9 — People & Delivery

*Owner: Program Lead*

- RACI: authors / block devs / App Builder devs / platform
- Onboarding standards + enablement (training series)

## Slide 10 — Proof & Next Steps

- EDS is production-proven: **aem.live** showcase + performance leaderboard
- *(TODO: approved EDS + EW customer reference from Adobe / partner team)*
- **Ask:** approve infrastructure migration + name owners per area
