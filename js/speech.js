(function () {
  const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let voices = [];
  let state = 'idle';
  let lastText = '';
  let utterance = null;

  function dispatch() {
    document.dispatchEvent(new CustomEvent('todaycook:speech', {
      detail: {
        state,
        speaking: state === 'playing',
        paused: state === 'paused',
        hasReplay: Boolean(lastText)
      }
    }));
  }

  function setState(next) {
    state = next;
    dispatch();
  }

  function loadVoices() {
    if (supported) voices = window.speechSynthesis.getVoices();
  }

  if (supported) {
    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
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

  function getKoreanVoice() {
    return voices.find(v => /^ko-KR$/i.test(v.lang))
      || voices.find(v => /^ko/i.test(v.lang))
      || null;
  }

  function cancel({ keepLast = true } = {}) {
    if (supported) window.speechSynthesis.cancel();
    utterance = null;
    if (!keepLast) lastText = '';
    setState('idle');
  }

  function speak(text, options = {}) {
    const normalized = normalize(text);
    if (!normalized) return false;
    if (!supported || !window.TODAYCOOK_CONFIG.SPEECH_ENABLED) {
      window.TC.toast('음성 재생을 사용할 수 없어요.');
      return false;
    }

    cancel({ keepLast: true });
    lastText = normalized;
    utterance = new SpeechSynthesisUtterance(normalized);
    utterance.lang = 'ko-KR';
    utterance.rate = options.rate || 0.94;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voice = getKoreanVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setState('playing');
    utterance.onpause = () => setState('paused');
    utterance.onresume = () => setState('playing');
    utterance.onend = () => {
      utterance = null;
      setState('idle');
    };
    utterance.onerror = event => {
      console.error('TodayCook TTS error:', event);
      utterance = null;
      setState('idle');
      window.TC.toast('음성 재생을 다시 눌러주세요.');
    };

    try {
      window.speechSynthesis.speak(utterance);
      setState('playing');
      return true;
    } catch (error) {
      console.error('TodayCook TTS start error:', error);
      setState('idle');
      window.TC.toast('음성 재생을 다시 눌러주세요.');
      return false;
    }
  }

  function pause() {
    if (!supported || state !== 'playing') return false;
    window.speechSynthesis.pause();
    setState('paused');
    return true;
  }

  function resume() {
    if (!supported || state !== 'paused') return false;
    window.speechSynthesis.resume();
    setState('playing');
    return true;
  }

  function replay() {
    return lastText ? speak(lastText) : false;
  }

  function stepText(step, index) {
    const parts = [`${index + 1}번째 단계입니다.`, step.text];
    if (step.tip) parts.push(`팁입니다. ${step.tip}`);
    return parts.join(' ');
  }

  function recipeText(recipe) {
    const ingredients = recipe.ingredients.map(i => `${i.name} ${i.amount}`).join(', ');
    const steps = recipe.steps.map((step, index) => stepText(step, index)).join(' ');
    return `${recipe.name} 레시피입니다. ${recipe.description || ''} 필요한 재료는 ${ingredients}입니다. ${steps}`;
  }

  window.addEventListener('hashchange', () => cancel({ keepLast: false }));
  window.addEventListener('pagehide', () => cancel({ keepLast: false }));

  window.TodayCookSpeech = {
    supported,
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
