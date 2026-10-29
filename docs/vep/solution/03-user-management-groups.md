# 03 · User management and groups provisioning

Status: draft · Last updated: 2026-10-29

## Requirement
Event-specific groups can be created and decommissioned dynamically, and authors/admins are
restricted to only their event's content.

## Native capability
- **Authoring access by path** ([Access control](https://www.aem.live/docs/ew/administering/access-control)):
  `permissions` tab rows of `path` · `groups` · `actions` (`read`, `write`, empty = deny). Groups are
  IMS org IDs, `orgid/group`, or emails. Longest matching path wins per group; results are merged.
  Example: `/vep/houston/+**` → `<orgid>/vep-houston-authors` → `write`.
- **Preview / publish roles** are set per **site** in the Config Service (`admin/role/author`,
  `admin/role/publish`), keyed by email, wildcard or Edge Delivery group — not by IMS group and not
  by path.
- **Request Publish** assigns approvers **per path** (`publish-workflow-config`: `pattern` ·
  `approvers` · `CC`). Authors need `basic_author`, approvers `basic_publish`. Requires onboarding
  by Adobe and a client email provider ([Request publish](https://www.aem.live/docs/ew/administering/request-publish)).
- The assistant (Coworker) can drive request publish, scheduling and permissions through the
  AEM agentic plugins, acting only as the signed-in user ([Agentic plugins](https://www.aem.live/docs/ew/administering/agentic-plugins)).

## Recommended solution
1. **One IMS group per event** in Admin Console (`vep-<event>-authors`), plus a shared
   `vep-release-managers` group.
2. **Authoring isolation** with one permissions row per event folder.
3. **Publish control** through Request Publish, approvers per event path; only release managers
   hold the direct `publish` role.
4. **Provisioning script** (App Builder action or CI job) that, for a new event: creates the IMS
   group, adds the permissions row, adds the Edge Delivery group/role entries, adds the approver
   rule — and reverses all four on decommission.

## Gaps and custom work
- Provisioning/decommission script across Admin Console API, Experience Workspace config, Config
  Service. Medium.
- Two group systems (IMS for authoring, Edge Delivery for preview/publish) kept in sync by that script.

## Risks and open questions
| Item | Owner |
|---|---|
| New group membership applies after the user signs out and in again | Accept / document |
| Restricted authors can still see other events' folder names (ACLs don't hide names) | Accept / stage sensitive work in a locked folder |
| Request Publish onboarding lead time and email provider | Adobe / client |
| Who owns Admin Console and API credentials for the script | Client |
| Admin Console user-management API specifics — confirm current version | Us (verify) |

## Proof
| # | Test | Pass condition |
|---|---|---|
| 2 | Authoring isolation | Houston author edits `/vep/houston`, gets 403 on `/vep/chicago` |
| 3 | Group lifecycle | Script creates and removes an event's groups and rules; access disappears after re-login |
| 4 | Publish control | Houston publish request goes only to Houston approvers; direct publish denied |

## Sources
aem.live: Access control, Permissions and security, Request publish, Agentic plugins, Configuring
authentication for authors (read 2026-10-27).
