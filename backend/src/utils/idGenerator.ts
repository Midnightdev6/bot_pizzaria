/**
 * Gera um ID único simples para mensagens
 * Em produção, considere usar uuid ou nanoid
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
