import { get, set, del } from "idb-keyval";

/**
 * Menyimpan data draft ke IndexedDB.
 * Menggunakan library `idb-keyval` untuk operasi sederhana key-value.
 * @param key Key unik untuk penyimpanan
 * @param data Data yang akan disimpan
 */
export async function saveDraft<T>(key: string, data: T): Promise<void> {
  try {
    await set(key, data);
    console.log(`[IndexedDB] Draft saved: ${key}`);
  } catch (err) {
    console.error(`[IndexedDB] Failed to save draft ${key}:`, err);
  }
}

/**
 * Memuat data draft dari IndexedDB.
 * @param key Key unik draft
 * @returns Data draft atau undefined jika tidak ada/gagal
 */
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

/**
 * Menghapus data draft dari IndexedDB.
 * @param key Key unik draft yang akan dihapus
 */
export async function deleteDraft(key: string): Promise<void> {
  try {
    await del(key);
    console.log(`[IndexedDB] Draft deleted: ${key}`);
  } catch (err) {
    console.error(`[IndexedDB] Failed to delete draft ${key}:`, err);
  }
}
