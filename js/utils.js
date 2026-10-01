(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const debounce = (fn, delay = 200) => { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; };
  const shuffle = items => items.map(value => ({ value, order: Math.random() })).sort((a,b) => a.order-b.order).map(x => x.value);
  const image = recipe => `<img src="${escapeHtml(recipe.image)}" alt="${escapeHtml(recipe.name)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="image-fallback" hidden aria-hidden="true">🍲</span>`;
  const meta = recipe => `<div class="meta-row"><span class="badge">⏱ ${recipe.timeMinutes}분</span><span class="badge easy">${recipe.difficulty === '쉬움' ? '●' : '◆'} ${escapeHtml(recipe.difficulty)}</span><span class="badge">♙ ${recipe.servings}인분</span></div>`;
  let toastTimer;
  const toast = message => { const node = $('#toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 2200); };
  window.TC = { $, $$, escapeHtml, debounce, shuffle, image, meta, toast };
})();
