import {
  CLOSED_STAGES,
  OPEN_STAGES,
  type OpportunityStage,
} from '../entities/opportunity.entity';
import { BusinessRuleError } from '../errors/domain-error';

export function isOpenStage(stage: OpportunityStage): boolean {
  return OPEN_STAGES.includes(stage);
}

export function isClosedStage(stage: OpportunityStage): boolean {
  return CLOSED_STAGES.includes(stage);
}

export function assertCanMove(
  from: OpportunityStage,
  to: OpportunityStage,
): void {
  if (from === to) {
    throw new BusinessRuleError('A oportunidade já está neste estágio');
  }
  if (isClosedStage(from)) {
    throw new BusinessRuleError('Oportunidade encerrada não muda de estágio');
  }
  if (to === 'WON' || to === 'LOST') {
    return;
  }
  if (!isOpenStage(to)) {
    throw new BusinessRuleError('Estágio de destino inválido');
  }
}

export function assertCanWin(amount: number): void {
  if (amount <= 0) {
    throw new BusinessRuleError(
      'Ganho exige valor maior que zero para gerar o handoff ao VendaCore',
    );
  }
}

export function assertCanLose(reason: string | undefined): void {
  if (!reason || reason.trim().length < 3) {
    throw new BusinessRuleError(
      'Informe o motivo da perda (mínimo 3 caracteres)',
    );
  }
}
