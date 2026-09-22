import type { Lead, LeadSource, LeadStatus } from '../entities/lead.entity';

export const LEAD_REPOSITORY = Symbol('LEAD_REPOSITORY');

export interface LeadRepository {
  findById(id: string): Promise<Lead | null>;
  findByEmailOrPhone(
    email?: string | null,
    phone?: string | null,
  ): Promise<Lead | null>;
  list(filters?: { status?: LeadStatus; source?: LeadSource }): Promise<Lead[]>;
  create(
    data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<Lead>;
  update(id: string, data: Partial<Lead>): Promise<Lead>;
}
