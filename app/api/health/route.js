import { jsonResponse } from '@/lib/middleware';

export async function GET() {
  return jsonResponse({ ok: true });
}
