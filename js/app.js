(function () {
  const { $, $$, escapeHtml, image, meta, toast, shuffle } = window.TC;
  const app = $('#app');
  let recipes = [];
  let recommendation = null;
  let recipeFilter = { query: '', category: '전체', time: 0, difficulty: '' };
  let shoppingFilter = 'all';
  let selectedIngredients = new Set();
  let cookStep = 0;

  const recipeCard = recipe => `<a class="recipe-card" href="#/recipe/${recipe.id}"><div>${image(recipe)}</div><div class="card-body"><h3>${escapeHtml(recipe.name)}</h3><div class="card-meta"><span>⏱ ${recipe.timeMinutes}분</span><span>${escapeHtml(recipe.difficulty)}</span></div></div></a>`;

  function homeView() {
    recommendation ||= recipes[Math.floor(Math.random() * recipes.length)];
    const quick = ['5분','10분','15분','초간단','토스트','분식','디저트','전자레인지','건강','바삭'];
    const popular = recipes.filter(r => ['street-toast','tteok-kkochi','corn-cheese','choco-mug-cake'].includes(r.id));
    app.innerHTML = `<section><p class="eyebrow">오늘은 어떤 간식이 당길까요?</p><h1>오늘 뭐먹지?<br><span class="snack-subtitle">간식편</span></h1></section>
      <section class="section"><div class="section-head"><h2>오늘의 추천 간식</h2></div><article class="hero-card"><div class="hero-image">${image(recommendation)}</div><div class="hero-body"><h2>${escapeHtml(recommendation.name)}</h2><p class="muted">${escapeHtml(recommendation.description)}</p>${meta(recommendation)}<div class="actions"><a class="button" href="#/recipe/${recommendation.id}">이 간식 만들래요</a><button class="button secondary" id="reroll" type="button">🎲 다른 메뉴 추천</button></div></div></article></section>
      <section class="section"><div class="section-head"><h2>빠르게 골라볼까요?</h2></div><div class="chips">${quick.map(q=>`<button class="chip quick-chip" type="button" data-filter="${q}">${q}</button>`).join('')}</div></section>
      <section class="section"><a class="fridge-banner" href="#/ingredients"><span><b>집에 있는 재료로 간식 찾기</b><span>있는 재료를 고르면 만들 수 있는 간식을 추천해요</span></span><strong aria-hidden="true">🥬 →</strong></a></section>
      <section class="section"><div class="section-head"><h2>인기 간식</h2><a class="text-link" href="#/recipes">전체 보기</a></div><div class="recipe-grid">${popular.map(recipeCard).join('')}</div></section>`;
    $('#reroll').addEventListener('click', () => { recommendation = shuffle(recipes.filter(r => r.id !== recommendation.id))[0]; homeView(); app.scrollTo?.(0,0); });
    $$('.quick-chip').forEach(button => button.addEventListener('click', () => {
      const value = button.dataset.filter;
      recipeFilter = { query: '', category: '전체', time: 0, difficulty: '' };
      if (value === '5분') recipeFilter.time = 5;
      else if (value === '10분') recipeFilter.time = 10;
      else if (value === '15분') recipeFilter.time = 15;
      else if (value === '초간단') recipeFilter.difficulty = '아주 쉬움';
      else recipeFilter.category = value;
      location.hash = '#/recipes';
    }));
  }

  function filteredRecipes() {
    const q = recipeFilter.query.toLowerCase().trim();
    return recipes.filter(recipe => {
      const text = `${recipe.name} ${recipe.description} ${recipe.tags.join(' ')} ${recipe.ingredients.map(i=>i.name).join(' ')}`.toLowerCase();
      return (!q || text.includes(q)) && (recipeFilter.category === '전체' || recipe.category === recipeFilter.category) && (!recipeFilter.time || recipe.timeMinutes <= recipeFilter.time) && (!recipeFilter.difficulty || recipe.difficulty === recipeFilter.difficulty);
    });
  }

  function recipesView() {
    const categories = ['전체','토스트','분식','전자레인지','간편','디저트','건강','바삭','달콤'];
    const results = filteredRecipes();
    app.innerHTML = `<section><p class="eyebrow">쉬운 간식 모음</p><h1>간식 찾기</h1><div class="search-wrap"><span aria-hidden="true">⌕</span><label class="sr-only" for="recipe-search">간식명 또는 재료 검색</label><input id="recipe-search" type="search" value="${escapeHtml(recipeFilter.query)}" placeholder="간식명, 재료 검색"></div>
      <div class="chips filter-row" aria-label="카테고리">${categories.map(c=>`<button class="chip category ${recipeFilter.category===c?'active':''}" type="button" data-category="${c}">${c}</button>`).join('')}</div>
      <div class="chips filter-row" aria-label="추가 필터"><button class="chip time ${recipeFilter.time===15?'active':''}" data-time="15">15분 이하</button><button class="chip time ${recipeFilter.time===10?'active':''}" data-time="10">10분 이하</button><button class="chip difficulty ${recipeFilter.difficulty==='아주 쉬움'?'active':''}" data-difficulty="아주 쉬움">아주 쉬움</button><button class="chip difficulty ${recipeFilter.difficulty==='쉬움'?'active':''}" data-difficulty="쉬움">쉬움</button></div>
      <div class="section-head"><h2>검색 결과 <small>(${results.length})</small></h2></div><div id="recipe-results">${results.length ? `<div class="recipe-grid">${results.map(recipeCard).join('')}</div>` : `<div class="empty"><span class="emoji">🔍</span><h2>조건에 맞는 간식을 찾지 못했어요.</h2><p>조건을 조금 줄여볼까요?</p><button class="button secondary" id="clear-filters">필터 초기화</button></div>`}</div></section>`;
    $('#recipe-search').addEventListener('input', window.TC.debounce(e => { recipeFilter.query = e.target.value; recipesView(); $('#recipe-search')?.focus(); }, 180));
    $$('.category').forEach(b => b.addEventListener('click', () => { recipeFilter.category = b.dataset.category; recipesView(); }));
    $$('.time').forEach(b => b.addEventListener('click', () => { const t=Number(b.dataset.time); recipeFilter.time = recipeFilter.time===t?0:t; recipesView(); }));
    $$('.difficulty').forEach(b => b.addEventListener('click', () => { const d=b.dataset.difficulty; recipeFilter.difficulty = recipeFilter.difficulty===d?'':d; recipesView(); }));
    $('#clear-filters')?.addEventListener('click', () => { recipeFilter={query:'',category:'전체',time:0,difficulty:''}; recipesView(); });
  }

  function detailView(recipe) {
    app.innerHTML = `<a class="back-link" href="#/recipes">← 간식 목록</a><div class="detail-image">${image(recipe)}</div><section class="detail-header"><h1>${escapeHtml(recipe.name)}</h1><p class="muted">${escapeHtml(recipe.description)}</p>${meta(recipe)}<div class="actions detail-actions"><button class="button secondary" id="speak-full">🔊 전체 듣기</button><button class="button secondary" id="add-shopping">🛒 장보기 추가</button><a class="button green" href="#/cook/${recipe.id}">▶ 간식 만들기</a></div></section>
      <section class="section"><h2>재료</h2><ul class="ingredient-list">${recipe.ingredients.map((item,i)=>`<li class="check-row"><input type="checkbox" id="ingredient-${i}"><label for="ingredient-${i}">${escapeHtml(item.name)}${item.optional?' <small>(선택)</small>':''}</label><span class="amount">${escapeHtml(item.amount)}</span></li>`).join('')}</ul></section>
      <section class="section"><h2>조리순서</h2><ol class="step-list">${recipe.steps.map(step=>`<li class="step-card"><span class="step-num">${step.order}</span><div><p>${escapeHtml(step.text)}</p>${step.tip?`<p class="tip">💡 ${escapeHtml(step.tip)}</p>`:''}</div></li>`).join('')}</ol></section>`;
    $('#speak-full').addEventListener('click', () => window.TodayCookSpeech.speak(window.TodayCookSpeech.recipeText(recipe)));
    $('#add-shopping').addEventListener('click', () => { const count = window.TodayCookShopping.addRecipe(recipe); toast(count ? `${count}개 재료를 장보기에 담았어요.` : '이미 장보기 목록에 있어요.'); });
  }

  function syncSpeechControls(detail = {}) {
    const mainButton = $('#speak-step');
    if (!mainButton) return;
    const state = detail.state || window.TodayCookSpeech.state;
    const pauseButton = $('#pause-speech');
    const replayButton = $('#replay-speech');
    if (state === 'loading') mainButton.textContent = '⏳ 음성 준비 중...';
    else if (state === 'playing') mainButton.textContent = '■ 음성 중지';
    else if (state === 'paused') mainButton.textContent = '▶ 계속 듣기';
    else mainButton.textContent = '🔊 현재 단계 듣기';
    if (pauseButton) {
      pauseButton.disabled = !(state === 'playing' || state === 'paused');
      pauseButton.textContent = state === 'paused' ? '▶ 계속 듣기' : '⏸ 일시정지';
    }
    if (replayButton) replayButton.disabled = detail.hasReplay === false;
  }

  function cookView(recipe) {
    const step = recipe.steps[cookStep];
    app.innerHTML = `<section class="cook-screen"><a class="back-link" href="#/recipe/${recipe.id}">← ${escapeHtml(recipe.name)}</a><p class="progress-label">${cookStep+1} / ${recipe.steps.length} 단계</p><div class="progress" aria-label="조리 진행률"><span style="width:${((cookStep+1)/recipe.steps.length)*100}%"></span></div><article class="cook-card"><h1>${escapeHtml(step.text)}</h1>${step.tip?`<p class="cook-tip">💡 ${escapeHtml(step.tip)}</p>`:''}</article><div class="voice-panel"><button class="voice-primary" id="speak-step" type="button">🔊 현재 단계 듣기</button><div class="voice-secondary"><button id="pause-speech" type="button" disabled>⏸ 일시정지</button><button id="replay-speech" type="button">↻ 다시 듣기</button><button id="speak-recipe" type="button">🔊 전체 레시피</button></div></div><div class="cook-controls"><button id="prev" ${cookStep===0?'disabled':''}>← 이전</button><button id="next">${cookStep===recipe.steps.length-1?'완료':'다음 →'}</button></div></section>`;
    $('#prev').addEventListener('click', () => { window.TodayCookSpeech.cancel(); if (cookStep>0) { cookStep--; cookView(recipe); } });
    $('#next').addEventListener('click', () => { window.TodayCookSpeech.cancel(); if (cookStep<recipe.steps.length-1) { cookStep++; cookView(recipe); } else { toast('맛있는 간식이 완성됐어요!'); location.hash=`#/recipe/${recipe.id}`; } });
    $('#speak-step').addEventListener('click', () => {
      const state = window.TodayCookSpeech.state;
      if (state === 'loading' || state === 'playing') window.TodayCookSpeech.cancel();
      else if (state === 'paused') window.TodayCookSpeech.resume();
      else window.TodayCookSpeech.speak(window.TodayCookSpeech.stepText(step, cookStep));
    });
    $('#pause-speech').addEventListener('click', () => {
      if (window.TodayCookSpeech.state === 'paused') window.TodayCookSpeech.resume();
      else window.TodayCookSpeech.pause();
    });
    $('#replay-speech').addEventListener('click', () => window.TodayCookSpeech.replay());
    $('#speak-recipe').addEventListener('click', () => window.TodayCookSpeech.speak(window.TodayCookSpeech.recipeText(recipe)));
    syncSpeechControls({ state: window.TodayCookSpeech.state, hasReplay: false });
  }

  function shoppingView() {
    const all = window.TodayCookShopping.read();
    const visible = all.filter(i => shoppingFilter==='done'?i.checked:shoppingFilter==='todo'?!i.checked:true);
    app.innerHTML = `<section><p class="eyebrow">잊지 말고 챙겨요</p><h1>장보기 목록</h1><div class="summary-tabs"><button data-shop-filter="all" class="${shoppingFilter==='all'?'active':''}">전체 (${all.length})</button><button data-shop-filter="done" class="${shoppingFilter==='done'?'active':''}">구매완료 (${all.filter(i=>i.checked).length})</button><button data-shop-filter="todo" class="${shoppingFilter==='todo'?'active':''}">미구매 (${all.filter(i=>!i.checked).length})</button></div>
      ${visible.length?`<ul class="shopping-list">${visible.map((item,i)=>`<li class="check-row"><input type="checkbox" id="shop-${i}" data-key="${escapeHtml(item.key)}" ${item.checked?'checked':''}><label class="grow" for="shop-${i}">${escapeHtml(item.name)} <span class="amount">${escapeHtml(item.amount)}</span><small class="muted"> · ${escapeHtml(item.recipeName)}</small></label><button class="icon-button remove-item" data-key="${escapeHtml(item.key)}" aria-label="${escapeHtml(item.name)} 삭제">×</button></li>`).join('')}</ul><div class="shopping-actions"><button class="button secondary danger" id="clear-done">완료 삭제</button><button class="button secondary danger" id="clear-all">전체 비우기</button></div>`:`<div class="empty"><span class="emoji">🛒</span><h2>장보기 목록이 비어 있어요.</h2><p>간식 레시피에서 필요한 재료를 한 번에 담아보세요.</p><a class="button" href="#/recipes">간식 찾기</a></div>`}</section>`;
    $$('[data-shop-filter]').forEach(b=>b.addEventListener('click',()=>{shoppingFilter=b.dataset.shopFilter;shoppingView();}));
    $$('.shopping-list input').forEach(input=>input.addEventListener('change',()=>{window.TodayCookShopping.toggle(input.dataset.key);shoppingView();}));
    $$('.remove-item').forEach(b=>b.addEventListener('click',()=>{window.TodayCookShopping.remove(b.dataset.key);shoppingView();}));
    $('#clear-done')?.addEventListener('click',()=>{window.TodayCookShopping.clearCompleted();shoppingView();});
    $('#clear-all')?.addEventListener('click',()=>{window.TodayCookShopping.clearAll();shoppingView();});
  }

  function ingredientsView() {
    const results = selectedIngredients.size ? window.TodayCookIngredients.match(recipes,[...selectedIngredients]) : [];
    const ready = results.filter(r=>r.missing.length===0).slice(0,6);
    const almost = results.filter(r=>r.missing.length>0&&r.missing.length<=2).slice(0,8);
    const resultMarkup = !selectedIngredients.size ? `<div class="empty section"><span class="emoji">👆</span><h2>집에 있는 재료를 골라주세요.</h2><p>여러 개를 선택할수록 추천이 정확해져요.</p></div>` : (!ready.length&&!almost.length ? `<div class="empty section"><span class="emoji">🥣</span><h2>선택한 재료로 바로 만들 수 있는 간식이 없어요.</h2><p>재료를 조금 더 선택해 볼까요?</p></div>` : `${ready.length?`<section class="match-group"><h2>지금 만들기 좋은 간식</h2><div class="recipe-grid">${ready.map(r=>recipeCard(r.recipe)).join('')}</div></section>`:''}${almost.length?`<section class="match-group"><h2>한두 가지만 더 있으면 돼요</h2><div class="recipe-grid">${almost.map(r=>`<div>${recipeCard(r.recipe)}<p class="missing">${r.missing.map(i=>i.name).join(', ')} 필요</p></div>`).join('')}</div></section>`:''}`);
    app.innerHTML = `<section><p class="eyebrow">냉장고 털기</p><h1>집에 어떤 재료가 있나요?</h1><p class="muted">있는 재료를 모두 선택해 주세요.</p><div class="ingredient-chips">${window.TodayCookIngredients.suggested.map(item=>`<button class="chip ingredient-choice" type="button" aria-pressed="${selectedIngredients.has(item)}" data-ingredient="${item}">${selectedIngredients.has(item)?'✓ ':''}${item}</button>`).join('')}</div>${resultMarkup}</section>`;
    $$('.ingredient-choice').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.ingredient;selectedIngredients.has(v)?selectedIngredients.delete(v):selectedIngredients.add(v);ingredientsView();}));
  }

  async function render() {
    window.TodayCookSpeech.cancel();
    const route = window.TodayCookRouter.parse();
    window.TodayCookRouter.setActive(route.name);
    cookStep = route.name === 'cook' ? cookStep : 0;
    window.scrollTo(0,0);
    if (!recipes.length) recipes = await window.TodayCookAPI.getRecipes();
    if (route.name === 'home') homeView();
    else if (route.name === 'recipes') recipesView();
    else if (route.name === 'shopping') shoppingView();
    else if (route.name === 'ingredients') ingredientsView();
    else if (route.name === 'recipe' || route.name === 'cook') {
      const recipe = recipes.find(r=>r.id===route.id);
      if (!recipe) { app.innerHTML='<div class="empty"><span class="emoji">🍳</span><h1>간식 레시피를 찾지 못했어요.</h1><a class="button" href="#/recipes">간식 목록으로</a></div>'; return; }
      route.name === 'recipe' ? detailView(recipe) : cookView(recipe);
    } else location.hash='#/home';
    app.focus({preventScroll:true});
  }

  document.addEventListener('todaycook:speech', event => syncSpeechControls(event.detail || {}));
  $('#surprise-button').addEventListener('click',()=>{recommendation=shuffle(recipes)[0];location.hash=`#/recipe/${recommendation.id}`;});
  window.addEventListener('hashchange',()=>render().catch(showError));
  function showError(error){console.error(error);app.innerHTML='<div class="empty"><span class="emoji">😥</span><h1>간식 정보를 불러오지 못했어요.</h1><p>잠시 후 다시 시도해 주세요.</p><button class="button" onclick="location.reload()">다시 시도</button></div>';}
  render().catch(showError).finally(()=>setTimeout(()=>$('#splash').classList.add('hide'),850));
})();
