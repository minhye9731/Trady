import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { api, errorMessage } from '@/lib/api';

/**
 * GETs `path` whenever the screen gains focus, so data stays fresh after
 * edits made in modals or other tabs.
 */
export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const hasData = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<T>(path);
      setData(res.data);
      hasData.current = true;
      setError(null);
    } catch (e) {
      setError(errorMessage(e, 'Failed to load'));
    }
  }, [path]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return {
    data,
    setData,
    error,
    loading: data === null && error === null && !hasData.current,
    refreshing,
    refresh,
    reload: load,
  };
}
