import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';
import {
  getContactMessageById,
  listContactMessages,
  markContactMessageAnswered,
  markContactMessageRead,
} from '../../../lib/repositories/contactMessages';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));

  if (id) {
    const row = await getContactMessageById(id);
    if (!row) {
      return new Response(JSON.stringify({ error: 'Message not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ data: row }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rows = await listContactMessages();
  return new Response(JSON.stringify({ data: rows }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);

  if (!id) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }

  let updated = null;
  if (typeof body?.cevaplandi === 'boolean') {
    updated = await markContactMessageAnswered(id, body.cevaplandi);
  } else {
    updated = await markContactMessageRead(id, body?.okundu !== false);
  }

  if (!updated) {
    return new Response(JSON.stringify({ error: 'Message not found' }), { status: 404 });
  }

  return new Response(JSON.stringify({ data: updated }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
