# 06 · AEP, CJA and Real-Time CDP integration

Status: not started · Last updated: 2026-10-29

## Requirement
Feed event engagement into Adobe Experience Platform, Customer Journey Analytics and Real-Time CDP.

## Known so far
- sap.com collects with AppMeasurement, not Web SDK — CJA/AEP then rely on the Analytics source connector.
- Web SDK (Edge Network) sends one stream to Analytics, AEP, Target and CJA.

## Open questions
- Target architecture: Analytics source connector vs. Web SDK migration?
- Identity: which IDs (ECID, CRM ID from registration) stitch profiles?
- Which events/attributes go to the profile (registration, attendance, session views)?

_Native capability, options, recommendation, gaps, risks and proof to be completed when this topic is worked — see [`_template.md`](_template.md)._
