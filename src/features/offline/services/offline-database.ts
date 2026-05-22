import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const DB_NAME = 'leafy_offline.db';

let dbInstance: any = null;

export const getDbAsync = async () => {
  if (Platform.OS === 'web') {
    if (!dbInstance) {
      dbInstance = {
        transaction: () => ({ executeSql: () => {} }),
        execAsync: async () => {},
        runAsync: async () => {},
        getFirstAsync: async () => null,
        getAllAsync: async () => [],
      };
    }
    return dbInstance;
  }
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbInstance as SQLite.SQLiteDatabase;
};

export const initOfflineDatabase = async () => {
  if (Platform.OS === 'web') return;
  
  const db = await getDbAsync();
  
  try {
    // ── Farm Plots ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS farm_plots (
        id TEXT PRIMARY KEY,
        ownerProfileId TEXT,
        name TEXT,
        code TEXT,
        description TEXT,
        areaM2 REAL,
        addressLine TEXT,
        provinceCode TEXT,
        districtCode TEXT,
        wardCode TEXT,
        latitude REAL,
        longitude REAL,
        boundaryGeojson TEXT,
        status TEXT,
        createdAt TEXT,
        lastModifiedAt TEXT,
        _dirty INTEGER DEFAULT 0,
        _deleted INTEGER DEFAULT 0
      );
    `);

    // ── Farm Zones ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS farm_zones (
        id TEXT PRIMARY KEY,
        farmPlotId TEXT,
        zoneName TEXT,
        zoneCode TEXT,
        description TEXT,
        areaM2 REAL,
        soilType TEXT,
        cropType TEXT,
        plantingDate TEXT,
        elevationM REAL,
        boundaryGeojson TEXT,
        status TEXT,
        createdAt TEXT,
        lastModifiedAt TEXT,
        _dirty INTEGER DEFAULT 0,
        _deleted INTEGER DEFAULT 0
      );
    `);

    // ── Species ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS species (
        id TEXT PRIMARY KEY,
        commonName TEXT,
        cultivarName TEXT,
        waterFrequencyDays INTEGER,
        lightRequirements TEXT,
        daysToMaturity INTEGER,
        plantingWindow TEXT,
        plantingSeason TEXT,
        idealEnv TEXT,
        spacing REAL,
        expectedYieldKg REAL,
        commonDiseaseIds TEXT,
        _dirty INTEGER DEFAULT 0,
        _deleted INTEGER DEFAULT 0
      );
    `);

    // ── Plants ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS plants (
        id TEXT PRIMARY KEY,
        plantNumber TEXT,
        plantStatus TEXT,
        nickName TEXT,
        tagCode TEXT,
        batchNumber TEXT,
        sourceType TEXT,
        motherPlantId TEXT,
        plantingDate TEXT,
        germinationDate TEXT,
        actualHarvestDate TEXT,
        totalYieldKg REAL,
        speciesId TEXT,
        farmPlotId TEXT,
        farmZoneId TEXT,
        ownerProfileId TEXT,
        createdAt TEXT,
        lastModifiedAt TEXT,
        _dirty INTEGER DEFAULT 0,
        _deleted INTEGER DEFAULT 0
      );
    `);

    // ── Plant Events ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS plant_events (
        id TEXT PRIMARY KEY,
        plantId TEXT,
        farmPlotId TEXT,
        farmZoneId TEXT,
        targetType TEXT,
        eventType TEXT,
        note TEXT,
        description TEXT,
        daysFromStart INTEGER,
        durationDays INTEGER,
        planned INTEGER,
        calculatedStartDate TEXT,
        calculatedEndDate TEXT,
        phiDays INTEGER,
        ppeRequired TEXT,
        mrlNote TEXT,
        estimatedCost TEXT,
        sourcePlanId TEXT,
        planApplyId TEXT,
        parentPlantEventId TEXT,
        completed INTEGER,
        trackingGranularity TEXT,
        excludedPlantIds TEXT,
        excludedFarmZoneIds TEXT,
        progressTotal INTEGER,
        progressCompleted INTEGER,
        tasks TEXT,
        createdAt TEXT,
        lastModifiedAt TEXT,
        _dirty INTEGER DEFAULT 0,
        _deleted INTEGER DEFAULT 0
      );
    `);

    // ── Sync Metadata ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        tableName TEXT PRIMARY KEY,
        lastSyncedAt TEXT,
        syncVersion INTEGER DEFAULT 1
      );
    `);

    // ── Sync Queue (Stub for future) ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_sync_queue (
        id TEXT PRIMARY KEY,
        tableName TEXT,
        recordId TEXT,
        operation TEXT,
        payload TEXT,
        createdAt TEXT,
        status TEXT
      );
    `);

    // --- Schema Upgrades ---
    // We ignore errors if the column already exists.
    try {
      await db.execAsync(`ALTER TABLE plants ADD COLUMN createdAt TEXT;`);
    } catch {}
    try {
      await db.execAsync(`ALTER TABLE plants ADD COLUMN lastModifiedAt TEXT;`);
    } catch {}
    // pending_sync_queue: retry tracking
    try {
      await db.execAsync(`ALTER TABLE pending_sync_queue ADD COLUMN retryCount INTEGER DEFAULT 0;`);
    } catch {}
    try {
      await db.execAsync(`ALTER TABLE pending_sync_queue ADD COLUMN lastError TEXT;`);
    } catch {}
    try {
      await db.execAsync(`ALTER TABLE pending_sync_queue ADD COLUMN syncedAt TEXT;`);
    } catch {}

    console.log('[OfflineDB] Database initialized successfully');
  } catch (error) {
    console.error('[OfflineDB] Initialization failed:', error);
  }
};

export const clearOfflineDatabase = async () => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  try {
    await db.execAsync(`
      DELETE FROM farm_plots;
      DELETE FROM farm_zones;
      DELETE FROM species;
      DELETE FROM plants;
      DELETE FROM plant_events;
      DELETE FROM sync_metadata;
      DELETE FROM pending_sync_queue;
    `);
    console.log('[OfflineDB] Database cleared');
  } catch (error) {
    console.error('[OfflineDB] Clear failed:', error);
  }
};
