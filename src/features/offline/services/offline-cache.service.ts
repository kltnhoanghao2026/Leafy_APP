import { getDbAsync } from './offline-database';
import { Platform } from 'react-native';
import type { FarmPlotResponse, FarmZoneResponse } from '@/src/features/farm';
import type { PlantResponse, SpeciesResponse } from '@/src/features/plant';
import type { PlantEventResponse } from '@/src/features/plant-event';

export const updateSyncMetadata = async (tableName: string) => {
  if (Platform.OS === 'web') return;
  const db = await getDbAsync();
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO sync_metadata (tableName, lastSyncedAt) VALUES (?, ?)`,
      [tableName, new Date().toISOString()]
    );
  } catch (error) {
    console.error(`[OfflineCache] Failed to update sync metadata for ${tableName}`, error);
  }
};

export const cacheFarmPlots = async (plots: FarmPlotResponse[]) => {
  if (Platform.OS === 'web' || !plots || plots.length === 0) return;
  const db = await getDbAsync();
  try {
    for (const plot of plots) {
      await db.runAsync(
        `INSERT OR REPLACE INTO farm_plots 
        (id, ownerProfileId, name, code, description, areaM2, addressLine, provinceCode, districtCode, wardCode, latitude, longitude, boundaryGeojson, status, createdAt, lastModifiedAt, _dirty, _deleted) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          plot.id, plot.ownerProfileId, plot.name, plot.code, plot.description || null, plot.areaM2 || null, 
          plot.addressLine || null, plot.provinceCode || null, plot.districtCode || null, plot.wardCode || null, 
          plot.latitude || null, plot.longitude || null, 
          plot.boundaryGeojson ? JSON.stringify(plot.boundaryGeojson) : null, 
          plot.status, plot.createdAt, plot.lastModifiedAt
        ]
      );
    }
    await updateSyncMetadata('farm_plots');
  } catch (error) {
    console.error('[OfflineCache] Failed to cache farm plots', error);
  }
};

export const cacheFarmZones = async (zones: FarmZoneResponse[]) => {
  if (Platform.OS === 'web' || !zones || zones.length === 0) return;
  const db = await getDbAsync();
  try {
    for (const zone of zones) {
      await db.runAsync(
        `INSERT OR REPLACE INTO farm_zones 
        (id, farmPlotId, zoneName, zoneCode, description, areaM2, soilType, cropType, plantingDate, elevationM, boundaryGeojson, status, createdAt, lastModifiedAt, _dirty, _deleted) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          zone.id, zone.farmPlotId, zone.zoneName, zone.zoneCode, zone.description || null, zone.areaM2 || null,
          zone.soilType || null, zone.cropType || null, zone.plantingDate || null, zone.elevationM || null,
          zone.boundaryGeojson ? JSON.stringify(zone.boundaryGeojson) : null,
          zone.status, zone.createdAt, zone.lastModifiedAt
        ]
      );
    }
    await updateSyncMetadata('farm_zones');
  } catch (error) {
    console.error('[OfflineCache] Failed to cache farm zones', error);
  }
};

export const cacheSpecies = async (speciesList: SpeciesResponse[]) => {
  if (Platform.OS === 'web' || !speciesList || speciesList.length === 0) return;
  const db = await getDbAsync();
  try {
    for (const species of speciesList) {
      await db.runAsync(
        `INSERT OR REPLACE INTO species 
        (id, commonName, cultivarName, waterFrequencyDays, lightRequirements, daysToMaturity, plantingWindow, plantingSeason, idealEnv, spacing, expectedYieldKg, commonDiseaseIds, _dirty, _deleted) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          species.id, species.commonName, species.cultivarName || null, species.waterFrequencyDays,
          species.lightRequirements || null, species.daysToMaturity || null, species.plantingWindow || null,
          species.plantingSeason || null, species.idealEnv ? JSON.stringify(species.idealEnv) : null,
          species.spacing || null, species.expectedYieldKg || null,
          species.commonDiseaseIds ? JSON.stringify(species.commonDiseaseIds) : null
        ]
      );
    }
    await updateSyncMetadata('species');
  } catch (error) {
    console.error('[OfflineCache] Failed to cache species', error);
  }
};

export const cachePlants = async (plants: PlantResponse[]) => {
  if (Platform.OS === 'web' || !plants || plants.length === 0) return;
  const db = await getDbAsync();
  try {
    for (const plant of plants) {
      await db.runAsync(
        `INSERT OR REPLACE INTO plants 
        (id, plantNumber, plantStatus, nickName, tagCode, batchNumber, sourceType, motherPlantId, plantingDate, germinationDate, actualHarvestDate, totalYieldKg, speciesId, farmPlotId, farmZoneId, ownerProfileId, createdAt, lastModifiedAt, _dirty, _deleted) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          plant.id, plant.plantNumber, plant.plantStatus, plant.nickName || null, plant.tagCode || null,
          plant.batchNumber || null, plant.sourceType || null, plant.motherPlantId || null,
          plant.plantingDate || null, plant.germinationDate || null, plant.actualHarvestDate || null,
          plant.totalYieldKg || null, plant.speciesId, plant.farmPlotId, (plant as any).farmZoneId || null,
          (plant as any).ownerProfileId || null, plant.createdAt || null, plant.lastModifiedAt || null
        ]
      );
    }
    await updateSyncMetadata('plants');
  } catch (error) {
    console.error('[OfflineCache] Failed to cache plants', error);
  }
};

export const cachePlantEvents = async (events: PlantEventResponse[]) => {
  if (Platform.OS === 'web' || !events || events.length === 0) return;
  const db = await getDbAsync();
  try {
    for (const event of events) {
      await db.runAsync(
        `INSERT OR REPLACE INTO plant_events 
        (id, plantId, farmPlotId, farmZoneId, targetType, eventType, note, description, daysFromNow, durationDays, planned, calculatedStartDate, calculatedEndDate, phiDays, ppeRequired, mrlNote, estimatedCost, sourcePlanId, planApplyId, parentPlantEventId, completed, trackingGranularity, excludedPlantIds, excludedFarmZoneIds, progressTotal, progressCompleted, tasks, createdAt, lastModifiedAt, _dirty, _deleted) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          event.id, event.plantId || null, event.farmPlotId || null, event.farmZoneId || null,
          event.targetType || null, event.eventType, event.note, event.description || null,
          event.daysFromNow || null, event.durationDays || null, event.planned ? 1 : 0,
          event.calculatedStartDate || null, event.calculatedEndDate || null,
          event.phiDays || null, event.ppeRequired || null, event.mrlNote || null,
          event.estimatedCost || null, event.sourcePlanId || null, event.planApplyId || null,
          event.parentPlantEventId || null, event.completed ? 1 : 0, event.trackingGranularity || null,
          event.excludedPlantIds ? JSON.stringify(event.excludedPlantIds) : null,
          event.excludedFarmZoneIds ? JSON.stringify(event.excludedFarmZoneIds) : null,
          event.progressTotal || 0, event.progressCompleted || 0,
          event.tasks ? JSON.stringify(event.tasks) : null,
          event.createdAt || null, event.lastModifiedAt || null
        ]
      );
      
      // Cache children recursively
      if (event.children && event.children.length > 0) {
        await cachePlantEvents(event.children);
      }
    }
    await updateSyncMetadata('plant_events');
  } catch (error) {
    console.error('[OfflineCache] Failed to cache plant events', error);
  }
};
