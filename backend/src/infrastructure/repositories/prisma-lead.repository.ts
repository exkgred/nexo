import { Injectable } from '@nestjs/common';
import type {
  Lead,
  LeadSource,
  LeadStatus,
} from '../../domain/entities/lead.entity';
import type { LeadRepository } from '../../domain/repositories/lead.repository';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaLeadRepository implements LeadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Lead | null> {
    return this.prisma.lead.findUnique({ where: { id } });
  }

  async findByEmailOrPhone(
    email?: string | null,
    phone?: string | null,
  ): Promise<Lead | null> {
    if (!email && !phone) {
      return null;
    }
    return this.prisma.lead.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async list(filters?: {
    status?: LeadStatus;
    source?: LeadSource;
  }): Promise<Lead[]> {
    return this.prisma.lead.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.source ? { source: filters.source } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<Lead> {
    return this.prisma.lead.create({ data });
  }

  async update(id: string, data: Partial<Lead>): Promise<Lead> {
    const rest = { ...data };
    delete rest.id;
    delete rest.createdAt;
    return this.prisma.lead.update({ where: { id }, data: rest });
  }
}
