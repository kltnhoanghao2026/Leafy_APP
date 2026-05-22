import React from 'react';
import PredictScreen from '@/src/features/disease-detection/components/PredictScreen';

export default function OfflinePredictRoute() {
  return <PredictScreen offlineMode={true} />;
}
