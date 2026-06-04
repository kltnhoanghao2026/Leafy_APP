import { getDbAsync } from './offline-database';
import { Platform } from 'react-native';
import type { FarmPlotResponse, FarmZoneResponse } from '@/src/features/farm';
import type { PlantResponse, SpeciesResponse } from '@/src/features/plant';
import type { PlantEventResponse } from '@/src/features/plant-event';
import type { PlanResponse, PlanApplyResponse } from '@/src/features/plan/schemas/plan.schema';

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
        (id, ownerProfileId, name, code, description, areaM2, addressLine, provinceCode, districtCode, wardCode, latitude, longitude, boundaryGeojson, status, createdAt, lastModifiedAt, createdBy, lastModifiedBy, active, _dirty, _deleted) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          plot.id, plot.ownerProfileId, plot.name, plot.code, plot.description || null, plot.areaM2 || null, 
          plot.addressLine || null, plot.provinceCode || null, plot.districtCode || null, plot.wardCode || null, 
          plot.latitude || null, plot.longitude || null, 
          plot.boundaryGeojson ? JSON.stringify(plot.boundaryGeojson) : null, 
          plot.status, plot.createdAt, plot.lastModifiedAt,
          (plot as any).createdBy ?? null, (plot as any).lastModifiedBy ?? null,
          (plot as any).active === false ? 0 : 1
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
        (id, farmPlotId, ownerProfileId, zoneName, zoneCode, description, areaM2, soilType, cropType, plantingDate, elevationM, boundaryGeojson, status, createdAt, lastModifiedAt, createdBy, lastModifiedBy, active, _dirty, _deleted) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          zone.id, zone.farmPlotId, (zone as any).ownerProfileId ?? null,
          zone.zoneName, zone.zoneCode, zone.description || null, zone.areaM2 || null,
          zone.soilType || null, zone.cropType || null, zone.plantingDate || null, zone.elevationM || null,
          zone.boundaryGeojson ? JSON.stringify(zone.boundaryGeojson) : null,
          zone.status, zone.createdAt, zone.lastModifiedAt,
          (zone as any).createdBy ?? null, (zone as any).lastModifiedBy ?? null,
          (zone as any).active === false ? 0 : 1
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
        (id, plantNumber, plantStatus, nickName, tagCode, batchNumber, sourceType, motherPlantId, plantingDate, germinationDate, actualHarvestDate, totalYieldKg, speciesId, farmPlotId, farmZoneId, ownerProfileId, createdAt, lastModifiedAt, createdBy, lastModifiedBy, active, _dirty, _deleted) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          plant.id, plant.plantNumber, plant.plantStatus, plant.nickName || null, plant.tagCode || null,
          plant.batchNumber || null, plant.sourceType || null, plant.motherPlantId || null,
          plant.plantingDate || null, plant.germinationDate || null, plant.actualHarvestDate || null,
          plant.totalYieldKg || null, plant.speciesId, plant.farmPlotId, (plant as any).farmZoneId || null,
          (plant as any).ownerProfileId || null, (plant as any).createdAt || null, (plant as any).lastModifiedAt || null,
          (plant as any).createdBy ?? null, (plant as any).lastModifiedBy ?? null,
          (plant as any).active === false ? 0 : 1
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
        (id, plantId, farmPlotId, farmZoneId, targetType, eventType, note, description, daysFromStart, durationDays, planned, calculatedStartDate, calculatedEndDate, phiDays, ppeRequired, mrlNote, estimatedCost, sourcePlanId, planApplyId, parentPlantEventId, completed, trackingGranularity, excludedPlantIds, excludedFarmZoneIds, progressTotal, progressCompleted, tasks, attachmentIds, createdAt, lastModifiedAt, createdBy, lastModifiedBy, active, _dirty, _deleted) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          event.id, event.plantId || null, event.farmPlotId || null, event.farmZoneId || null,
          event.targetType || null, event.eventType, event.note, event.description || null,
          (event as any).daysFromStart ?? null, event.durationDays || null, event.planned ? 1 : 0,
          event.calculatedStartDate || null, event.calculatedEndDate || null,
          event.phiDays || null, event.ppeRequired || null, event.mrlNote || null,
          event.estimatedCost || null, event.sourcePlanId || null, event.planApplyId || null,
          event.parentPlantEventId || null, event.completed ? 1 : 0, event.trackingGranularity || null,
          event.excludedPlantIds ? JSON.stringify(event.excludedPlantIds) : null,
          event.excludedFarmZoneIds ? JSON.stringify(event.excludedFarmZoneIds) : null,
          event.progressTotal || 0, event.progressCompleted || 0,
          event.tasks ? JSON.stringify(event.tasks) : null,
          (event as any).attachmentIds ? JSON.stringify((event as any).attachmentIds) : null,
          (event as any).createdAt || null, (event as any).lastModifiedAt || null,
          (event as any).createdBy ?? null, (event as any).lastModifiedBy ?? null,
          (event as any).active === false ? 0 : 1
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

export const cachePlans = async (plans: PlanResponse[]) => {
  if (Platform.OS === 'web' || !plans || plans.length === 0) return;
  const db = await getDbAsync();
  try {
    for (const plan of plans) {
      await db.runAsync(
        `INSERT OR REPLACE INTO plans 
        (id, creatorId, ownerId, planName, diseaseName, severityLevel, urgency, sourceType, estimatedCost, createdAt, lastModifiedAt, active, _dirty, _deleted) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          plan.id, plan.creatorId || null, plan.ownerId || null, plan.planName || null,
          plan.diseaseName || null, plan.severityLevel || null, plan.urgency || null,
          plan.sourceType || null, plan.estimatedCost || null, plan.createdAt || null,
          plan.lastModifiedAt || null, plan.active === false ? 0 : 1
        ]
      );
    }
    await updateSyncMetadata('plans');
  } catch (error) {
    console.error('[OfflineCache] Failed to cache plans', error);
  }
};

export const cachePlanApplies = async (applies: PlanApplyResponse[]) => {
  if (Platform.OS === 'web' || !applies || applies.length === 0) return;
  const db = await getDbAsync();
  try {
    for (const apply of applies) {
      await db.runAsync(
        `INSERT OR REPLACE INTO plan_applies 
        (id, planId, appliedById, plantId, farmPlotId, farmZoneId, planName, diseaseName, targetName, startDate, trackingGranularity, status, createdAt, lastModifiedAt, _dirty, _deleted) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [
          apply.id, apply.planId, apply.appliedById || null, apply.plantId || null,
          apply.farmPlotId || null, apply.farmZoneId || null, apply.planName || null,
          apply.diseaseName || null, apply.targetName || null, apply.startDate || null,
          apply.trackingGranularity || null, apply.status, apply.createdAt || null,
          apply.lastModifiedAt || null
        ]
      );
    }
    await updateSyncMetadata('plan_applies');
  } catch (error) {
    console.error('[OfflineCache] Failed to cache plan applies', error);
  }
};
