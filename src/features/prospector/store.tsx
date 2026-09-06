import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { mockActivities, mockFollowUps, mockLeads } from "@/data/mockData";
import type { Activity, ContactType, FollowUp, Lead, LeadStatus } from "@/types";

type Store = {
  leads: Lead[];
  followUps: FollowUp[];
  activities: Activity[];
  openLeadId: string | null;
  openLead: (id: string | null) => void;
  saveLead: (id: string) => void;
  setStatus: (id: string, status: LeadStatus) => void;
  setNotes: (id: string, notes: string) => void;
  registerContact: (id: string, type: ContactType, note: string) => void;
  logHistory: (id: string, label: string) => void;
  completeFollowUp: (id: string) => void;
  createFollowUp: (leadId: string, label: string) => void;
};

const StoreContext = createContext<Store | null>(null);

const today = "Hoje";

export function ProspectorProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [followUps, setFollowUps] = useState<FollowUp[]>(mockFollowUps);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const pushActivity = useCallback((label: string, lead: string) => {
    setActivities((prev) =>
      [{ id: `${Date.now()}-${Math.random()}`, label, lead, at: "agora" }, ...prev].slice(0, 12),
    );
  }, []);

  const patchLead = useCallback((id: string, patch: (lead: Lead) => Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? patch(l) : l)));
  }, []);

  const logHistory = useCallback(
    (id: string, label: string) => {
      patchLead(id, (l) => ({
        ...l,
        history: [{ id: `${id}-${Date.now()}`, date: today, label }, ...l.history],
      }));
    },
    [patchLead],
  );

  const value = useMemo<Store>(
    () => ({
      leads,
      followUps,
      activities,
      openLeadId,
      openLead: setOpenLeadId,
      saveLead: (id) => {
        patchLead(id, (l) => ({
          ...l,
          saved: true,
          history: [{ id: `${id}-${Date.now()}`, date: today, label: "Lead salvo" }, ...l.history],
        }));
        const lead = leads.find((l) => l.id === id);
        if (lead) pushActivity("Lead salvo", lead.name);
      },
      setStatus: (id, status) => {
        patchLead(id, (l) => ({
          ...l,
          status,
          saved: true,
          history: [
            { id: `${id}-${Date.now()}`, date: today, label: `Status alterado para ${status}` },
            ...l.history,
          ],
        }));
        const lead = leads.find((l) => l.id === id);
        if (lead) pushActivity(`Lead movido para ${status}`, lead.name);
      },
      setNotes: (id, notes) => patchLead(id, (l) => ({ ...l, notes })),
      registerContact: (id, type, note) => {
        patchLead(id, (l) => ({
          ...l,
          saved: true,
          lastContact: "agora",
          status: l.status === "novo" ? "contatado" : l.status,
          history: [
            {
              id: `${id}-${Date.now()}`,
              date: today,
              label: `Contato registrado (${type})${note ? ` — ${note}` : ""}`,
            },
            ...l.history,
          ],
        }));
        const lead = leads.find((l) => l.id === id);
        if (lead) pushActivity("Contato registrado", lead.name);
      },
      logHistory,
      completeFollowUp: (id) => {
        setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, done: true } : f)));
        const fu = followUps.find((f) => f.id === id);
        const lead = leads.find((l) => l.id === fu?.leadId);
        pushActivity("Follow-up concluído", lead?.name ?? "Lead");
      },
      createFollowUp: (leadId, label) => {
        setFollowUps((prev) => [
          ...prev,
          {
            id: `f-${Date.now()}`,
            leadId,
            time: "09:00",
            when: "proximo",
            label,
            done: false,
          },
        ]);
        patchLead(leadId, (l) => ({ ...l, nextFollowUp: "amanhã" }));
        const lead = leads.find((l) => l.id === leadId);
        if (lead) pushActivity("Follow-up criado", lead.name);
      },
    }),
    [leads, followUps, activities, openLeadId, patchLead, pushActivity, logHistory],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useProspector() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useProspector deve ser usado dentro de ProspectorProvider");
  return ctx;
}
