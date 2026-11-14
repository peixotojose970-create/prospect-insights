<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Category browsing derives groups and selectable subcategories from existing country-specific search terms; expand the catalog only after checking the user's source list to avoid invented or omitted categories.
- Opportunity quick mode uses the shared Prospector store's search and save actions, never a separate provider or CRM; filtering saved/contacted companies stays local to this mode to preserve Prospecção rápida.
- Prospecção uses one existing CategoryPicker; multi-category searches call the shared search action sequentially and append results to preserve provider logic and deduplication.
- Country metadata lives in a shared browser-safe configuration; international Places calls validate a geocoded rectangle and returned country, with bounded sequential pages and a query-bound continuation cursor to avoid cross-country leakage.
- International search requires a verified app session before billable calls; legacy Brazilian search is unchanged to preserve the existing quick flow.
- Non-quick outreach translates both existing Brazilian message stages faithfully, with bounded requests and explicit loading/error states; /rapido retains its legacy message path and phone-helper defaults.
- Prospecting preferences use one owner-scoped cloud row with a per-country map and user-scoped local fallback; serialize writes to prevent older selections overwriting newer choices.
- Places calls reserve budget through a service-only atomic SQL function that locks settings before usage; accounting failures must prevent external requests to enforce the shared ceiling across workers.
- Global limit writes require authenticated roles in a separate protected user_roles table and a caller-scoped SQL authorization check; no automatic admin assignment is allowed.
- Website analysis validates public DNS on every manual redirect and bounds streamed bodies; DNS preflight must never be described as connection-time DNS-rebinding protection without verified egress guarantees.
- Complete local backups use an explicit non-auth storage allowlist, validate before writes, retain pre-restore recovery, and roll back failed writes; CRM remains local until a separate migration plan is approved.
- CSV interchange uses record-aware parsing and stable identities with direct CRM imports; never rebuild imported leads through the new-lead action because it resets commercial state.
- Shared search continuation keeps a queue per category and query-bound provider cursors; reject obsolete search generations and retain failed continuations for retry.
- Non-quick establishment matching uses source identity or name plus address; shared domains and truncated phone suffixes must not hide distinct branches, while the quick legacy path remains unchanged.
- Preference mutations patch only changed country fields atomically under owner RLS; restored current-user preferences intentionally sync once after hydration.
- Public resource operations reserve service-only atomic global minute budgets before external work; global keys avoid spoofable client IP trust and unbounded storage, but do not provide per-user fairness or DDoS protection.
