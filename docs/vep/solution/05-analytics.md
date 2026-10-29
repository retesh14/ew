# 05 · Analytics

Status: not started · Last updated: 2026-10-29

## Requirement
Measure event pages the way sap.com does today.

## Known so far
- sap.com: Adobe Launch (`_satellite`), `adobeDataLayer`, Adobe Analytics via AppMeasurement (`smetrics.sap.com`); Web SDK (`alloy`) not present.
- Also present: Adobe Target, Microsoft Clarity, Meta pixels.
- Edge Delivery provides RUM (real-user performance) out of the box.
- Edge Delivery best practice: load martech in the delayed phase to protect page speed.

## Open questions
- Reuse the sap.com Launch property and report suite, or a VEP-specific one?
- Data layer contract for event pages (page, event ID, registration steps).
- Stay on AppMeasurement or move to Web SDK (ties to 06)?

_Native capability, options, recommendation, gaps, risks and proof to be completed when this topic is worked — see [`_template.md`](_template.md)._
