export const STORAGE_KEY = "sg_servers";

export function loadServers(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveServers(list: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore
  }
}

import { SERVER_URL } from "../../network";

export function normalizeUrl(input: string): string {
  const s = (input || "").trim();
  if (!s) return SERVER_URL;
  try {
    if (s.startsWith("ws://") || s.startsWith("wss://")) {
      const u = new URL(s);
      const port = u.port || "3000";
      return `${u.protocol}//${u.hostname}:${port}`;
    }
    if (s.startsWith("http://") || s.startsWith("https://")) {
      const u = new URL(s);
      const proto = u.protocol === "https:" ? "wss:" : "ws:";
      const port = u.port || "3000";
      return `${proto}//${u.hostname}:${port}`;
    }
  } catch (e) {
    // fallthrough
  }

  const parts = s.split(":");
  if (parts.length === 2 && parts[1]) {
    return `ws://${parts[0]}:${parts[1]}`;
  }
  return `ws://${s}:3000`;
}

export function stripProtocolPort(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + (u.port ? `:${u.port}` : "");
  } catch (e) {
    return url;
  }
}
