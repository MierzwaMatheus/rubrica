import { describe, it, expect } from 'vitest'
import { interpolateTemplate, formatArrayAsList, formatArrayAsText } from '../../../src/utils/contractTemplate'

describe('interpolateTemplate', () => {
  it('substitui variável simples', () => {
    expect(interpolateTemplate('Olá {{name}}', { name: 'Ana' })).toBe('Olá Ana')
  })

  it('substitui múltiplas ocorrências da mesma variável', () => {
    expect(interpolateTemplate('{{x}} e {{x}}', { x: 'A' })).toBe('A e A')
  })

  it('mantém {{var}} quando variável não está no mapa', () => {
    expect(interpolateTemplate('Olá {{name}} {{missing}}', { name: 'Ana' })).toBe('Olá Ana {{missing}}')
  })

  it('mantém {{var}} quando valor é undefined ou null', () => {
    const vars = { name: undefined as unknown as string, role: null as unknown as string }
    expect(interpolateTemplate('{{name}} {{role}}', vars)).toBe('{{name}} {{role}}')
  })
})

describe('formatArrayAsList', () => {
  it('formata array como lista com bullets', () => {
    expect(formatArrayAsList(['A', 'B', 'C'])).toBe('• A\n• B\n• C')
  })

  it('retorna string vazia para array vazio', () => {
    expect(formatArrayAsList([])).toBe('')
  })
})

describe('formatArrayAsText', () => {
  it('formata array com vírgulas e "e" no último', () => {
    expect(formatArrayAsText(['etapa 1', 'etapa 2', 'etapa 3'])).toBe('etapa 1, etapa 2 e etapa 3')
  })

  it('retorna item único sem vírgula', () => {
    expect(formatArrayAsText(['etapa 1'])).toBe('etapa 1')
  })

  it('formata dois itens com "e" sem vírgula', () => {
    expect(formatArrayAsText(['etapa 1', 'etapa 2'])).toBe('etapa 1 e etapa 2')
  })
})
