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
