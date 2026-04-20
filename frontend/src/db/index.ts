import Dexie, { type Table } from "dexie";

export interface LocalMood {
  id?: number;
  serverId?: number;
  userId: string;
  value: number;
  note?: string;
  createdAt: string;
  synced: boolean;
}

export interface LocalJournal {
  id?: number;
  serverId?: number;
  userId: string;
  content: string;
  sentiment?: string;
  createdAt: string;
  synced: boolean;
}

class DontWorryDB extends Dexie {
  moods!: Table<LocalMood>;
  journals!: Table<LocalJournal>;

  constructor() {
    super("dont-worry");
    this.version(1).stores({
      moods: "++id, serverId, userId, createdAt, synced",
      journals: "++id, serverId, userId, createdAt, synced",
    });
  }
}

export const db = new DontWorryDB();
