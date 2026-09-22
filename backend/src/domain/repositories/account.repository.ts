import type { Account } from '../entities/account.entity';

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');

export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
  findByEmail(email: string): Promise<Account | null>;
  create(
    data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ): Promise<Account>;
}
