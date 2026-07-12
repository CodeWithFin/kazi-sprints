'use client';

const ADMIN_KEY = 'ppp_admin_token';
const CLIENT_KEY = 'ppp_client_token';
const CLIENT_SLUG_KEY = 'ppp_client_slug';

export function getAdminToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_KEY);
}

export function setAdminToken(token) {
  localStorage.setItem(ADMIN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_KEY);
}

export function getClientToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CLIENT_KEY);
}

export function setClientSession(token, slug) {
  localStorage.setItem(CLIENT_KEY, token);
  localStorage.setItem(CLIENT_SLUG_KEY, slug);
}

export function clearClientSession() {
  localStorage.removeItem(CLIENT_KEY);
  localStorage.removeItem(CLIENT_SLUG_KEY);
}

export function getStoredPortalSlug() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CLIENT_SLUG_KEY);
}
