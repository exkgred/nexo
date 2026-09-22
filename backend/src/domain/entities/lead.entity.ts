export type LeadSource = 'DISCADOR' | 'CHAT' | 'MANUAL' | 'SMARTY';
export type LeadStatus = 'NEW' | 'QUALIFIED' | 'CONVERTED' | 'DISQUALIFIED';

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: LeadSource;
  status: LeadStatus;
  notes: string | null;
  ownerId: string;
  accountId: string | null;
  opportunityId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
