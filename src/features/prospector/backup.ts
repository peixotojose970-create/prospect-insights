import { z } from "zod";

const record = z.object({ id: z.string().min(1) }).passthrough();
const business = record.extend({ name: z.string().min(1), category: z.string(), latitude: z.number().finite(), longitude: z.number().finite(), score: z.number().finite(), scoreFactors: z.array(z.object({ label: z.string(), points: z.number() })), photoRefs: z.array(z.string()), photoAttributions: z.array(z.string()) }).passthrough();
const lead = business.extend({ status: z.enum(["novo","contatado","respondeu","interessado","negociacao","fechado","perdido"]), notes: z.string(), savedAt: z.string(), history: z.array(record.extend({ date: z.string(), label: z.string() })) }).passthrough();
const crmSchema = z.object({ leads: z.array(lead), followUps: z.array(record.extend({ leadId: z.string(), date: z.string(), label: z.string(), done: z.boolean() })), activities: z.array(record.extend({ label: z.string(), lead: z.string(), at: z.string() })), savedSearches: z.array(record.extend({ category: z.string(), query: z.string() })), sales: z.array(record.extend({ clientName: z.string(), totalValue: z.number(), receivedValue: z.number() })), monthlySalesGoal: z.number().finite().nonnegative(), selection: z.array(business), profile: z.object({ personalName: z.string(), companyName: z.string() }), emails: z.record(z.string(), z.string()) }).passthrough();
const fixedKeys = new Set(["prospector:v1","prospector:templates:v1","prospector:contacted:v1","prospector:country-preferences:v1","prospector:country:v1","prospector:message-lang:v2","prospector:accent","prospector:hud","prospector:display-mode","prospector:map-minimized:v1","prospector:install-dismissed"]);
export const RECOVERY_KEY = "prospector:complete-recovery:v2";
const RESTORED_KEY = "prospector:restored-preferences:v1";
const allowed = (key: string) => fixedKeys.has(key) || /^prospector:country-preferences:v1:[0-9a-f-]{36}$/i.test(key);
export type CompleteBackup = { format: "prospector-backup-v2"; createdAt: string; entries: Record<string,string> };
export function validateBackupEntry(key: string, value: string) {
  if (!allowed(key)) throw new Error("O backup contém dados fora do escopo do Prospector.");
  if (key === "prospector:v1") crmSchema.parse(JSON.parse(value));
  else if (key === "prospector:contacted:v1") z.array(z.string()).parse(JSON.parse(value));
  else if (key === "prospector:templates:v1") z.object({ overrides: z.record(z.string(), z.object({ title: z.string().optional(), first: z.string().optional(), second: z.string().optional() })), custom: z.array(z.object({ id: z.string(), title: z.string(), first: z.string(), second: z.string() })) }).parse(JSON.parse(value));
  else if (key.startsWith("prospector:country-preferences:v1")) z.object({ country: z.enum(["BR","US","PT","ES","FR","IT"]), countries: z.record(z.enum(["BR","US","PT","ES","FR","IT"]), z.object({ style: z.string().min(1).max(200), language: z.enum(["auto","pt","pt-PT","es","fr","it","en"]) })) }).parse(JSON.parse(value));
}
export function createCompleteBackup(storage: Storage): CompleteBackup {
  const entries: Record<string,string> = {};
  for (let i=0;i<storage.length;i++) {
    const key = storage.key(i);
    if (!key || !allowed(key)) continue;
    const raw = storage.getItem(key);
    if (raw === null) continue;
    validateBackupEntry(key,raw); entries[key]=raw;
  }
  return { format: "prospector-backup-v2", createdAt: new Date().toISOString(), entries };
}
export function parseBackup(raw: string): CompleteBackup {
  if (raw.length > 20_000_000) throw new Error("Backup excede 20 MB.");
  const input = JSON.parse(raw);
  if (input?.format === "prospector-backup-v1") {
    crmSchema.parse(input.data);
    return { format: "prospector-backup-v2", createdAt: input.createdAt ?? "", entries: { "prospector:v1": JSON.stringify(input.data) } };
  }
  const backup = z.object({ format: z.literal("prospector-backup-v2"), createdAt: z.string(), entries: z.record(z.string(), z.string()) }).parse(input);
  for (const [key,value] of Object.entries(backup.entries)) validateBackupEntry(key,value);
  return backup;
}
export function restoreCompleteBackup(storage: Storage, backup: CompleteBackup) {
  for (const [key,value] of Object.entries(backup.entries)) validateBackupEntry(key,value);
  const before = createCompleteBackup(storage);
  storage.setItem(RECOVERY_KEY, JSON.stringify(before)); // Fail before changes if recovery cannot be persisted.
  const changed: string[] = [];
  const previous = new Map<string,string|null>();
  try {
    for (const [key,raw] of Object.entries(backup.entries)) {
      previous.set(key,storage.getItem(key)); changed.push(key);
      const value = key === "prospector:contacted:v1" ? JSON.stringify([...new Set([...JSON.parse(storage.getItem(key) ?? "[]"), ...JSON.parse(raw)])]) : raw;
      storage.setItem(key,value);
    }
    const restored = Object.keys(backup.entries).filter((key)=>key.startsWith("prospector:country-preferences:v1"));
    previous.set(RESTORED_KEY, storage.getItem(RESTORED_KEY)); changed.push(RESTORED_KEY);
    storage.setItem(RESTORED_KEY,JSON.stringify(restored));
  } catch {
    for (const key of changed.reverse()) {
      const old=previous.get(key);
      if (old == null) storage.removeItem(key); else storage.setItem(key,old);
    }
    throw new Error("Não foi possível restaurar. Os dados anteriores foram mantidos; verifique o espaço do navegador.");
  }
}