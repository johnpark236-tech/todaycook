(function () {
  const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let voices = [];
  let speaking = false;

  function loadVoices() { if (supported) voices = window.speechSynthesis.getVoices(); }
  if (supported) {
    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
  }

  function normalize(text) {
    return String(text)
      .replace(/1\/2\s*대/g, '반 대')
      .replace(/1\/2\s*개/g, '반 개')
      .replace(/1\/2\s*모/g, '반 모')
      .replace(/(\d+)ml/gi, '$1 밀리리터')
      .replace(/(\d+)g/gi, '$1 그램');
  }

  function getKoreanVoice() {
    return voices.find(v => v.lang === 'ko-KR') || voices.find(v => v.lang?.toLowerCase().startsWith('ko')) || null;
  }

  function cancel() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    speaking = false;
    document.dispatchEvent(new CustomEvent('todaycook:speech', { detail: { speaking: false } }));
  }

  function speak(text, options = {}) {
    if (!supported || !window.TODAYCOOK_CONFIG.SPEECH_ENABLED) {
      window.TC.toast('이 브라우저에서는 음성 읽기를 지원하지 않아요.');
      return false;
    }
    cancel();
    const utterance = new SpeechSynthesisUtterance(normalize(text));
    utterance.lang = 'ko-KR';
    utterance.rate = options.rate || 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    const voice = getKoreanVoice();
    if (voice) utterance.voice = voice;
    utterance.onstart = () => { speaking = true; document.dispatchEvent(new CustomEvent('todaycook:speech', { detail: { speaking: true } })); };
    utterance.onend = utterance.onerror = () => { speaking = false; document.dispatchEvent(new CustomEvent('todaycook:speech', { detail: { speaking: false } })); };
    window.speechSynthesis.speak(utterance);
    return true;
  }

  function recipeText(recipe) {
    const ingredients = recipe.ingredients.map(i => `${i.name} ${i.amount}`).join(', ');
    const steps = recipe.steps.map(s => `${s.order}번째 단계입니다. ${s.text}`).join(' ');
    return `${recipe.name}. ${recipe.description} 필요한 재료는 ${ingredients}입니다. ${steps}`;
  }

  window.addEventListener('hashchange', cancel);
  window.addEventListener('pagehide', cancel);
  window.TodayCookSpeech = { supported, speak, cancel, recipeText, get speaking() { return speaking; } };
})();
