/**
 * 通用的异步操作Hook
 * 用于简化loading、error、success状态管理
 */
import { useState, useCallback } from 'react';

interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

export function useAsync<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (
    asyncFunction: () => Promise<T>,
    options?: UseAsyncOptions<T>
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction();
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || '操作失败';
      setError(errorMessage);
      options?.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
}

