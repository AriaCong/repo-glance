import { openDB, type IDBPDatabase } from "idb";
import type { CacheEntry, Summary } from "../types";

const DB_NAME = "repo-glance-cache";
const STORE_NAME = "summaries";
const DB_VERSION = 1;

function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function getCachedSummary(
  owner: string,
  repo: string,
  sha: string
): Promise<CacheEntry | null> {
  const key = `${owner}/${repo}/${sha}`;
  const db = await getDB();
  const entry: CacheEntry | undefined = await db.get(STORE_NAME, key);
  return entry ?? null;
}

export async function setCachedSummary(
  owner: string,
  repo: string,
  sha: string,
  summary: Summary
): Promise<void> {
  const key = `${owner}/${repo}/${sha}`;
  const entry: CacheEntry = {
    summary,
    sha,
    timestamp: Date.now(),
  };
  const db = await getDB();
  await db.put(STORE_NAME, entry, key);
}
