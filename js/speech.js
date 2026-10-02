(function () {
  const config = window.TODAYCOOK_CONFIG;
  const MEMORY_CACHE_MAX = 24;
  const CACHE_NAME = 'todaycook-google-tts-v2';
  const ORDINALS = ['첫번째','두번째','세번째','네번째','다섯번째','여섯번째','일곱번째','여덟번째','아홉번째','열번째','열한번째','열두번째'];

  const memoryCache = new Map();
  let audio = null;
  let state = 'idle';
  let lastText = '';
  let lastAudioUrl = '';
  let playToken = 0;
  let nativeUtterance = null;
  let nativeMode = false;
  let repeatMode = false;

  function dispatch() {
    document.dispatchEvent(new CustomEvent('todaycook:speech', {
      detail: {
        state,
        speaking: state === 'playing',
        paused: state === 'paused',
        loading: state === 'loading',
        hasReplay: Boolean(lastAudioUrl || lastText),
        repeating: repeatMode,
        text: lastText
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

  function ordinal(index) {
    return ORDINALS[index] || `${index + 1}번째`;
  }

  function nativeSupported() {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  function pickKoreanVoice() {
    if (!nativeSupported()) return null;
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => /^ko-KR$/i.test(v.lang) && /male|남성/i.test(v.name))
      || voices.find(v => /^ko-KR$/i.test(v.lang))
      || voices.find(v => /^ko/i.test(v.lang))
      || null;
  }

  async function hashText(text) {
    const raw = [
      config.TTS_VOICE || 'ko-KR-Neural2-C',
      Number(config.TTS_RATE || 0.90).toFixed(2),
      Number(config.TTS_PITCH ?? -4.0).toFixed(1),
      text
    ].join('|');

    if (window.crypto?.subtle && window.TextEncoder) {
      const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
      return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    let h = 2166136261;
    for (let i = 0; i < raw.length; i += 1) {
      h ^= raw.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  function cacheRequest(key) {
    return new Request(`${location.origin}/__todaycook_tts_cache__/${key}`, { method: 'GET' });
  }

  async function persistentCacheGet(key) {
    if (!('caches' in window)) return '';
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(cacheRequest(key));
      if (!response) return '';
      const blob = await response.blob();
      if (!blob.size) return '';
      return URL.createObjectURL(blob);
    } catch (error) {
      console.warn('TTS persistent cache read failed:', error);
      return '';
    }
  }

  async function persistentCachePut(key, blob) {
    if (!('caches' in window) || !blob?.size) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(
        cacheRequest(key),
        new Response(blob, {
          headers: {
            'Content-Type': blob.type || 'audio/mpeg',
            'Cache-Control': 'public, max-age=31536000'
          }
        })
      );
    } catch (error) {
      console.warn('TTS persistent cache write failed:', error);
    }
  }

  function memoryCachePut(key, url) {
    if (!key || !url) return;
    if (memoryCache.has(key)) {
      const old = memoryCache.get(key);
      if (old && old !== url && old.startsWith('blob:')) URL.revokeObjectURL(old);
      memoryCache.delete(key);
    }
    memoryCache.set(key, url);
    while (memoryCache.size > MEMORY_CACHE_MAX) {
      const oldestKey = memoryCache.keys().next().value;
      const oldestUrl = memoryCache.get(oldestKey);
      memoryCache.delete(oldestKey);
      if (oldestUrl && oldestUrl !== lastAudioUrl && oldestUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldestUrl);
      }
    }
  }

  function audioBlobFromBase64(audioContent, mimeType = 'audio/mpeg') {
    const binary = atob(audioContent);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mimeType });
  }

  function handleUsageWarning(usage) {
    if (!usage?.warning) return;
    const threshold = Number(usage.warningThreshold || config.TTS_WARNING_CALLS || 300000);
    const key = `todaycook-tts-warning-${threshold}`;
    try {
      if (sessionStorage.getItem(key) === '1') return;
      sessionStorage.setItem(key, '1');
    } catch (_) {}

    const message = usage.warningMessage ||
      `TTS 운영 기준 ${threshold.toLocaleString()}회에 도달했습니다. 서비스는 계속 실행됩니다. 지속 사용 시 Google Cloud 실제 문자 사용량을 확인하고 유료 사용 준비가 필요합니다.`;
    window.alert(`${message}\n\n※ 실제 Google Cloud TTS 과금 기준은 호출 횟수가 아니라 합성 문자 수입니다.`);
  }

  async function requestCloudAudio(text) {
    const normalized = normalize(text);
    const endpoint = String(config.TTS_API_URL || '').trim();
    if (!endpoint) throw new Error('TTS_API_URL_NOT_CONFIGURED');

    const key = await hashText(normalized);
    const memoryUrl = memoryCache.get(key);
    if (memoryUrl) return memoryUrl;

    const cachedUrl = await persistentCacheGet(key);
    if (cachedUrl) {
      memoryCachePut(key, cachedUrl);
      return cachedUrl;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.TTS_TIMEOUT_MS || 60000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: normalized,
          voice: config.TTS_VOICE || 'ko-KR-Neural2-C',
          rate: Number(config.TTS_RATE || 0.90),
          pitch: Number(config.TTS_PITCH ?? -4.0)
        }),
        signal: controller.signal,
        cache: 'no-store'
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok || !payload.data?.audioContent) {
        throw new Error(payload.detail || payload.error || `TTS_HTTP_${response.status}`);
      }

      handleUsageWarning(payload.data.usage);
      const blob = audioBlobFromBase64(payload.data.audioContent, payload.data.mimeType || 'audio/mpeg');
      await persistentCachePut(key, blob);
      const objectUrl = URL.createObjectURL(blob);
      memoryCachePut(key, objectUrl);
      return objectUrl;
    } finally {
      clearTimeout(timer);
    }
  }

  function bindAudio(url, token) {
    audio?.pause();
    audio = new Audio(url);
    audio.preload = 'auto';
    audio.loop = repeatMode;
    audio.onplay = () => { if (token === playToken) setState('playing'); };
    audio.onpause = () => {
      if (token !== playToken || state === 'idle' || audio.ended) return;
      setState('paused');
    };
    audio.onended = () => { if (token === playToken) setState('idle'); };
    audio.onerror = () => {
      if (token !== playToken) return;
      setState('idle');
      window.TC.toast('음성 재생을 다시 눌러주세요.');
    };
  }

  function speakNative(text, token) {
    if (!nativeSupported()) return false;
    try {
      window.speechSynthesis.cancel();
      nativeMode = true;
      nativeUtterance = new SpeechSynthesisUtterance(text);
      nativeUtterance.lang = 'ko-KR';
      nativeUtterance.rate = 0.90;
      nativeUtterance.pitch = 0.72;
      nativeUtterance.volume = 1;
      const voice = pickKoreanVoice();
      if (voice) nativeUtterance.voice = voice;

      nativeUtterance.onstart = () => { if (token === playToken) setState('playing'); };
      nativeUtterance.onpause = () => { if (token === playToken) setState('paused'); };
      nativeUtterance.onresume = () => { if (token === playToken) setState('playing'); };
      nativeUtterance.onend = () => {
        if (token !== playToken) return;
        nativeUtterance = null;
        if (repeatMode) {
          setTimeout(() => {
            if (token === playToken && repeatMode) speakNative(text, token);
          }, 180);
          return;
        }
        nativeMode = false;
        setState('idle');
      };
      nativeUtterance.onerror = () => {
        if (token !== playToken) return;
        nativeUtterance = null;
        nativeMode = false;
        setState('idle');
      };

      window.speechSynthesis.speak(nativeUtterance);
      setState('playing');
      return true;
    } catch (error) {
      console.error('Native TTS error:', error);
      nativeUtterance = null;
      nativeMode = false;
      return false;
    }
  }

  async function playUrl(url, text) {
    const token = ++playToken;
    lastText = normalize(text);
    lastAudioUrl = url;
    nativeMode = false;
    bindAudio(url, token);
    await audio.play();
    return true;
  }

  async function playStaticAudio(path, text) {
    if (!path) return false;
    try {
      return await playUrl(path, text);
    } catch (error) {
      console.warn('Static audio fallback failed:', error);
      return false;
    }
  }

  async function speakWithFallback(text, staticPath = '') {
    const normalized = normalize(text);
    if (!normalized || !config.SPEECH_ENABLED) return false;

    cancel({ keepLast: true });
    const token = ++playToken;
    lastText = normalized;
    lastAudioUrl = '';
    setState('loading');

    try {
      const cloudUrl = await requestCloudAudio(normalized);
      if (token !== playToken) return false;
      lastAudioUrl = cloudUrl;
      nativeMode = false;
      bindAudio(cloudUrl, token);
      await audio.play();
      return true;
    } catch (error) {
      if (token !== playToken || error?.name === 'AbortError') return false;
      console.warn('Google Cloud TTS unavailable:', error);

      if (staticPath) {
        try {
          lastAudioUrl = staticPath;
          bindAudio(staticPath, token);
          await audio.play();
          return true;
        } catch (staticError) {
          console.warn('Static TTS fallback unavailable:', staticError);
        }
      }

      if (speakNative(normalized, token)) return true;
      setState('idle');
      window.TC.toast('음성 연결을 확인해주세요.');
      return false;
    }
  }

  function speak(text) {
    return speakWithFallback(text, '');
  }

  function speakStep(recipe, index) {
    return speakWithFallback(
      stepText(recipe.steps[index], index),
      `assets/audio/${recipe.id}/step-${index + 1}.mp3`
    );
  }

  function speakRecipe(recipe) {
    return speakWithFallback(
      recipeText(recipe),
      `assets/audio/${recipe.id}/full.mp3`
    );
  }

  function setRepeat(enabled) {
    repeatMode = Boolean(enabled);
    if (audio) audio.loop = repeatMode;
    dispatch();
    return repeatMode;
  }

  function pause() {
    if (state !== 'playing') return false;
    if (nativeMode && nativeSupported()) {
      window.speechSynthesis.pause();
      setState('paused');
      return true;
    }
    if (!audio) return false;
    audio.pause();
    return true;
  }

  async function resume() {
    if (state !== 'paused') return false;
    if (nativeMode && nativeSupported()) {
      window.speechSynthesis.resume();
      setState('playing');
      return true;
    }
    if (!audio) return false;
    try {
      await audio.play();
      return true;
    } catch (error) {
      console.error('TTS resume error:', error);
      window.TC.toast('음성 재생을 다시 눌러주세요.');
      return false;
    }
  }

  async function replay() {
    if (nativeMode) return lastText ? speakNative(lastText, ++playToken) : false;
    if (!lastAudioUrl) return lastText ? speak(lastText) : false;
    const token = ++playToken;
    bindAudio(lastAudioUrl, token);
    audio.currentTime = 0;
    try {
      await audio.play();
      return true;
    } catch (error) {
      console.error('TTS replay error:', error);
      return false;
    }
  }

  function cancel({ keepLast = true } = {}) {
    playToken += 1;
    if (nativeSupported()) window.speechSynthesis.cancel();
    nativeUtterance = null;
    nativeMode = false;
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
    const parts = [`${ordinal(index)} 단계입니다.`, step.text];
    if (step.tip) parts.push(`팁입니다. ${step.tip}`);
    return parts.join(' ');
  }

  function recipeText(recipe) {
    const ingredients = recipe.ingredients.map(item => `${item.name} ${item.amount}`).join(', ');
    const steps = recipe.steps.map((step, index) => stepText(step, index)).join(' ');
    return `${recipe.name} 레시피입니다. ${recipe.description || ''} 필요한 재료는 ${ingredients}입니다. ${steps}`;
  }

  window.addEventListener('hashchange', () => {
    setRepeat(false);
    cancel({ keepLast: false });
  });
  window.addEventListener('pagehide', () => {
    setRepeat(false);
    cancel({ keepLast: false });
  });

  window.TodayCookSpeech = {
    supported: true,
    speak,
    speakStep,
    speakRecipe,
    pause,
    resume,
    replay,
    setRepeat,
    cancel,
    stepText,
    recipeText,
    get state() { return state; },
    get speaking() { return state === 'playing'; },
    get paused() { return state === 'paused'; },
    get repeating() { return repeatMode; }
  };
})();
