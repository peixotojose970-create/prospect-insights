import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { readProspectingPreferences, saveProspectingPreferences, patchProspectingPreferences } from "@/lib/preferences.functions";
import type { ProspectCountry } from "@/types";
import { countryPreference, DEFAULT_PREFERENCES, parsePreferences, updateCountryPreference, type CountryPreference } from "./preference-model";
const KEY = "prospector:country-preferences:v1";
let state = DEFAULT_PREFERENCES;
let owner: string | null = null;
let ready = false;
let revision = 0;
let generation = 0;
let saves: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());
const storageKey = () => owner ? `${KEY}:${owner}` : KEY;
function persist() { try { localStorage.setItem(storageKey(), JSON.stringify(state)); } catch { /* Cloud remains primary for signed-in users. */ } }
function save(change?: { country?: ProspectCountry; preferenceCountry?: ProspectCountry; patch: Partial<CountryPreference> }) {
  if (!owner || !ready) return;
  const user = owner, epoch = generation, snapshot = state;
  saves = saves.catch(() => {}).then(async () => {
    if (user !== owner || epoch !== generation) return;
    try { if (change) await patchProspectingPreferences({ data: change }); else await saveProspectingPreferences({ data: snapshot }); }
    catch (error) { if (user === owner) toast.error(error instanceof Error ? error.message : "Preferências salvas neste navegador, mas não na conta.", { action: { label: "Tentar novamente", onClick: () => save(change) } }); }
  });
}
export function selectProspectingCountry(country: ProspectCountry) { state = { ...state, country }; revision++; persist(); emit(); save({ country, patch: {} }); }
export function setCountryPreference(country: ProspectCountry, patch: Partial<CountryPreference>) { state = updateCountryPreference(state, country, patch); revision++; persist(); emit(); save({ preferenceCountry: country, patch }); }
export function useProspectingPreferences() {
  return useSyncExternalStore((fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => state, () => DEFAULT_PREFERENCES);
}
export function useCountryPreference(country: ProspectCountry) {
  const preferences = useProspectingPreferences();
  return countryPreference(preferences, country);
}
export function usePreferenceSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey() || !event.newValue) return;
      try { state = parsePreferences(JSON.parse(event.newValue)); revision++; emit(); } catch { /* Keep current valid state. */ }
    };
    window.addEventListener("storage", onStorage);
    const hydrate = async (userId: string | null) => {
      const epoch = ++generation;
      owner = userId; ready = false;
      try { state = parsePreferences(JSON.parse(localStorage.getItem(storageKey()) ?? "null")); } catch { state = DEFAULT_PREFERENCES; }
      let restored = false;
      try { const keys = JSON.parse(localStorage.getItem("prospector:restored-preferences:v1") ?? "[]") as string[]; restored = keys.includes(storageKey()); if (restored) localStorage.setItem("prospector:restored-preferences:v1", JSON.stringify(keys.filter(key => key !== storageKey()))); } catch { /* Keep local choices. */ }
      // Preserve the previous country for signed-out browsers upgrading to this version.
      if (!userId && !localStorage.getItem(KEY)) state = parsePreferences({ country: localStorage.getItem("prospector:country:v1"), countries: {} });
      emit();
      const startRevision = revision;
      try {
        if (userId) {
          const cloud = await readProspectingPreferences();
          if (!active || epoch !== generation) return;
          if (cloud && !restored && startRevision === revision) { state = parsePreferences(cloud); persist(); emit(); }
          ready = true;
          if (!cloud || restored || startRevision !== revision) save();
        } else ready = true;
      } catch { if (active && epoch === generation) { ready = true; toast.error("Não foi possível recuperar suas preferências da conta. Suas escolhas locais foram mantidas."); } }
    };
    void supabase.auth.getSession().then(({ data }) => { if (active) void hydrate(data.session?.user.id ?? null); });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || event === "SIGNED_IN" && session?.user.id !== owner) setTimeout(() => { if (active) void hydrate(session?.user.id ?? null); }, 0);
    });
    return () => { active = false; generation++; data.subscription.unsubscribe(); window.removeEventListener("storage", onStorage); };
  }, [enabled]);
}