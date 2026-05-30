export const fetchWithFallback = async (apiUrl, fallbackUrl) => {
  try {
    const res = await fetch(apiUrl);

    if (!res.ok) throw new Error("API unavailable");

    return await res.json();
  } catch (err) {
    console.warn(`${apiUrl} unavailable, using ${fallbackUrl}`);

    const fallbackRes = await fetch(fallbackUrl);

    if (!fallbackRes.ok) {
      throw new Error(`Fallback unavailable: ${fallbackUrl}`);
    }

    return await fallbackRes.json();
  }
};