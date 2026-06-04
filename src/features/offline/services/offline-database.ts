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
        createdBy TEXT,
        lastModifiedBy TEXT,
        active INTEGER DEFAULT 1,
        _dirty INTEGER DEFAULT 0,
        _deleted INTEGER DEFAULT 0
      );
    `);

    // ── Farm Zones ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS farm_zones (
        id TEXT PRIMARY KEY,
        farmPlotId TEXT,
        ownerProfileId TEXT,
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
        createdBy TEXT,
        lastModifiedBy TEXT,
        active INTEGER DEFAULT 1,
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
        createdBy TEXT,
        lastModifiedBy TEXT,
        active INTEGER DEFAULT 1,
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
        attachmentIds TEXT,
        createdAt TEXT,
        lastModifiedAt TEXT,
        createdBy TEXT,
        lastModifiedBy TEXT,
        active INTEGER DEFAULT 1,
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

    // ── Local ID → Server ID mapping ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS id_map (
        localId TEXT PRIMARY KEY,
        serverId TEXT NOT NULL,
        entityType TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);

    // ── Sync Queue ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS pending_sync_queue (
        id TEXT PRIMARY KEY,
        tableName TEXT,
        recordId TEXT,
        operation TEXT,
        payload TEXT,
        createdAt TEXT,
        status TEXT,
        retryCount INTEGER DEFAULT 0,
        lastError TEXT,
        syncedAt TEXT
      );
    `);

    // ── Plans ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        creatorId TEXT,
        ownerId TEXT,
        planName TEXT,
        diseaseName TEXT,
        severityLevel TEXT,
        urgency TEXT,
        sourceType TEXT,
        estimatedCost TEXT,
        createdAt TEXT,
        lastModifiedAt TEXT,
        active INTEGER DEFAULT 1,
        _dirty INTEGER DEFAULT 0,
        _deleted INTEGER DEFAULT 0
      );
    `);

    // ── Plan Applies ──
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS plan_applies (
        id TEXT PRIMARY KEY,
        planId TEXT,
        appliedById TEXT,
        plantId TEXT,
        farmPlotId TEXT,
        farmZoneId TEXT,
        planName TEXT,
        diseaseName TEXT,
        targetName TEXT,
        startDate TEXT,
        trackingGranularity TEXT,
        status TEXT,
        createdAt TEXT,
        lastModifiedAt TEXT,
        _dirty INTEGER DEFAULT 0,
        _deleted INTEGER DEFAULT 0
      );
    `);

    // --- Schema Upgrades ---
    // We ignore errors if the column already exists.

    // plant_events: keep schema compatible across older installs
    try { await db.execAsync(`ALTER TABLE plant_events ADD COLUMN daysFromStart INTEGER;`); } catch {}

    // plant_event_progress: upgrades are no-ops if columns already exist
    // (table creation is handled above)

    try {
      await db.execAsync(`ALTER TABLE plants ADD COLUMN createdAt TEXT;`);
    } catch {}
    try {
      await db.execAsync(`ALTER TABLE plants ADD COLUMN lastModifiedAt TEXT;`);
    } catch {}
    // id_map upgrades
    try {
      await db.execAsync(`ALTER TABLE id_map ADD COLUMN entityType TEXT;`);
    } catch {}
    try {
      await db.execAsync(`ALTER TABLE id_map ADD COLUMN createdAt TEXT;`);
    } catch {}

    // Entity schema upgrades (ignore if already exists)
    try { await db.execAsync(`ALTER TABLE farm_plots ADD COLUMN createdBy TEXT;`); } catch {}
    try { await db.execAsync(`ALTER TABLE farm_plots ADD COLUMN lastModifiedBy TEXT;`); } catch {}
    try { await db.execAsync(`ALTER TABLE farm_plots ADD COLUMN active INTEGER DEFAULT 1;`); } catch {}

    try { await db.execAsync(`ALTER TABLE farm_zones ADD COLUMN ownerProfileId TEXT;`); } catch {}
    try { await db.execAsync(`ALTER TABLE farm_zones ADD COLUMN createdBy TEXT;`); } catch {}
    try { await db.execAsync(`ALTER TABLE farm_zones ADD COLUMN lastModifiedBy TEXT;`); } catch {}
    try { await db.execAsync(`ALTER TABLE farm_zones ADD COLUMN active INTEGER DEFAULT 1;`); } catch {}

    try { await db.execAsync(`ALTER TABLE plants ADD COLUMN createdBy TEXT;`); } catch {}
    try { await db.execAsync(`ALTER TABLE plants ADD COLUMN lastModifiedBy TEXT;`); } catch {}
    try { await db.execAsync(`ALTER TABLE plants ADD COLUMN active INTEGER DEFAULT 1;`); } catch {}

    try { await db.execAsync(`ALTER TABLE plant_events ADD COLUMN attachmentIds TEXT;`); } catch {}
    try { await db.execAsync(`ALTER TABLE plant_events ADD COLUMN createdBy TEXT;`); } catch {}
    try { await db.execAsync(`ALTER TABLE plant_events ADD COLUMN lastModifiedBy TEXT;`); } catch {}
    try { await db.execAsync(`ALTER TABLE plant_events ADD COLUMN active INTEGER DEFAULT 1;`); } catch {}

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
      DELETE FROM plans;
      DELETE FROM plan_applies;
      DELETE FROM sync_metadata;
      DELETE FROM id_map;
      DELETE FROM pending_sync_queue;
    `);
    console.log('[OfflineDB] Database cleared');
  } catch (error) {
    console.error('[OfflineDB] Clear failed:', error);
  }
};
