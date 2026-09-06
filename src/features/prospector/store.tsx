import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { businessSearchRepository } from "./repository";
import type { SearchErrorCode } from "@/lib/business-search.functions";
import type {
  Activity,
  Business,
  ContactType,
  FollowUp,
  Lead,
  LeadStatus,
  SavedSearch,
  SearchCriteria,
  SearchOutcome,
} from "@/types";

const STORAGE_KEY = "prospector:v1";
const CLIENT_TIMEOUT_MS = 32_000;

type Persisted = {
  leads: Lead[];
  followUps: FollowUp[];
  activities: Activity[];
  savedSearches: SavedSearch[];
};

type SearchState = {
  status: "idle" | "loading" | "success" | "error";
  results: Business[];
  outcome: SearchOutcome | null;
  error: { code: SearchErrorCode; message: string; detail?: string } | null;
  criteria: SearchCriteria | null;
};

type Store = {
  leads: Lead[];
  followUps: FollowUp[];
  activities: Activity[];
  savedSearches: SavedSearch[];
  search: SearchState;
  runSearch: (criteria: SearchCriteria, append?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  loadingMore: boolean;
  clearSearch: () => void;

  openId: string | null;
  openLead: (id: string | null) => void;
  findById: (id: string) => Business | Lead | undefined;
  isSaved: (id: string) => boolean;
  sourceName: string;
  saveLead: (business: Business) => void;
  removeLead: (id: string) => void;
  setStatus: (id: string, status: LeadStatus) => void;
  setNotes: (id: string, notes: string) => void;
  registerContact: (id: string, type: ContactType, note: string) => void;
  logHistory: (id: string, label: string) => void;
  completeFollowUp: (id: string) => void;
  createFollowUp: (leadId: string, label: string, date: string) => void;
  toggleFavorite: (id: string) => void;
  setNextAction: (id: string, action: string) => void;
  setTags: (id: string, tags: string[]) => void;
  removeSavedSearch: (id: string) => void;
};

const StoreContext = createContext<Store | null>(null);

const emptyState: Persisted = { leads: [], followUps: [], activities: [], savedSearches: [] };

function load(): Persisted {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      leads: parsed.leads ?? [],
      followUps: parsed.followUps ?? [],
      activities: parsed.activities ?? [],
      savedSearches: parsed.savedSearches ?? [],
    };
  } catch {
    return emptyState;
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function stamp() {
  return new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function ProspectorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState<SearchState>({
    status: "idle",
    results: [],
    outcome: null,
    error: null,
    criteria: null,
  });

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const pushActivity = useCallback((label: string, lead: string) => {
    setState((prev) => ({
      ...prev,
      activities: [{ id: `${Date.now()}-${Math.random()}`, label, lead, at: stamp() }, ...prev.activities].slice(0, 20),
    }));
  }, []);

  const patchLead = useCallback((id: string, patch: (lead: Lead) => Lead) => {
    setState((prev) => ({ ...prev, leads: prev.leads.map((l) => (l.id === id ? patch(l) : l)) }));
  }, []);

  const historyEntry = (label: string) => ({ id: `${Date.now()}-${Math.random()}`, date: stamp(), label });

  const runSearch = useCallback(async (criteria: SearchCriteria, append = false) => {
    if (append) setLoadingMore(true);
    else setSearch({ status: "loading", results: [], outcome: null, error: null, criteria });

    let result: Awaited<ReturnType<typeof businessSearchRepository.search>>;
    try {
      // Rede de segurança: nenhuma busca pode ficar carregando para sempre.
      result = await Promise.race([
        businessSearchRepository.search(criteria),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout-cliente")), CLIENT_TIMEOUT_MS),
        ),
      ]);
    } catch (error) {
      const timeout = (error as Error)?.message === "timeout-cliente";
      setLoadingMore(false);
      setSearch((prev) => ({
        status: "error",
        results: append ? prev.results : [],
        outcome: append ? prev.outcome : null,
        error: {
          code: timeout ? "timeout" : "rede",
          message: timeout
            ? "A pesquisa demorou mais que o esperado."
            : "Não foi possível consultar o Google Maps.",
          detail: (error as Error)?.message,
        },
        criteria,
      }));
      return;
    } finally {
      setLoadingMore(false);
    }

    if (!result.ok) {
      setSearch((prev) => ({
        status: "error",
        results: append ? prev.results : [],
        outcome: append ? prev.outcome : null,
        error: {
          code: result.ok ? "rede" : result.code,
          message: result.ok ? "" : result.message,
          ...(!result.ok && result.detail ? { detail: result.detail } : {}),
        },
        criteria,
      }));
      return;
    }

    const outcome = result.outcome;
    setSearch((prev) => {
      const results = append ? [...prev.results, ...outcome.businesses] : outcome.businesses;
      const seen = new Set<string>();
      const unique = results.filter((b) => (seen.has(b.id) ? false : (seen.add(b.id), true)));
      return {
        status: "success",
        results: unique,
        outcome: { ...outcome, total: unique.length },
        error: null,
        criteria,
      };
    });

    if (append) return;
    setState((prev) => ({
      ...prev,
      savedSearches: [
        {
          id: `${Date.now()}`,
          category: criteria.category,
          city: criteria.city,
          state: criteria.state,
          query: `${criteria.category} em ${criteria.city} - ${criteria.state}`,
          at: stamp(),
          results: outcome.total,
        },
        ...prev.savedSearches.filter(
          (s) => !(s.category === criteria.category && s.city === criteria.city && s.state === criteria.state),
        ),
      ].slice(0, 15),
    }));
  }, []);

  const loadMore = useCallback(async () => {
    const token = search.outcome?.nextPageToken;
    if (!token || !search.criteria || loadingMore) return;
    await runSearch({ ...search.criteria, pageToken: token }, true);
  }, [search.outcome, search.criteria, loadingMore, runSearch]);


  const value = useMemo<Store>(() => {
    const { leads, followUps, activities, savedSearches } = state;
    return {
      leads,
      followUps,
      activities,
      savedSearches,
      search,
      runSearch,
      loadMore,
      loadingMore,

      clearSearch: () =>
        setSearch({ status: "idle", results: [], outcome: null, error: null, criteria: null }),
      openId,
      openLead: setOpenId,
      findById: (id) => leads.find((l) => l.id === id) ?? search.results.find((b) => b.id === id),
      isSaved: (id) => leads.some((l) => l.id === id),
      sourceName: businessSearchRepository.sourceName,
      saveLead: (business) => {
        setState((prev) => {
          if (prev.leads.some((l) => l.id === business.id)) return prev;
          const lead: Lead = {
            ...business,
            status: "novo",
            savedAt: stamp(),
            notes: "",
            lastContact: null,
            nextFollowUp: null,
            history: [{ id: `${Date.now()}`, date: stamp(), label: "Lead salvo a partir do Google Maps" }],
          };
          return {
            ...prev,
            leads: [lead, ...prev.leads],
            activities: [
              { id: `${Date.now()}-s`, label: "Lead salvo", lead: business.name, at: stamp() },
              ...prev.activities,
            ].slice(0, 20),
          };
        });
      },
      removeLead: (id) =>
        setState((prev) => ({
          ...prev,
          leads: prev.leads.filter((l) => l.id !== id),
          followUps: prev.followUps.filter((f) => f.leadId !== id),
        })),
      setStatus: (id, status) => {
        patchLead(id, (l) => ({
          ...l,
          status,
          history: [historyEntry(`Status alterado para ${status}`), ...l.history],
        }));
        const lead = leads.find((l) => l.id === id);
        if (lead) pushActivity(`Lead movido para ${status}`, lead.name);
      },
      setNotes: (id, notes) => patchLead(id, (l) => ({ ...l, notes })),
      registerContact: (id, type, note) => {
        patchLead(id, (l) => ({
          ...l,
          lastContact: stamp(),
          status: l.status === "novo" ? "contatado" : l.status,
          history: [historyEntry(`Contato registrado (${type})${note ? ` — ${note}` : ""}`), ...l.history],
        }));
        const lead = leads.find((l) => l.id === id);
        if (lead) pushActivity("Contato registrado", lead.name);
      },
      logHistory: (id, label) => patchLead(id, (l) => ({ ...l, history: [historyEntry(label), ...l.history] })),
      completeFollowUp: (id) => {
        setState((prev) => ({
          ...prev,
          followUps: prev.followUps.map((f) => (f.id === id ? { ...f, done: true } : f)),
        }));
        const fu = followUps.find((f) => f.id === id);
        const lead = leads.find((l) => l.id === fu?.leadId);
        pushActivity("Follow-up concluído", lead?.name ?? "Lead");
      },
      createFollowUp: (leadId, label, date) => {
        setState((prev) => ({
          ...prev,
          followUps: [
            ...prev.followUps,
            { id: `f-${Date.now()}`, leadId, date: date || todayISO(), time: "09:00", label, done: false },
          ],
          leads: prev.leads.map((l) => (l.id === leadId ? { ...l, nextFollowUp: date || todayISO() } : l)),
        }));
        const lead = leads.find((l) => l.id === leadId);
        if (lead) pushActivity("Follow-up criado", lead.name);
      },
      removeSavedSearch: (id) =>
        setState((prev) => ({ ...prev, savedSearches: prev.savedSearches.filter((s) => s.id !== id) })),
    };
  }, [state, search, openId, runSearch, loadMore, loadingMore, patchLead, pushActivity]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useProspector() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useProspector deve ser usado dentro de ProspectorProvider");
  return ctx;
}
