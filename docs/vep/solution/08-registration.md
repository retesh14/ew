# 08 · Registration

Status: not started · Last updated: 2026-10-29

## Requirement
Visitors register for events from the event page.

## Known so far
- The live sap.com flow renders a shared Form.io form `vep/vep-event-registration-form` from `forms.services.sap.com`; dropdowns, consents and GDPR text come from SAP APIs; submission goes to SAP forms/CRM (observed 2026-10-21).
- Our DA form copies visible fields only; submit is stubbed; missing the general-marketing consent and communication channels.

## Open questions
- Embed the SAP Form.io form in a block, or post our authorable form to the SAP API?
- How event-specific questions and campaign code attach per event.
- Confirmation page, emails, Day-2 eligibility checks.

_Native capability, options, recommendation, gaps, risks and proof to be completed when this topic is worked — see [`_template.md`](_template.md)._
