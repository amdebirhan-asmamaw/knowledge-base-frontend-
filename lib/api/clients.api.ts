import { apiAxios } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ObservationType = "like" | "dislike" | "preference" | "behavior" | "communication" | "general";
export type SentimentType = "positive" | "negative" | "neutral";
export type ClientStatus = "prospect" | "active" | "at-risk" | "paused" | "churned";
export type ClientTier = "enterprise" | "mid-market" | "smb" | "startup" | "";
export type ContactRole =
  | "ceo" | "cto" | "cfo" | "coo"
  | "manager" | "director" | "vp"
  | "developer" | "designer" | "analyst"
  | "sales" | "hr" | "legal" | "finance" | "other";

export interface Contact {
  _id: string;
  clientId: string;
  name: string;
  role: ContactRole;
  department: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  _id: string;
  name: string;
  company: string;
  industry: string;
  website: string;
  size: string;
  status: ClientStatus;
  tier: ClientTier;
  email: string;
  phone: string;
  tags: string[];
  summary: string;
  lastContactedAt: string | null;
  contactCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ObservationAuthor {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  position?: string;
}

export interface ObservationContact {
  _id: string;
  name: string;
  role: ContactRole;
  email?: string;
  phone?: string;
}

export interface Observation {
  _id: string;
  clientId: string;
  contactId?: string | ObservationContact | null;
  type: ObservationType;
  content: string;
  tags: string[];
  sentiment: SentimentType;
  authorId: string | ObservationAuthor;
  authorName: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssignedEmployee {
  _id: string;
  name: string;
  email: string;
  position?: string;
  department?: { _id: string; name: string } | string;
  avatar?: string;
}

export interface ClientListResult {
  clients: Client[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ClientStats {
  total: number;
  byStatus: {
    active: number;
    prospect: number;
    atRisk: number;
    paused: number;
    churned: number;
  };
  byTier: {
    enterprise: number;
    midMarket: number;
    smb: number;
    startup: number;
  };
}

export interface ClientDetail {
  client: Client;
  assignedEmployees: AssignedEmployee[];
  typeCounts: Record<ObservationType, number>;
  contacts: Contact[];
  healthScore: number; // 0–100
}

// ─── Client CRUD ──────────────────────────────────────────────────────────────

export const listClients = (params?: {
  search?: string;
  tag?: string;
  industry?: string;
  status?: ClientStatus;
  tier?: ClientTier;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}): Promise<ClientListResult> =>
  apiAxios.get("/clients", { params }).then((r) => r.data.data);

export const getClientStats = (): Promise<ClientStats> =>
  apiAxios.get("/clients/stats").then((r) => r.data.data);

export const getClient = (id: string): Promise<ClientDetail> =>
  apiAxios.get(`/clients/${id}`).then((r) => r.data.data);

export const createClient = (data: Partial<Client>): Promise<Client> =>
  apiAxios.post("/clients", data).then((r) => r.data.data);

export const updateClient = (id: string, data: Partial<Client>): Promise<Client> =>
  apiAxios.put(`/clients/${id}`, data).then((r) => r.data.data);

export const deleteClient = (id: string) => apiAxios.delete(`/clients/${id}`);

export const touchClient = (id: string): Promise<Client> =>
  apiAxios.post(`/clients/${id}/touch`).then((r) => r.data.data);

export const assignEmployeesToClient = (
  id: string,
  employeeIds: string[]
): Promise<{ client: Client; assignedEmployees: AssignedEmployee[] }> =>
  apiAxios.put(`/clients/${id}/assign-employees`, { employeeIds }).then((r) => r.data.data);

// ─── Contact CRUD ──────────────────────────────────────────────────────────────

export const listContacts = (clientId: string): Promise<Contact[]> =>
  apiAxios.get(`/clients/${clientId}/contacts`).then((r) => r.data.data);

export const createContact = (
  clientId: string,
  data: { name: string; role?: ContactRole; department?: string; email?: string; phone?: string; isPrimary?: boolean; notes?: string }
): Promise<Contact> =>
  apiAxios.post(`/clients/${clientId}/contacts`, data).then((r) => r.data.data);

export const updateContact = (
  clientId: string,
  contactId: string,
  data: Partial<Omit<Contact, "_id" | "clientId" | "createdAt" | "updatedAt">>
): Promise<Contact> =>
  apiAxios.put(`/clients/${clientId}/contacts/${contactId}`, data).then((r) => r.data.data);

export const deleteContact = (clientId: string, contactId: string) =>
  apiAxios.delete(`/clients/${clientId}/contacts/${contactId}`);

// ─── Observations CRUD ────────────────────────────────────────────────────────

export const listObservations = (clientId: string, params?: { type?: string; contactId?: string }): Promise<Observation[]> =>
  apiAxios.get(`/clients/${clientId}/observations`, { params }).then((r) => r.data.data);

export const createObservation = (
  clientId: string,
  data: { type: ObservationType; content: string; tags?: string[]; sentiment?: SentimentType; isPrivate?: boolean; contactId?: string | null }
): Promise<Observation> =>
  apiAxios.post(`/clients/${clientId}/observations`, data).then((r) => r.data.data);

export const updateObservation = (
  clientId: string,
  obsId: string,
  data: Partial<{ type: ObservationType; content: string; tags: string[]; sentiment: SentimentType; isPrivate: boolean; contactId: string | null }>
): Promise<Observation> =>
  apiAxios.put(`/clients/${clientId}/observations/${obsId}`, data).then((r) => r.data.data);

export const deleteObservation = (clientId: string, obsId: string) =>
  apiAxios.delete(`/clients/${clientId}/observations/${obsId}`);

