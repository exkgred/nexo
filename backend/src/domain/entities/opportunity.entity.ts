export type OpportunityStage =
  'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';

export const OPEN_STAGES: OpportunityStage[] = [
  'NEW',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
];

export const CLOSED_STAGES: OpportunityStage[] = ['WON', 'LOST'];

export interface Opportunity {
  id: string;
  title: string;
  accountId: string;
  leadId: string | null;
  ownerId: string;
  stage: OpportunityStage;
  amount: number;
  sourceApp: string;
  lostReason: string | null;
  wonAt: Date | null;
  lostAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
