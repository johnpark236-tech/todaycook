(function () {
  const config = window.TODAYCOOK_CONFIG;
  let cache = null;

  async function fetchJson(url, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }

  async function localRecipes() {
    const payload = await fetchJson(config.FALLBACK_URL, config.API_TIMEOUT_MS);
    return payload.recipes || payload;
  }

  async function getRecipes({ force = false } = {}) {
    if (cache && !force) return cache;
    if (config.API_URL) {
      try {
        const payload = await fetchJson(`${config.API_URL}?action=recipes`, config.API_TIMEOUT_MS);
        if (payload.ok && Array.isArray(payload.data) && payload.data.length) {
          cache = payload.data;
          return cache;
        }
      } catch (error) {
        console.info('TodayCook API를 사용할 수 없어 로컬 데이터를 사용합니다.');
      }
    }
    if (!config.USE_LOCAL_FALLBACK) throw new Error('레시피 데이터를 불러오지 못했습니다.');
    cache = await localRecipes();
    return cache;
  }

  async function getRecipe(id) {
    const recipes = await getRecipes();
    return recipes.find(recipe => recipe.id === id) || null;
  }

  window.TodayCookAPI = { getRecipes, getRecipe };
})();
