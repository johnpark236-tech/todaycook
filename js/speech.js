(function () {
  const config = window.TODAYCOOK_CONFIG;
  const memoryCache = new Map();
  const MAX_CACHE_ITEMS = 12;
  let audio = null;
  let requestController = null;
  let state = 'idle';
  let lastText = '';
  let lastAudioUrl = '';
  let playToken = 0;

  function dispatch() {
    document.dispatchEvent(new CustomEvent('todaycook:speech', {
      detail: {
        state,
        speaking: state === 'playing',
        paused: state === 'paused',
        loading: state === 'loading',
        hasReplay: Boolean(lastAudioUrl || lastText)
      }
    }));
  }

  function setState(next) {
    state = next;
    dispatch();
  }

  function normalize(text) {
    return String(text || '')
      .replace(/1\/2\s*대/g, '반 대')
      .replace(/1\/2\s*개/g, '반 개')
      .replace(/1\/2\s*모/g, '반 모')
      .replace(/1\/3/g, '3분의 1')
      .replace(/1\/4/g, '4분의 1')
      .replace(/2\/3/g, '3분의 2')
      .replace(/(\d+(?:\.\d+)?)\s*cm/gi, '$1 센티미터')
      .replace(/(\d+(?:\.\d+)?)\s*ml/gi, '$1 밀리리터')
      .replace(/(\d+(?:\.\d+)?)\s*g/gi, '$1 그램')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function endpoint() {
    const base = String(config.TTS_API_URL || config.API_URL || '').replace(/\/+$/, '');
    if (!base) return '';
    return /\/api\/tts$/i.test(base) ? base : `${base}/api/tts`;
  }

  function cacheGet(key) {
    return memoryCache.get(key) || '';
  }

  function cachePut(key, url) {
    if (!key || !url || memoryCache.has(key)) return;
    memoryCache.set(key, url);
    if (memoryCache.size <= MAX_CACHE_ITEMS) return;
    const oldestKey = memoryCache.keys().next().value;
    const oldestUrl = memoryCache.get(oldestKey);
    memoryCache.delete(oldestKey);
    if (oldestUrl && oldestUrl !== lastAudioUrl) URL.revokeObjectURL(oldestUrl);
  }

  function audioUrlFromBase64(audioContent, mimeType = 'audio/mpeg') {
    const binary = atob(audioContent);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  }

  async function requestAudio(text) {
    const url = endpoint();
    if (!url || !config.SPEECH_ENABLED) throw new Error('TTS_NOT_CONFIGURED');
    const cachedUrl = cacheGet(text);
    if (cachedUrl) return cachedUrl;

    requestController?.abort();
    requestController = new AbortController();
    const timer = setTimeout(() => requestController.abort(), config.TTS_TIMEOUT_MS || 12000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ action: 'tts', text }),
        signal: requestController.signal,
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`TTS_HTTP_${response.status}`);
      const payload = await response.json();
      if (!payload.ok || !payload.data?.audioContent) throw new Error(payload.error || 'TTS_INVALID_RESPONSE');
      const objectUrl = audioUrlFromBase64(payload.data.audioContent, payload.data.mimeType || 'audio/mpeg');
      cachePut(text, objectUrl);
      return objectUrl;
    } finally {
      clearTimeout(timer);
      requestController = null;
    }
  }

  function bindAudio(url, token) {
    audio?.pause();
    audio = new Audio(url);
    audio.preload = 'auto';
    audio.onplay = () => { if (token === playToken) setState('playing'); };
    audio.onpause = () => {
      if (token !== playToken || state === 'idle' || audio.ended) return;
      setState('paused');
    };
    audio.onended = () => { if (token === playToken) setState('idle'); };
    audio.onerror = () => {
      if (token !== playToken) return;
      setState('idle');
      window.TC.toast('음성 연결을 확인해주세요.');
    };
  }

  async function speak(text) {
    const normalized = normalize(text);
    if (!normalized) return false;
    const url = endpoint();
    if (!url || !config.SPEECH_ENABLED) {
      window.TC.toast('음성 연결을 확인해주세요.');
      return false;
    }

    cancel({ keepLast: true });
    const token = ++playToken;
    lastText = normalized;
    setState('loading');
    try {
      const objectUrl = await requestAudio(normalized);
      if (token !== playToken) return false;
      lastAudioUrl = objectUrl;
      bindAudio(objectUrl, token);
      await audio.play();
      return true;
    } catch (error) {
      if (token !== playToken || error?.name === 'AbortError') return false;
      console.error('TodayCook TTS error:', error);
      setState('idle');
      window.TC.toast('음성 연결을 확인해주세요.');
      return false;
    }
  }

  function pause() {
    if (!audio || state !== 'playing') return false;
    audio.pause();
    return true;
  }

  async function resume() {
    if (!audio || state !== 'paused') return false;
    try {
      await audio.play();
      return true;
    } catch (error) {
      console.error('TodayCook TTS resume error:', error);
      window.TC.toast('음성 재생을 다시 눌러주세요.');
      return false;
    }
  }

  async function replay() {
    if (!lastAudioUrl) return lastText ? speak(lastText) : false;
    const token = ++playToken;
    bindAudio(lastAudioUrl, token);
    audio.currentTime = 0;
    try {
      await audio.play();
      return true;
    } catch (error) {
      console.error('TodayCook TTS replay error:', error);
      window.TC.toast('음성 재생을 다시 눌러주세요.');
      return false;
    }
  }

  function cancel({ keepLast = true } = {}) {
    playToken += 1;
    requestController?.abort();
    requestController = null;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio = null;
    }
    if (!keepLast) {
      lastText = '';
      lastAudioUrl = '';
    }
    setState('idle');
  }

  function stepText(step, index) {
    const parts = [`${index + 1}번째 단계입니다.`, step.text];
    if (step.tip) parts.push(`팁입니다. ${step.tip}`);
    return parts.join(' ');
  }

  function recipeText(recipe) {
    const ingredients = recipe.ingredients.map(item => `${item.name} ${item.amount}`).join(', ');
    const steps = recipe.steps.map((step, index) => stepText(step, index)).join(' ');
    return `${recipe.name} 레시피입니다. ${recipe.description || ''} 필요한 재료는 ${ingredients}입니다. ${steps}`;
  }

  window.addEventListener('hashchange', () => cancel({ keepLast: false }));
  window.addEventListener('pagehide', () => cancel({ keepLast: false }));
  window.TodayCookSpeech = {
    supported: true,
    speak,
    pause,
    resume,
    replay,
    cancel,
    stepText,
    recipeText,
    get state() { return state; },
    get speaking() { return state === 'playing'; },
    get paused() { return state === 'paused'; }
  };
})();
