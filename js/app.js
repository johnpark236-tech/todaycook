(function () {
  const { $, $$, escapeHtml, image, meta, toast, shuffle } = window.TC;
  const app = $('#app');
  let recipes = [];
  let recommendation = null;
  let recipeFilter = { query: '', category: '전체', time: 0, difficulty: '' };
  let shoppingFilter = 'all';
  let selectedIngredients = new Set();
  let cookStep = 0;

  const recipeCard = recipe => `<a class="recipe-card" href="#/recipe/${recipe.id}"><div class="recipe-thumb">${image(recipe)}</div><div class="card-body"><h3>${escapeHtml(recipe.name)}</h3><div class="card-meta"><span>⏱ ${recipe.timeMinutes}분</span><span>${escapeHtml(recipe.difficulty)}</span></div></div></a>`;

  function homeView() {
    recommendation ||= recipes[Math.floor(Math.random() * recipes.length)];
    const quick = ['15분','30분','초간단','찌개','국','밥','면','반찬','고기','채소'];
    const popular = recipes.filter(r => ['kimchi-jjigae','jeyuk-bokkeum','gyeran-mari','bibimbap'].includes(r.id));
    app.innerHTML = `<section><p class="eyebrow">오늘도 맛있는 집밥 한 끼</p><h1>오늘은 어떤 집밥이<br>좋을까요?</h1></section>
      <section class="section"><div class="section-head"><h2>오늘의 추천 집밥</h2></div><article class="hero-card"><div class="hero-image">${image(recommendation)}</div><div class="hero-body"><h2>${escapeHtml(recommendation.name)}</h2><p class="muted">${escapeHtml(recommendation.description)}</p>${meta(recommendation)}<div class="actions"><a class="button" href="#/recipe/${recommendation.id}">이걸로 요리할래요</a><button class="button secondary" id="reroll" type="button">🎲 다른 메뉴 추천</button></div></div></article></section>
      <section class="section"><div class="section-head"><h2>빠르게 골라볼까요?</h2></div><div class="chips">${quick.map(q=>`<button class="chip quick-chip" type="button" data-filter="${q}">${q}</button>`).join('')}</div></section>
      <section class="section"><a class="fridge-banner" href="#/ingredients"><span><b>집에 있는 재료로 찾아보기</b><span>있는 재료를 고르면 메뉴를 추천해요</span></span><strong aria-hidden="true">🥬 →</strong></a></section>
      <section class="section"><div class="section-head"><h2>인기 집밥</h2><a class="text-link" href="#/recipes">전체 보기</a></div><div class="recipe-grid">${popular.map(recipeCard).join('')}</div></section>`;
    $('#reroll').addEventListener('click', () => { recommendation = shuffle(recipes.filter(r => r.id !== recommendation.id))[0]; homeView(); app.scrollTo?.(0,0); });
    $$('.quick-chip').forEach(button => button.addEventListener('click', () => {
      const value = button.dataset.filter;
      recipeFilter = { query: '', category: '전체', time: 0, difficulty: '' };
      if (value === '15분') recipeFilter.time = 15;
      else if (value === '30분') recipeFilter.time = 30;
      else if (value === '초간단') recipeFilter.difficulty = '쉬움';
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
    const categories = ['전체','찌개','국','밥','면','반찬','볶음','고기','채소'];
    const results = filteredRecipes();
    app.innerHTML = `<section><p class="eyebrow">쉬운 집밥 모음</p><h1>요리 찾기</h1><div class="search-wrap"><span aria-hidden="true">⌕</span><label class="sr-only" for="recipe-search">요리명 또는 재료 검색</label><input id="recipe-search" type="search" value="${escapeHtml(recipeFilter.query)}" placeholder="요리명, 재료 검색"></div>
      <div class="chips filter-row" aria-label="카테고리">${categories.map(c=>`<button class="chip category ${recipeFilter.category===c?'active':''}" type="button" data-category="${c}">${c}</button>`).join('')}</div>
      <div class="chips filter-row" aria-label="추가 필터"><button class="chip time ${recipeFilter.time===15?'active':''}" data-time="15">15분 이하</button><button class="chip time ${recipeFilter.time===30?'active':''}" data-time="30">30분 이하</button><button class="chip difficulty ${recipeFilter.difficulty==='쉬움'?'active':''}" data-difficulty="쉬움">쉬움</button><button class="chip difficulty ${recipeFilter.difficulty==='보통'?'active':''}" data-difficulty="보통">보통</button></div>
      <div class="section-head"><h2>검색 결과 <small>(${results.length})</small></h2></div><div id="recipe-results">${results.length ? `<div class="recipe-grid">${results.map(recipeCard).join('')}</div>` : `<div class="empty"><span class="emoji">🔍</span><h2>조건에 맞는 요리를 찾지 못했어요.</h2><p>조건을 조금 줄여볼까요?</p><button class="button secondary" id="clear-filters">필터 초기화</button></div>`}</div></section>`;
    $('#recipe-search').addEventListener('input', window.TC.debounce(e => { recipeFilter.query = e.target.value; recipesView(); $('#recipe-search')?.focus(); }, 180));
    $$('.category').forEach(b => b.addEventListener('click', () => { recipeFilter.category = b.dataset.category; recipesView(); }));
    $$('.time').forEach(b => b.addEventListener('click', () => { const t=Number(b.dataset.time); recipeFilter.time = recipeFilter.time===t?0:t; recipesView(); }));
    $$('.difficulty').forEach(b => b.addEventListener('click', () => { const d=b.dataset.difficulty; recipeFilter.difficulty = recipeFilter.difficulty===d?'':d; recipesView(); }));
    $('#clear-filters')?.addEventListener('click', () => { recipeFilter={query:'',category:'전체',time:0,difficulty:''}; recipesView(); });
  }

  function detailView(recipe) {
    app.innerHTML = `<a class="back-link" href="#/recipes">← 요리 목록</a><div class="detail-image">${image(recipe)}</div><section class="detail-header"><h1>${escapeHtml(recipe.name)}</h1><p class="muted">${escapeHtml(recipe.description)}</p>${meta(recipe)}<div class="actions detail-actions"><button class="button secondary" id="speak-full">🔊 전체 듣기</button><button class="button secondary" id="add-shopping">🛒 장보기 추가</button><a class="button green" href="#/cook/${recipe.id}">▶ 요리 시작</a></div></section>
      <section class="section"><h2>재료</h2><ul class="ingredient-list">${recipe.ingredients.map((item,i)=>`<li class="check-row"><input type="checkbox" id="ingredient-${i}"><label for="ingredient-${i}">${escapeHtml(item.name)}${item.optional?' <small>(선택)</small>':''}</label><span class="amount">${escapeHtml(item.amount)}</span></li>`).join('')}</ul></section>
      <section class="section"><h2>조리순서 · 음성 대사</h2><ol class="step-list">${recipe.steps.map((step,index)=>`<li class="step-card"><span class="step-num">${step.order}</span><div><p class="step-script">${escapeHtml(window.TodayCookSpeech.stepText(step,index))}</p></div></li>`).join('')}</ol></section>`;
    $('#speak-full').addEventListener('click', () => {
      window.TodayCookSpeech.setRepeat(false);
      window.TodayCookSpeech.speakRecipe(recipe);
    });
    $('#add-shopping').addEventListener('click', () => {
      const count = window.TodayCookShopping.addRecipe(recipe);
      toast(count ? `${count}개 재료를 장보기에 담았어요.` : '이미 장보기 목록에 있어요.');
    });
  }

  function syncSpeechControls(detail = {}) {
    const onceButton = $('#speak-step');
    if (!onceButton) return;
    const repeatButton = $('#repeat-speech');
    const pauseButton = $('#pause-speech');
    const replayButton = $('#replay-speech');
    const state = detail.state || window.TodayCookSpeech.state;
    const repeating = typeof detail.repeating === 'boolean'
      ? detail.repeating
      : window.TodayCookSpeech.repeating;

    onceButton.textContent = state === 'loading' && !repeating ? '⏳ 준비 중...' : '🔊 1회 듣기';

    if (repeatButton) {
      repeatButton.textContent = repeating ? '■ 반복 중지' : '🔁 반복 듣기';
      repeatButton.classList.toggle('active', repeating);
      repeatButton.setAttribute('aria-pressed', repeating ? 'true' : 'false');
    }

    if (pauseButton) {
      pauseButton.disabled = !(state === 'playing' || state === 'paused');
      pauseButton.textContent = state === 'paused' ? '▶ 계속 듣기' : '⏸ 일시정지';
    }
    if (replayButton) replayButton.disabled = detail.hasReplay === false;
  }

  function cookView(recipe) {
    const step = recipe.steps[cookStep];
    const stepScript = window.TodayCookSpeech.stepText(step, cookStep);
    app.innerHTML = `<section class="cook-screen"><a class="back-link" href="#/recipe/${recipe.id}">← ${escapeHtml(recipe.name)}</a><p class="progress-label">${cookStep+1} / ${recipe.steps.length} 단계</p><div class="progress" aria-label="조리 진행률"><span style="width:${((cookStep+1)/recipe.steps.length)*100}%"></span></div><article class="cook-card"><p class="speech-caption-label">🔊 음성 대사</p><h1 class="speech-caption" id="speech-caption">${escapeHtml(stepScript)}</h1></article><div class="voice-panel"><div class="voice-mode-row"><button class="voice-primary" id="speak-step" type="button">🔊 1회 듣기</button><button class="voice-repeat" id="repeat-speech" type="button" aria-pressed="false">🔁 반복 듣기</button></div><div class="voice-secondary"><button id="pause-speech" type="button" disabled>⏸ 일시정지</button><button id="replay-speech" type="button">↻ 다시 듣기</button><button id="speak-recipe" type="button">🔊 전체 레시피</button></div></div><div class="cook-controls"><button id="prev" ${cookStep===0?'disabled':''}>← 이전</button><button id="next">${cookStep===recipe.steps.length-1?'완료':'다음 →'}</button></div></section>`;

    const setCaption = text => {
      const node = $('#speech-caption');
      if (node) node.textContent = text;
    };
    const playCurrentStep = () => {
      setCaption(window.TodayCookSpeech.stepText(step, cookStep));
      return window.TodayCookSpeech.speakStep(recipe, cookStep);
    };

    $('#prev').addEventListener('click', () => {
      window.TodayCookSpeech.setRepeat(false);
      window.TodayCookSpeech.cancel();
      if (cookStep > 0) { cookStep--; cookView(recipe); }
    });

    $('#next').addEventListener('click', () => {
      window.TodayCookSpeech.setRepeat(false);
      window.TodayCookSpeech.cancel();
      if (cookStep < recipe.steps.length - 1) { cookStep++; cookView(recipe); }
      else { toast('맛있는 요리가 완성됐어요!'); location.hash = `#/recipe/${recipe.id}`; }
    });

    $('#speak-step').addEventListener('click', () => {
      window.TodayCookSpeech.setRepeat(false);
      window.TodayCookSpeech.cancel();
      playCurrentStep();
    });

    $('#repeat-speech').addEventListener('click', () => {
      if (window.TodayCookSpeech.repeating) {
        window.TodayCookSpeech.setRepeat(false);
        window.TodayCookSpeech.cancel();
        setCaption(stepScript);
        return;
      }
      window.TodayCookSpeech.cancel();
      window.TodayCookSpeech.setRepeat(true);
      playCurrentStep();
    });

    $('#pause-speech').addEventListener('click', () => {
      if (window.TodayCookSpeech.state === 'paused') window.TodayCookSpeech.resume();
      else window.TodayCookSpeech.pause();
    });

    $('#replay-speech').addEventListener('click', () => {
      window.TodayCookSpeech.setRepeat(false);
      setCaption(window.TodayCookSpeech.stepText(step, cookStep));
      window.TodayCookSpeech.replay();
    });

    $('#speak-recipe').addEventListener('click', () => {
      const fullScript = window.TodayCookSpeech.recipeText(recipe);
      window.TodayCookSpeech.setRepeat(false);
      window.TodayCookSpeech.cancel();
      setCaption(fullScript);
      window.TodayCookSpeech.speakRecipe(recipe);
    });

    syncSpeechControls({
      state: window.TodayCookSpeech.state,
      hasReplay: false,
      repeating: window.TodayCookSpeech.repeating
    });
  }

  function shoppingView() {
    const all = window.TodayCookShopping.read();
    const visible = all.filter(i => shoppingFilter==='done'?i.checked:shoppingFilter==='todo'?!i.checked:true);
    app.innerHTML = `<section><p class="eyebrow">잊지 말고 챙겨요</p><h1>장보기 목록</h1><div class="summary-tabs"><button data-shop-filter="all" class="${shoppingFilter==='all'?'active':''}">전체 (${all.length})</button><button data-shop-filter="done" class="${shoppingFilter==='done'?'active':''}">구매완료 (${all.filter(i=>i.checked).length})</button><button data-shop-filter="todo" class="${shoppingFilter==='todo'?'active':''}">미구매 (${all.filter(i=>!i.checked).length})</button></div>
      ${visible.length?`<ul class="shopping-list">${visible.map((item,i)=>`<li class="check-row"><input type="checkbox" id="shop-${i}" data-key="${escapeHtml(item.key)}" ${item.checked?'checked':''}><label class="grow" for="shop-${i}">${escapeHtml(item.name)} <span class="amount">${escapeHtml(item.amount)}</span><small class="muted"> · ${escapeHtml(item.recipeName)}</small></label><button class="icon-button remove-item" data-key="${escapeHtml(item.key)}" aria-label="${escapeHtml(item.name)} 삭제">×</button></li>`).join('')}</ul><div class="shopping-actions"><button class="button secondary danger" id="clear-done">완료 삭제</button><button class="button secondary danger" id="clear-all">전체 비우기</button></div>`:`<div class="empty"><span class="emoji">🛒</span><h2>장보기 목록이 비어 있어요.</h2><p>레시피에서 필요한 재료를 한 번에 담아보세요.</p><a class="button" href="#/recipes">요리 찾기</a></div>`}</section>`;
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
    const resultMarkup = !selectedIngredients.size ? `<div class="empty section"><span class="emoji">👆</span><h2>집에 있는 재료를 골라주세요.</h2><p>여러 개를 선택할수록 추천이 정확해져요.</p></div>` : (!ready.length&&!almost.length ? `<div class="empty section"><span class="emoji">🥣</span><h2>선택한 재료로 바로 만들 수 있는 요리가 없어요.</h2><p>재료를 조금 더 선택해 볼까요?</p></div>` : `${ready.length?`<section class="match-group"><h2>지금 만들기 좋아요</h2><div class="recipe-grid">${ready.map(r=>recipeCard(r.recipe)).join('')}</div></section>`:''}${almost.length?`<section class="match-group"><h2>한두 가지만 더 있으면 돼요</h2><div class="recipe-grid">${almost.map(r=>`<div>${recipeCard(r.recipe)}<p class="missing">${r.missing.map(i=>i.name).join(', ')} 필요</p></div>`).join('')}</div></section>`:''}`);
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
      if (!recipe) { app.innerHTML='<div class="empty"><span class="emoji">🍳</span><h1>레시피를 찾지 못했어요.</h1><a class="button" href="#/recipes">요리 목록으로</a></div>'; return; }
      route.name === 'recipe' ? detailView(recipe) : cookView(recipe);
    } else location.hash='#/home';
    app.focus({preventScroll:true});
  }

  $('#surprise-button').addEventListener('click',()=>{recommendation=shuffle(recipes)[0];location.hash=`#/recipe/${recommendation.id}`;});
  document.addEventListener('todaycook:speech', event => syncSpeechControls(event.detail || {}));
  window.addEventListener('hashchange',()=>render().catch(showError));
  function showError(error){console.error(error);app.innerHTML='<div class="empty"><span class="emoji">😥</span><h1>요리 정보를 불러오지 못했어요.</h1><p>잠시 후 다시 시도해 주세요.</p><button class="button" onclick="location.reload()">다시 시도</button></div>';}
  render().catch(showError).finally(()=>setTimeout(()=>$('#splash').classList.add('hide'),850));
})();
