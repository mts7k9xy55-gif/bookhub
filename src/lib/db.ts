import Dexie, { type EntityTable } from 'dexie';

export interface Draft {
  id?: number;
  title: string;
  author?: string;
  coverImage?: string; // Data URL or Image URL
  content: string; // HTML string from Tiptap
  updatedAt: Date;
  isCommitted: boolean;
  
  // 技術的雑事（テクノロジーが管理する領域）
  arweaveHash?: string;    // デプロイ先（永遠のID）
  language?: string;       // 原文言語
  targetLanguages?: string[]; // AIに翻訳させる言語
  
  // 系譜と権利（第二のインターネット革命の核）
  parentHash?: string;     // 直接の親（一個上の世代）
  originHash?: string;     // 原初のDNA（どれだけ世代を重ねても変わらないオリジン）
  license?: 'private' | 'commons'; // 'private': 自己保有, 'commons': 共有財プールへ放流
}

export interface Identity {
  id?: number;
  publicKey: string;
  privateKey: CryptoKey; // Web Crypto API key object
  address: string;      // Human-readable ID (hash of public key)
  balance: number;      // Current $SGT balance
  createdAt: Date;
}

const db = new Dexie('BookhubDB') as Dexie & {
  drafts: EntityTable<Draft, 'id'>;
  identity: EntityTable<Identity, 'id'>;
  hiddenBooks: EntityTable<{ id: string; bookId: string; }, 'id'>;
};

// バージョン4: hiddenBooksを追加
db.version(4).stores({
  drafts: '++id, title, author, updatedAt, isCommitted',
  identity: '++id, address',
  hiddenBooks: '++id, bookId'
});

export { db };