import { Injectable } from '@nestjs/common';
import type { Account } from '../../domain/entities/account.entity';
import type { AccountRepository } from '../../domain/repositories/account.repository';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Account | null> {
    const row = await this.prisma.account.findUnique({ where: { id } });
    return row;
  }

  async findByEmail(email: string): Promise<Account | null> {
    return this.prisma.account.findFirst({ where: { email } });
  }

  async create(
    data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<Account> {
    return this.prisma.account.create({ data });
  }
}
