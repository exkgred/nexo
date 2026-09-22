import { Inject, Injectable } from '@nestjs/common';
import type { Lead } from '../../../domain/entities/lead.entity';
import { NotFoundError } from '../../../domain/errors/domain-error';
import {
  LEAD_REPOSITORY,
  type LeadRepository,
} from '../../../domain/repositories/lead.repository';

@Injectable()
export class GetLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leads: LeadRepository,
  ) {}

  async execute(id: string): Promise<Lead> {
    const lead = await this.leads.findById(id);
    if (!lead) {
      throw new NotFoundError('Lead');
    }
    return lead;
  }
}
