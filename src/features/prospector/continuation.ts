import type { SearchCriteria, SearchOutcome } from "@/types";
export function searchIdentity(c: SearchCriteria) { return JSON.stringify([c.country??"BR",c.category,c.state,c.city,c.locations??[],c.term??""]); }
export function nextCriteria(c: SearchCriteria, outcome: SearchOutcome): SearchCriteria | null {
  if(outcome.nextPageToken) return {...c,pageToken:outcome.nextPageToken};
  if(outcome.coverage?.hasMoreAreas) { const { pageToken: _token, ...base }=c; return {...base,discoveryOffset:(c.discoveryOffset??0)+3}; }
  return null;
}
export function updateContinuations(queue: SearchCriteria[], c: SearchCriteria, outcome: SearchOutcome) {
  const remaining=queue.filter(item=>searchIdentity(item)!==searchIdentity(c));
  const next=nextCriteria(c,outcome);
  return next?[...remaining,next]:remaining;
}