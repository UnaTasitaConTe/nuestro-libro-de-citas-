import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Hook that syncs pagination state with the URL query param `?page=N`.
 * When the user navigates back, the page is restored from the URL.
 */
export default function usePageParam(paramName = 'page') {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, parseInt(searchParams.get(paramName), 10) || 1);

  const setPage = useCallback(
    (newPage) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (newPage <= 1) {
          next.delete(paramName);
        } else {
          next.set(paramName, String(newPage));
        }
        return next;
      });
    },
    [paramName, setSearchParams]
  );

  return [page, setPage];
}
