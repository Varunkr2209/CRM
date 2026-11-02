# PulseDesk — Colombia Careline CRM prototype

## Included
- `index.html`: CRM page markup and entry point.
- `styles.css`: responsive CRM styling.
- `app.js`: contacts, case workflows, storage and UI behavior.
- `supabase-schema.sql`: Colombia-scoped Supabase starter schema for contacts, cases, comments and case activity, including a migration from the earlier demo ticket statuses.

## Run the prototype
Keep `index.html`, `styles.css` and `app.js` in the same folder, then open `index.html` in a browser. No installation is needed. The case queue starts empty; users can create cases from the overview, case queue or top navigation. Contacts and newly created cases are stored in that browser's local storage and are not shared with teammates.

The earlier empty-queue update cleared its demo cases. This Colombia update preserves cases created since then and keeps existing contacts, setting their end market to Colombia.

## Careline workflow included
- Create a consumer contact before recording a case; the sample form intentionally avoids collecting date of birth or government ID.
- Search and edit contact profiles, and review each contact's case history.
- Record the touchpoint (Care Line, Email, Social DM or Live Chat), case type, brand and optional product details.
- Adverse-effect reports are automatically marked Urgent and Escalated for Quality review.
- Select a closure reason before resolving or closing a case.
- Reference targets from the KT plan are shown as guidance only; verify current Colombia-specific processes before operational use.

Seeded contacts are fictional examples. The browser prototype has no authentication, backend, approved privacy controls or production integrations. Do not enter real consumer data.

## Enable real six-person shared access
1. Get company approval before using any customer or ticket data in an external service.
2. Create a Supabase project under an approved company account.
3. Run `supabase-schema.sql` in Supabase SQL Editor. The script creates the Careline contact and case fields, restricts the end market to Colombia, and updates the earlier PulseDesk demo status constraints.
4. Enable Email/Password or company SSO authentication. Invite only the approved team accounts and associate each account with its team profile.
5. In Supabase Database > Publications, enable Realtime for `contacts` and `tickets` if shared live updates are needed.
6. Deploy the frontend to an approved HTTPS host (for example, company hosting or an approved Replit/Vercel workspace).
7. Add Supabase client integration to the frontend using the project URL and anon/publishable key. Never put the service-role key in browser code.
8. Replace local demo storage with authenticated database reads/writes and subscribe to contact and case changes via Supabase Realtime.

## Suggested production additions
- Replace broad starter RLS policies with role-aware team and market access; validate all input server-side.
- Add approved retention, deletion, consent, audit, attachment, SLA and escalation handling before storing consumer records.
- Use synthetic data until security, privacy and IT approvals are complete.

## Data model
- `team_members`: approved team profiles, linked to authenticated accounts.
- `contacts`: minimum contact details and end market.
- `tickets`: case type, touchpoint, brand/product details, priority, status, assignee and closure reason.
- `ticket_comments` and `case_activity`: case discussion and activity history.

## Important limitation
The browser prototype demonstrates the workflow but is not a live multi-user service. Supabase authentication, frontend integration, role-aware policies and deployment still need to be implemented and approved. The SQL is a starter schema, not a production-ready CRM.
