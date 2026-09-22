import {
  assertCanLose,
  assertCanMove,
  assertCanWin,
  isClosedStage,
  isOpenStage,
} from './pipeline';
import { BusinessRuleError } from '../errors/domain-error';

describe('pipeline', () => {
  it('estágios abertos e fechados', () => {
    expect(isOpenStage('PROPOSAL')).toBe(true);
    expect(isClosedStage('WON')).toBe(true);
    expect(isClosedStage('NEW')).toBe(false);
  });

  it('mesma coluna ou encerrada → erro', () => {
    expect(() => assertCanMove('NEW', 'NEW')).toThrow(BusinessRuleError);
    expect(() => assertCanMove('LOST', 'NEW')).toThrow(BusinessRuleError);
  });

  it('permite ir de aberto para WON/LOST e entre abertos', () => {
    expect(() => assertCanMove('NEW', 'WON')).not.toThrow();
    expect(() => assertCanMove('QUALIFIED', 'NEGOTIATION')).not.toThrow();
  });

  it('ganho exige valor e perda exige motivo', () => {
    expect(() => assertCanWin(0)).toThrow(BusinessRuleError);
    expect(() => assertCanWin(10)).not.toThrow();
    expect(() => assertCanLose('')).toThrow(BusinessRuleError);
    expect(() => assertCanLose('Preço')).not.toThrow();
    expect(() => assertCanLose(undefined)).toThrow(BusinessRuleError);
  });

  it('estágio desconhecido → erro', () => {
    expect(() => assertCanMove('NEW', 'NOPE' as unknown as 'NEW')).toThrow(
      BusinessRuleError,
    );
  });
});
