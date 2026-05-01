import Dexie, { type EntityTable } from 'dexie';

export interface Draft {
  id?: number;
  title: string;
  author?: string;
  coverImage?: string;
  content: string; // 原文 (En)
  translatedContent?: string; // 翻訳済み本文 (Ja)
  updatedAt: Date;
  isCommitted: boolean;
  slug?: string;
}

export interface Identity {
  id?: number;
  publicKey: string;
  privateKey: CryptoKey;
  address: string;
  balance: number;
  createdAt: Date;
}

const db = new Dexie('BookhubDB') as Dexie & {
  drafts: EntityTable<Draft, 'id'>;
  identity: EntityTable<Identity, 'id'>;
  hiddenBooks: EntityTable<{ id?: number; bookId: string; title: string; author: string; }, 'id'>;
};

// バージョン5: translatedContentの追加とhiddenBooksの構造改善
db.version(5).stores({
  drafts: '++id, title, author, updatedAt, isCommitted',
  identity: '++id, address',
  hiddenBooks: '++id, bookId, title'
});

export { db };
