# 02 · Authentication and session propagation

Status: draft · Last updated: 2026-10-29

## Requirement
Authentication and sessions must work across the proposed Experience Workspace / Edge Delivery
landscape — for authors and admins, and for visitors where event pages need a login.

## Native capability
Three identity layers, each with its own control ([Permissions and security](https://www.aem.live/docs/ew/administering/permissions)):

| Layer | Identity | Configured in |
|---|---|---|
| Authoring (Experience Workspace) | Adobe IMS: org, IMS group, email | EW org config, `permissions` tab |
| Preview / publish (Edge Delivery) | email, email wildcard, Edge Delivery group | Config Service (`tools.aem.live` user admin) |
| Site visitors | client IdP | Closed User Groups sheet + CDN edge worker |

- **Authors:** one Adobe IMS sign-in covers Experience Workspace, Sidekick, protected preview and the
  agents. IMS can federate to the client IdP ("bring your own identity provider … through built-in IMS
  integration").
- **Site authentication** protects a whole site with a token. Adobe: "Only *authentication* is
  supported. *Authorization* is not supported" and it applies to the entire site — right for a QA
  site, not for attendee access ([Site authentication](https://www.aem.live/docs/authentication-setup-site)).
- **Closed User Groups** protect paths for visitors: a `closed-user-groups` sheet (`url`,
  `cug-required`, `cug-groups`, `cug-login-path`) is applied from Experience Workspace with the CUG
  plugin; the CDN enforces it ([CUG](https://www.aem.live/developer/closed-user-groups)).

## Options
| Option | How it works | Pros | Cons |
|---|---|---|---|
| A. Public event pages, gated registration | No visitor login; registration form identifies the user | Simplest; fastest pages | No attendee-only content |
| B. CUG + Akamai EdgeWorker + SAP IdP | Edge checks login and group per path, redirects to SAP login | Path-level attendee access | Custom EdgeWorker; CUG is lifecycle stage 2 |
| C. Site-wide token auth | Whole site behind a token | Native, simple | No per-user or per-group access |

## Recommended solution
- **Authors and admins:** Adobe IMS federated to the client IdP (SSO). No extra build.
- **Visitors:** Option A by default. Option B only for events that truly need attendee-only pages —
  based on Adobe's sample Akamai EdgeWorker, switched from Adobe IMS to the SAP IdP.
- **QA site:** Option C (token) or Akamai IP allow-list.

## Gaps and custom work
- Akamai EdgeWorker for CUG with SAP IdP (OAuth/OIDC + PKCE), session cookie, header stripping. Medium.
- Adobe notes an Akamai EdgeWorker can only call hostnames on the same Akamai property, so the IdP
  token exchange must be routed through a Property Manager rule.

## Risks and open questions
| Item | Owner |
|---|---|
| Do any event pages need visitor login, or only registration? Decides A vs B. | Client |
| CUG is lifecycle stage 2 in Adobe docs — production readiness | Adobe |
| Which SAP IdP (and OIDC details) the EdgeWorker would use | Client |
| IMS federation already in place for the client org? | Client |

## Proof
| # | Test | Pass condition |
|---|---|---|
| 1 | Author SSO | One federated sign-in reaches Experience Workspace, protected preview and Sidekick without re-login |
| 5 | Visitor access (if B) | Unauthenticated visitor to a protected event page is sent to SAP login; access then depends on group |
| 6 | Decommission (if B) | Removing one event's CUG row leaves other events protected |

## Sources
aem.live: Permissions and security, Site authentication, Closed User Groups (read 2026-10-27).
