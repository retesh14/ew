# 12 · Search integration

Status: not started · Last updated: 2026-10-29

## Requirement
Event pages participate in site search the way sap.com does.

## Known so far
- sap.com search: `search.sap.com` (SAP Intelligent Search, UI5 web components on SAP BTP) backed by Coveo (`*.org.coveo.com`), observed 2026-10-29.
- Edge Delivery provides a query index (JSON) per site that can feed external search.

## Open questions
- Index event pages into Coveo — crawler, push API from the query index, or both?
- Search box on event pages: link to search.sap.com or embedded results?
- Metadata/facets needed (event type, region, date) — ties to 13.

_Native capability, options, recommendation, gaps, risks and proof to be completed when this topic is worked — see [`_template.md`](_template.md)._
