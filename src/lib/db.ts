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

const db = new Dexie('BookhubDB') as Dexie & {
  drafts: EntityTable<Draft, 'id'>;
};

// バージョン2: 表紙（coverImage）と著者（author）を追加
db.version(2).stores({
  drafts: '++id, title, author, updatedAt, isCommitted'
});

export { db };