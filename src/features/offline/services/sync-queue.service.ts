export const enqueueMutation = async (
  tableName: string,
  recordId: string,
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  payload: any
) => {
  // Stub for future sync functionality
  console.log(`[SyncQueue] Queued ${operation} for ${tableName} (${recordId})`);
};

export const getPendingCount = async (): Promise<number> => {
  // Stub for future sync functionality
  return 0;
};

export const processSyncQueue = async () => {
  // Stub for future sync functionality
  console.log(`[SyncQueue] Processing sync queue...`);
};
