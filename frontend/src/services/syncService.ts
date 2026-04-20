import { db } from "../db";
import { api } from "../lib/api";

interface SyncResponse {
  synced_moods: number;
  synced_journals: number;
}

export async function syncOfflineData(): Promise<SyncResponse | null> {
  const unsyncedMoods = await db.moods.where("synced").equals(0).toArray();
  const unsyncedJournals = await db.journals
    .where("synced")
    .equals(0)
    .toArray();

  if (unsyncedMoods.length === 0 && unsyncedJournals.length === 0) {
    return null;
  }

  try {
    const result = await api.post<SyncResponse>("/api/sync", {
      moods: unsyncedMoods.map((m) => ({
        value: m.value,
        note: m.note,
        created_at: m.createdAt,
      })),
      journals: unsyncedJournals.map((j) => ({
        content: j.content,
        created_at: j.createdAt,
      })),
    });

    const moodIds = unsyncedMoods.map((m) => m.id!).filter(Boolean);
    const journalIds = unsyncedJournals.map((j) => j.id!).filter(Boolean);

    await db.moods.where("id").anyOf(moodIds).modify({ synced: true });
    await db.journals.where("id").anyOf(journalIds).modify({ synced: true });

    return result;
  } catch {
    console.error("Sync failed — will retry on next online event");
    return null;
  }
}

export function startSyncListener() {
  window.addEventListener("online", () => {
    syncOfflineData();
  });

  if (navigator.onLine) {
    syncOfflineData();
  }
}
