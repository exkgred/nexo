import { Inject, Injectable } from '@nestjs/common';
import type {
  Lead,
  LeadSource,
  LeadStatus,
} from '../../../domain/entities/lead.entity';
import {
  LEAD_REPOSITORY,
  type LeadRepository,
} from '../../../domain/repositories/lead.repository';

@Injectable()
export class ListLeadsUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: LeadRepository,
  ) {}

  async execute(filters?: {
    status?: LeadStatus;
    source?: LeadSource;
  }): Promise<Lead[]> {
    return this.leads.list(filters);
  }
}
