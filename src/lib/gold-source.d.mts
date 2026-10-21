import type { Quote } from './price-feed';
export const PNJ_HOSTS: string[];
export function validQuote(value: unknown): value is Quote;
export function parseVNDate(value: unknown): string;
export function parsePNJ(value: unknown, host: string): { sjc: Quote | null; pnj: Quote | null };
