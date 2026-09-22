import { Injectable } from '@nestjs/common';
import type {
  Opportunity,
  OpportunityStage,
} from '../../domain/entities/opportunity.entity';
import type { OpportunityRepository } from '../../domain/repositories/opportunity.repository';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaOpportunityRepository implements OpportunityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Opportunity | null> {
    return this.prisma.opportunity.findUnique({ where: { id } });
  }

  async list(filters?: {
    stage?: OpportunityStage;
    ownerId?: string;
  }): Promise<Opportunity[]> {
    return this.prisma.opportunity.findMany({
      where: {
        ...(filters?.stage ? { stage: filters.stage } : {}),
        ...(filters?.ownerId ? { ownerId: filters.ownerId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(
    data: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<Opportunity> {
    return this.prisma.opportunity.create({ data });
  }

  async update(id: string, data: Partial<Opportunity>): Promise<Opportunity> {
    const rest = { ...data };
    delete rest.id;
    delete rest.createdAt;
    return this.prisma.opportunity.update({ where: { id }, data: rest });
  }
}
