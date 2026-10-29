# 01 · CDN configuration (Akamai)

Status: not started · Last updated: 2026-10-29

## Requirement
Configure the CDN for VEP event sites, assuming the same vendor as sap.com.

## Known so far
- sap.com and events.sap.com are served by Akamai (`server: AkamaiGHost`, observed 2026-10-29).
- Adobe documents BYO-CDN setup for Akamai, including `X-Forwarded-Host` and push invalidation.
- Closed User Groups enforcement needs an Akamai EdgeWorker (see 02).
- Edge Delivery origin: `main--<repo>--<org>.aem.live`; QA via preview host.

## Open questions
- Same Akamai property as events.sap.com, or a new one?
- Path routing: which events.sap.com paths move to Edge Delivery first (strangler pattern)?
- Who owns Akamai Property Manager and EdgeWorkers on the client side?
- Push invalidation credentials and purge scope.

_Native capability, options, recommendation, gaps, risks and proof to be completed when this topic is worked — see [`_template.md`](_template.md)._
