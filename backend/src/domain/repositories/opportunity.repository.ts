import type {
  Opportunity,
  OpportunityStage,
} from '../entities/opportunity.entity';

export const OPPORTUNITY_REPOSITORY = Symbol('OPPORTUNITY_REPOSITORY');

export interface OpportunityRepository {
  findById(id: string): Promise<Opportunity | null>;
  list(filters?: {
    stage?: OpportunityStage;
    ownerId?: string;
  }): Promise<Opportunity[]>;
  create(
    data: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<Opportunity>;
  update(id: string, data: Partial<Opportunity>): Promise<Opportunity>;
}
