import { get, set, del } from "idb-keyval";

export async function saveDraft<T>(key: string, data: T): Promise<void> {
  try {
    await set(key, data);
    console.log(`[IndexedDB] Draft saved: ${key}`);
  } catch (err) {
    console.error(`[IndexedDB] Failed to save draft ${key}:`, err);
  }
}

export async function loadDraft<T>(key: string): Promise<T | undefined> {
  try {
    const data = await get<T>(key);
    console.log(`[IndexedDB] Draft loaded: ${key}`, !!data);
    return data;
  } catch (err) {
    console.error(`[IndexedDB] Failed to load draft ${key}:`, err);
    return undefined;
  }
}

export async function deleteDraft(key: string): Promise<void> {
  try {
    await del(key);
    console.log(`[IndexedDB] Draft deleted: ${key}`);
  } catch (err) {
    console.error(`[IndexedDB] Failed to delete draft ${key}:`, err);
  }
}
