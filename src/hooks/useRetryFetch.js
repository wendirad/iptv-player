import { useState, useCallback } from 'react';

export function useRetryFetch(url, options = {}, maxRetries = 3) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let attempt = 0;
    let success = false;
    let lastError = null;
    let delay = 500;
    while (!success && attempt < maxRetries) {
      try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(res.statusText);
        const txt = await res.text();
        setData(txt);
        setError(null);
        success = true;
      } catch (e) {
        lastError = e;
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        attempt++;
      }
    }
    if (!success) setError(lastError);
    setLoading(false);
  }, [url, options, maxRetries]);

  return { data, error, loading, refetch: fetchData };
}
