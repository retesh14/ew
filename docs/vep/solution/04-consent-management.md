# 04 · Consent management (TrustArc)

Status: not started · Last updated: 2026-10-29

## Requirement
Respect visitor consent across all tracking and martech on event pages.

## Known so far
- sap.com uses TrustArc (`consent.trustarc.com`, `truste` global).
- Edge Delivery has no built-in consent manager; consent is a client tag integration.
- Edge Delivery RUM is cookieless and samples by design — confirm with privacy team whether it needs consent.

## Open questions
- Same TrustArc instance and categories as sap.com?
- How consent state reaches Launch, Target, Marketo, AEP (Web SDK consent command if adopted).
- Load TrustArc without hurting performance (delayed vs. early load for the banner).

_Native capability, options, recommendation, gaps, risks and proof to be completed when this topic is worked — see [`_template.md`](_template.md)._
