import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

// 啟用 Promise
SQLite.enablePromise(true);

// 資料庫配置
const DATABASE_NAME = 'FitnessApp.db';
const DATABASE_VERSION = '1.0';

// 資料庫實例
let database: SQLiteDatabase | null = null;

// 資料庫服務
export const DatabaseService = {
  // 開啟資料庫
  async open(): Promise<SQLiteDatabase> {
    if (database) {
      return database;
    }

    try {
      database = await SQLite.openDatabase({
        name: DATABASE_NAME,
        location: 'default',
      });

      console.log('SQLite 資料庫開啟成功');

      // 初始化表格
      await this.initializeTables();

      return database;
    } catch (error) {
      console.error('開啟 SQLite 資料庫失敗:', error);
      throw error;
    }
  },

  // 關閉資料庫
  async close(): Promise<void> {
    if (database) {
      await database.close();
      database = null;
      console.log('SQLite 資料庫已關閉');
    }
  },

  // 初始化表格
  async initializeTables(): Promise<void> {
    if (!database) {
      throw new Error('資料庫未開啟');
    }

    // 運動記錄表（離線儲存）
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS exercise_records (
        id TEXT PRIMARY KEY,
        server_id TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT,
        duration_minutes INTEGER,
        status TEXT NOT NULL,
        points_earned INTEGER DEFAULT 0,
        synced INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // 同步佇列表
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        priority INTEGER DEFAULT 0,
        retry_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `);

    // 快取表
    await database.executeSql(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at TEXT
      )
    `);

    console.log('SQLite 表格初始化完成');
  },

  // 執行 SQL
  async executeSql(sql: string, params: any[] = []): Promise<any> {
    if (!database) {
      await this.open();
    }

    try {
      const [results] = await database!.executeSql(sql, params);
      return results;
    } catch (error) {
      console.error('SQL 執行錯誤:', error);
      throw error;
    }
  },

  // 運動記錄相關方法

  // 儲存運動記錄
  async saveExerciseRecord(record: {
    id: string;
    serverId?: string;
    startTime: string;
    endTime?: string;
    durationMinutes?: number;
    status: string;
    pointsEarned?: number;
  }): Promise<void> {
    const now = new Date().toISOString();
    await this.executeSql(
      `INSERT OR REPLACE INTO exercise_records
       (id, server_id, start_time, end_time, duration_minutes, status, points_earned, synced, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.serverId || null,
        record.startTime,
        record.endTime || null,
        record.durationMinutes || null,
        record.status,
        record.pointsEarned || 0,
        record.serverId ? 1 : 0,
        now,
        now,
      ]
    );
  },

  // 取得未同步的運動記錄
  async getUnsyncedExerciseRecords(): Promise<any[]> {
    const results = await this.executeSql(
      'SELECT * FROM exercise_records WHERE synced = 0 ORDER BY created_at ASC'
    );
    return this.rowsToArray(results);
  },

  // 標記記錄已同步
  async markExerciseSynced(localId: string, serverId: string): Promise<void> {
    await this.executeSql(
      'UPDATE exercise_records SET server_id = ?, synced = 1, updated_at = ? WHERE id = ?',
      [serverId, new Date().toISOString(), localId]
    );
  },

  // 同步佇列相關方法

  // 添加到同步佇列
  async addToSyncQueue(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entityType: string,
    entityId: string,
    payload: any,
    priority: number = 0
  ): Promise<void> {
    await this.executeSql(
      `INSERT INTO sync_queue (action, entity_type, entity_id, payload, priority, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        action,
        entityType,
        entityId,
        JSON.stringify(payload),
        priority,
        new Date().toISOString(),
      ]
    );
  },

  // 取得待同步項目
  async getSyncQueueItems(limit: number = 10): Promise<any[]> {
    const results = await this.executeSql(
      `SELECT * FROM sync_queue
       WHERE retry_count < 3
       ORDER BY priority DESC, created_at ASC
       LIMIT ?`,
      [limit]
    );
    return this.rowsToArray(results);
  },

  // 移除同步項目
  async removeSyncQueueItem(id: number): Promise<void> {
    await this.executeSql('DELETE FROM sync_queue WHERE id = ?', [id]);
  },

  // 增加重試次數
  async incrementSyncRetry(id: number): Promise<void> {
    await this.executeSql(
      'UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?',
      [id]
    );
  },

  // 快取相關方法

  // 設定快取
  async setCache(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds
      ? new Date(Date.now() + ttlSeconds * 1000).toISOString()
      : null;

    await this.executeSql(
      'INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)',
      [key, JSON.stringify(value), expiresAt]
    );
  },

  // 取得快取
  async getCache<T>(key: string): Promise<T | null> {
    const results = await this.executeSql(
      'SELECT value, expires_at FROM cache WHERE key = ?',
      [key]
    );

    const rows = this.rowsToArray(results);
    if (rows.length === 0) {
      return null;
    }

    const { value, expires_at } = rows[0];

    // 檢查是否過期
    if (expires_at && new Date(expires_at) < new Date()) {
      await this.executeSql('DELETE FROM cache WHERE key = ?', [key]);
      return null;
    }

    return JSON.parse(value);
  },

  // 清除過期快取
  async clearExpiredCache(): Promise<void> {
    await this.executeSql(
      'DELETE FROM cache WHERE expires_at IS NOT NULL AND expires_at < ?',
      [new Date().toISOString()]
    );
  },

  // 工具方法：將 SQLite 結果轉為陣列
  rowsToArray(results: any): any[] {
    const rows: any[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      rows.push(results.rows.item(i));
    }
    return rows;
  },
};

export default DatabaseService;
