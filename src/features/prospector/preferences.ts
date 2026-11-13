import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { readProspectingPreferences, saveProspectingPreferences } from "@/lib/preferences.functions";
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
function save() {
  if (!owner || !ready) return;
  const user = owner, epoch = generation, snapshot = state;
  saves = saves.catch(() => {}).then(async () => {
    if (user !== owner || epoch !== generation) return;
    try { await saveProspectingPreferences({ data: snapshot }); }
    catch (error) { if (user === owner) toast.error(error instanceof Error ? error.message : "Preferências salvas neste navegador, mas não na conta.", { action: { label: "Tentar novamente", onClick: save } }); }
  });
}
export function selectProspectingCountry(country: ProspectCountry) { state = { ...state, country }; revision++; persist(); emit(); save(); }
export function setCountryPreference(country: ProspectCountry, patch: Partial<CountryPreference>) { state = updateCountryPreference(state, country, patch); revision++; persist(); emit(); save(); }
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
    const hydrate = async (userId: string | null) => {
      const epoch = ++generation;
      owner = userId; ready = false;
      try { state = parsePreferences(JSON.parse(localStorage.getItem(storageKey()) ?? "null")); } catch { state = DEFAULT_PREFERENCES; }
      // Preserve the previous country for signed-out browsers upgrading to this version.
      if (!userId && !localStorage.getItem(KEY)) state = parsePreferences({ country: localStorage.getItem("prospector:country:v1"), countries: {} });
      emit();
      const startRevision = revision;
      try {
        if (userId) {
          const cloud = await readProspectingPreferences();
          if (!active || epoch !== generation) return;
          if (cloud && startRevision === revision) { state = parsePreferences(cloud); persist(); emit(); }
          ready = true;
          if (!cloud || startRevision !== revision) save();
        } else ready = true;
      } catch { if (active && epoch === generation) { ready = true; toast.error("Não foi possível recuperar suas preferências da conta. Suas escolhas locais foram mantidas."); } }
    };
    void supabase.auth.getSession().then(({ data }) => { if (active) void hydrate(data.session?.user.id ?? null); });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || event === "SIGNED_IN" && session?.user.id !== owner) setTimeout(() => { if (active) void hydrate(session?.user.id ?? null); }, 0);
    });
    return () => { active = false; generation++; data.subscription.unsubscribe(); };
  }, [enabled]);
}