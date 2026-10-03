(function () {
  const { $, $$, escapeHtml, image, stepImage, meta, toast, shuffle } = window.TC;
  const app = $('#app');
  let recipes = [];
  let recommendation = null;
  let recipeFilter = { query: '', category: '전체', time: 0, difficulty: '' };
  let shoppingFilter = 'all';
  let selectedIngredients = new Set();
  let cookStep = 0;

  const MENU_IMAGE_OVERRIDES = {"kimchi-jjigae":"data:image/webp;base64,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","doenjang-jjigae":"data:image/webp;base64,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","sundubu-jjigae":"data:image/webp;base64,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[... ELLIPSIZATION ...]A7t/oeb0Fgc6cr/lBV1z2A0PRp0FhPEkGAZaQ2wkSx0amSr6d+Q1FN9st2LsKsdh3QYhbpUoMUQCWZjanyNa9FSxNmcDI7lvU3kJHohI6ESvzv/uqvfujQDolALmdPqTd1ADJFZqlfC74jomQgR0SkjXuu+5IK+Da6tOzV4AqnMyOwPhthIUT5ascrXvdfW27zucTPtSPGd4DtYBtuyd9CGH0dcgXKq1OCPfV6WazIUSc4IyOlhB6pmCeF/0H4/CcGVKDXpSA4ZwzfEPmdX2G6elu/iBXxRkLF+WIrq+oOnvpCh2sCS2Od8iCv2Lt+pj8/jhbkuwON8K1TNtwX0cooIX5uRRh6/3huhzaa5/31hre+5QFshanFVufLrr6Y3ybvrc4qiIx6MxL9pPUeBWAOjzUKYmZ5KoFMLNm7mxaezsKZeyyH3Z0tc0idxIoX1RtIhne+0W68OUfSEBl4AfMclUL3ZkCoCFPRp3yBvHae1KT4ina3VJa/32Cm97P21e6+97aKwAIaxDcGU/4KSJN4GhGFMBvEiYwwHLVoNIwDnKb/OUn1EAaA7tot16hCaJcYHBhhlB9XF73S1EWQwnRgmZyZv7kUre5A491TBZY1JDJYfY2mlSJGZSC5UhX/DTj3cMB1vavVsAXHVi5YmzH1o13hiMi+RCsug0V2xSqBua4vVZJ5UAAlBZrNjaXPkvwRHg+duF6oegtYXRq7rnWAnmRSwEd7v1IhbDqzryVTsuBiAaFjZ+j3DgT21bSmdIS7zBlMK/0e9yh04zZHb9xI4ybthK4ddZXoFEjny7KEYWgghIItxNG0bNyu+5cy0tsDcdfkROpU4vErrGlGO+WBgK/EVj+KO6vPqJAne6T7ujvcT2tIfYNjxmw+bzrzkxWmP+/G6j6VnTQea5vDU2rNRuUnpEdjdZrocTc0rfcBdBoqTZd6cvj/WKuJzfGjMbll3dqBLUGeEux2TaZOHwcyygZYuPg0CDocO1g5mnLSCKJ9GSKk/WwHTxKp+LNZQju5/qEqK4oA4EtJS0Pmu8+rXkzKVLS1PB8MFuN0rgq6/UJMzfgwQRbPF5zpMQ6v5jGYYoiGx7rHmAfWFgqNTMXHgwH5rMS58I/C9FO5n4ZiG1aeMOsFmuMJJNnBWtHVrIXNmaBTdeus4Qw/p86cX1fErgejEJ9D7zIjxOQ7zoHPtg/jE3hiS8Bvp+p9AhENDGcspfNulB8+gMogjyVLItZp1Bex/BuUkpPcMbRtAu1x5v2kdwMhm+neWMYZq80X1Ij+9I59kmtx9ugMAF9QFAfhHytMzG2SnvSAXlShJQsTTY9vxVeNu1zoMMxvuZA58wSpaiACwSQ1GrZXIDUIi3yC4KTqhyyztKfhENUIknONb20CkapKHDf6TYQPQJy9CiOJokMtbJQgC/wscwfIIXfgkqH+E6TgFM/IXW3gjg/uqtBAcJsMWAAAAA=","bibimbap":"data:image/webp;base64,UklGRrwOAABXRUJQVlA4ILAOAAAwPwCdASqgAHgAPtlaoU4oJSMiNtrumQAbCWwAwCZl2r6uZw+dKHJcn057hznwXuzwr2Pum8UVwq1LLaf+D4H8A56HaF3/eHOnLaNFf38oWaOOVeot+RMjHZvrjDWjsfuRuhqI9Fy/GQEtCxAIKeHA1wf9YT9NhZ/yNMvajpu85ZkRYelPnj4zar20c+5Wwcets24OirIW9+Ke84zhcFyWO4BIcTD0sGIc8UjOe9sS9stGLs9wpHgGxWXpazSuskpqdTV10GmYjm4BSzhpM7IrEBGJ5vpkxKp54eXSHYm0YOhEutErwfHu7KIrd2hX4i6Dsso0M3t01QOV6LFwEe8EDBCJFXw1bpjBRZf7G4y6UUU3xifjWEprvDWn3thmSWha+lHrryO0DW1PkHkbTU5Yb1WpK3k5xNn7fbhiaKdwZsGVAtTWuLDD0xZOy2Qr0SVKIKvpSacJPGu9mwDKHeeGbBrHzV3K7Ncy4ig7eQMShShFob4GU61NkEMWuSi1OGuTbdFj3jE8Iz1EyHu4bn20LPyi6u3kR/J736TZ2KSeUsa3zVi4ZSfWvDfJleHMUBMJFl0AvsjJY/iCkVzWuXpHC4qRwYslBb0kmgX/4RUXEZk6CwTRM++YP6CxRA/ZQgsUeol7UwNeJX/DT63RVGYxt22B2I4rdoMd89x+mkeWlzTAAP7KHsZjNnkBenVoPQZ1SAJzenZVcydZg2rW3W+smV8KWgBCKZCTogYDg/4pEn85xwAuNTkYwNERdcekY92J/3kc32tDfObi9t0OodlWXH3vYA3ME/Lbc5P4oGAWCH3uWlIrk1NPeSCcp5zNZOHg9Kedj282leTE38BAm7AJiMq56EiJdru91velOfLdI9XMFXyZ0RB0wxpLoCqpCtbx4iDxVJ8Z3dN5HD73Z4/EqlNDGatNqTwcLQJ7lNLIH/TJnOvPXyAXgYkRdkxFnaLlZR5yMh386tfceDapKpEDYOCTUftFNwYyQi10VZMvZ+H5Ib9WNJeKi33kazg5IDpXDoQqtdCMmoijMpQ4L16chjJco7ZSIhZQqFoPyw/67Dov9nMhJZosxnp2uraRmupbJ5c5Ah7nEczNknogi6cR0sz3r62XytnYOs28ZB3p1KX34HG3VwKZVG82ioPd1Ks7ZTMG+/XnPvr4p+2twig1QssVk6TYkI/kGDHOD873S0ylBUv6d3sLO/UTaqAzWbhGMW2sy+hVpnnvPtw+ox2ymc3leOKyHilFa/67JDPTpu92DPIFUVRssvFgF3z3yKmZIozskwwK5M6lg13LraEBo3hHoWpKVMSCXQvEAA6EsLJS3pPBvyv6XXb1FoLSktu5VWjiHnu/v29t5x5svq6rs6ZLl7R26WbndTl/TNTC8xKVnFg7YgHXziAfDZD5Sp134BfcZirHxOMxgxcAHFGGEd/qe5m7ifC4WEqfsu/vNBdtk4+eGTau7Uij09Uuw77DwAqi4Xc9JSSLRYawDiecZVwCx32R80H1OmhFi6cJ/YkD8vADmV3drAuH9w+vENokcBxo482NcyMQGNj+SYmipbJ0cdJ3aEl+9HCYtyPHg2kR1LVH3GeqVbXbVb5ZQl9dEpqeoPdBZ5lG8ESarDYOB3yq6COeNE4oesgB0jtS3rRL7bFyzT4WnqL/Z5VkH4x4yNoHQaWNlYBAdwHOwVE1BeO/2UGtW8396IsjOg8wiR8Mk8EEq6aOibw3kPxwGZ8dvRM1IHdSF0i0fPnQgnMLXEs4A0Zc3bHw44t1k+aniDPly8HCZtaIoG0JeUlADyuLrBpnwju5kmfXR75MZUpEE49YJ0WinD2AugBNwROSZK1SM4n2xzG/WZ2cmUuCanr43khDtBhPUDZhWiJLc42GUU/B5KPq++dYsYFG/i26HDdS88/MDYy6j4WdYZJCuh3nNoowsF48l8A4M/4wIO+fe3HXZp6r4/vJzyiVcZwUM73nnRqUgN6HH6ZW18HhIrtBnjF5+xgQgQLAJ+bdZ8aEHN+7BeQtrceCIcM+VZLZOHfavyzgN/wqXSWMk6kFKCFwLhaZ9XapjP/Fp1HQ0WfYyuG62i9pTqHcPbaepiNcsZoGbXfFlKIWnuKvBWCVuB5hNr6D0Mj08ChL/MwuDPs5jA8pVDy7Sr/l+DbmhcTgRGPGCifnTY/lCYYrkVI9pJ+OTN+GnppbRTCkxbZgCE2ymsDsn4WB0FNChCO7XTNxdYyPjWuZlmQUbZ0XMr9wKnxL+6y2vne+VEcFH2suiLIxO+FYX4lz6gUDLaskQt6kUiUL2Pua+nUFHqlCETs/Dt4Lj/DyNtSMwfVjZQOLWrMTcDRfMLAmtcqP58VF6093cGxwhuSliYMyvmeouabSE8jCfwoAGUpaWQTrU7H4JjTP/ODpVxHzAVWATx0DUj2PK+G5pzYPQ2dLX8NOlDzz+U9biE9CC8UhETMeb3OBEz1d8ge1UkF4mogpiucgTVBbsSG5tHvC1wVLKUEz2IMFWL1L8l5NVmQsfxQq1QsBHAC+c761TYGnxgiu14xvWn0qYwOiLh+4bYnUQUjziw3I/WvmF1x6Q8vn/f31pQhJsoopT5CPf+bsP44IxPJCH7mZKnUWLBHeckDHzYsIbfe9kW9EVlXtERlbLkMWCRont2JYaHe4c97d7IKEAxdR9vROtx9aplVpf5iYeHsL/07Y3Dt6cguN5wGGX3fdCW7n4z89gUBDIz7ABn1KlbvlGvnwX7d3d9zrf8+mTg34jzMuIP0U5nVsG1SMzb5FsmHsQvdbwP0qonuBHswreT9G1ESKoQWCKTXbVSA1xY6jYzkvWyo3fSwq/XK02+zfIlp984r0WJkISf0Usc3iTdrt1fjW0RDs9j09P6MCN1bxEybsnVukeGO9orNOXB0Qq0B4/MJTf6DnD5vKwkx6E1Vw5K3JTS/8zbkq6Z6aNcCdZxUeJVMCe27HSZD0hmY1nItVDi4vqofygVAePe9yKtLsCY21fFzXuyt72r2PPeHy/lhAuLPGfd336smeSe0TJbGzkjGX604jdLrmmGphNyKqzMDk1S1C8TBJfrvUrMmGLdIZXsADg6DYud0IZDHOYKSRi1p7TqQxwuNinhvRKhhQn272hW5DlM6bM5h5Emf/A0SOAkwK4SdtN2hm/kmie/CmnktJPuhU7wImVgg/A9Vq4iOQKwEQhvJ6044kc2RGIHdd9MBFC2yX0S4WCxyimh1hjNiwrZqQP5VTd7xZFbtO10vDZSXX/LpCfuUh4a7q0urVNadhyDIKXOQ5TT4lE4WvHfN2yL5HojKEIG1d2F2pfW7hPQTVjmt+jQcGI3yPhvMJHaPAJBFt1SzLxnNFhjSsUZAWDX7rOzfP843c7CWp0+nQRfCXU0NopgUi8gy78GW47iFCt9GRCWEwe2N6Fyf/P6PqvRwcmqvK8hh6sPc5ghfv4SbqORh1S3Q+ELHgMBXZQ3/XMrUDYhUoMi6C4nckdNgpLLzVWnIbalGDDqkyOMomMghyPLYt7K3xB4z3OhOKCFIZDW0XsorXatJOQHZtlQSrpkZtI7OT8xLoQv571mwbgoCsOZUJdvEKuMcN5Y3AsQMQHKwbWszzIM1dZbY+Y2B2h4dOoRgQrWs0EwBrQLJRM5UPE5ob6Uv7JI7ZRPWY/UzCeJyOxDILpCO5xXFERlU9OkOmMZ5J3szy4QxhsS94Vz8u81o9Rhl2JvEPNPvjMgtfg/iIMMIU6IbR3093Oo0zb1KtRt/4KSmAn5RpNwy0uJ68xm21rszdy2/F4tcLC6WWdjp5Jrb4BVVLR3nj8Gfw7kjsJ7XThQY1xU2fWxX3+NO0uKYq6FVBvPKagBSt735Eua8BATgkycU0Z9T5cu7KryJjmrlI++2PvqYt9hXwdagEh/FSRy6uNt9mEEOLb7YGhCr2/fHWtjCaeTZVPz1lB6X5IF3jOc8kWz4f76s7xL8flU3vP5AWPeEv8WEQBuuUfm+afWzky+rXOJrUFS5QMhmrqzW4NoIV0XEysRF/UNxhofaGXa9MDoXX6fArZtEE9cKiYE1Qqtce4xGDyAu5MJIYfGFdfZWC2/Qnvu7oAGFUiS84CbalaEAUdpcWmQT9/MDBAgCiq4BaTMC/L+MtmAMuI6CbuCgWJN3N0m8tGzXJpGIQ7O6NvaXGiz76JR1ljMiqB9rVyPQQNNQnNHup9oOyzmgXJX1fS9vFkRtn0YM3nlthzWy104nEe7WYjjaHRPqtEQ60orr1IlXuLS9f42LwBpU/IHKGXttPy1rxpQdHP253K8xXH0IU8zpHekFXLyZPXk2Uz4MRYw/6i/CHo1b/jUEM4WvUOZ27vWJjc99FntZGmnpB6Y9emnOWWFbk9ARkgOCEPnYjn35nbwyeHnC0jDvR7nxel0Ax/mqqkJPWyOToli45y0hwRUwc0B2UqYONE2fOiEzW/kFbGyeGKbORjKDCvTk0QkRtSCyUqUuidOFn+x1D8cL597SHPi2bUqgL99ag28O2AUSfmxYL/tonL1kjCqfuSoum82jCSKbUhuNH0GHM1wYGJQbEerDpLcm0E7NBc+7+PDpdoCTqmW2JNvUWxF3cY9X0+bM66Rs4S0akxds3I3RbgslFFk8ytnwiqz7WzF+yfQIoaSYWsTYNiwc8N8ksY5ieYFTdOVDUfHqstspG7eOvDqEALlxbGIsLtFQekeHhLj79/YKdwzObMT+G60ist4ABPmSumTP96tsdHbm7zTvmuMQByiZiobZ4bTLwfgmPpACVQk4fQbimfGU2slrYEoChEVczKdFeZjCskUhfb0KDb1RwofRn3igBzWon6OGXvPEet07RJuRLaoIg9vAZssl2jihrBj5IVQ9nu73H9Qir9JENfRdcs5QI8WEH4499ZgwU/26zE5ypd8eheIC4n05BN1tvArOhLZVDcjV+mxAGYCkZqJnKsDDKp+0/vleWwiT9UuounO458g1q6XIWkgEWwG9zfztFAJjh3Fg48FD3sOjasS3kk2l6TABfDXnkaC8rwAAA","gyeran-mari":"data:image/webp;base64,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"};
  const cardImage = recipe => image({...recipe, image: MENU_IMAGE_OVERRIDES[recipe.id] || recipe.image});

  const recipeCard = recipe => `<a class="recipe-card" href="#/recipe/${recipe.id}"><div class="recipe-thumb">${cardImage(recipe)}</div><div class="card-body"><h3>${escapeHtml(recipe.name)}</h3><div class="card-meta"><span>⏱ ${recipe.timeMinutes}분</span><span>${escapeHtml(recipe.difficulty)}</span></div></div></a>`;

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
    app.innerHTML = `<a class="back-link" href="#/recipes">← 요리 목록</a><div class="detail-image">${image(recipe)}</div><section class="detail-header"><h1>${escapeHtml(recipe.name)}</h1><p class="muted">${escapeHtml(recipe.description)}</p>${meta(recipe)}<div class="actions detail-actions"><button class="button secondary" id="speak-full">🔁 전체 10회 듣기</button><button class="button secondary" id="add-shopping">🛒 장보기 추가</button><a class="button green" href="#/cook/${recipe.id}">▶ 요리 시작</a></div></section>
      <section class="section"><h2>재료</h2><ul class="ingredient-list">${recipe.ingredients.map((item,i)=>`<li class="check-row"><input type="checkbox" id="ingredient-${i}"><label for="ingredient-${i}">${escapeHtml(item.name)}${item.optional?' <small>(선택)</small>':''}</label><span class="amount">${escapeHtml(item.amount)}</span></li>`).join('')}</ul></section>
      <section class="section"><h2>조리순서 · 음성 대사</h2><ol class="step-list">${recipe.steps.map((step,index)=>`<li class="step-card"><span class="step-num">${step.order}</span><div><p class="step-script">${escapeHtml(window.TodayCookSpeech.stepText(step,index))}</p></div></li>`).join('')}</ol></section>`;
    $('#speak-full').addEventListener('click', () => {
      window.TodayCookSpeech.cancel();
      window.TodayCookSpeech.setRepeat(true, 10, null, 'full');
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
    const repeatKind = detail.repeatKind || 'step';
    const repeatCurrent = Number(detail.repeatCurrent ?? window.TodayCookSpeech.repeatCurrent ?? 0);
    const repeatTarget = Number(detail.repeatTarget ?? window.TodayCookSpeech.repeatTarget ?? 10);

    onceButton.textContent = state === 'loading' && !repeating ? '⏳ 준비 중...' : '🔊 1회 듣기';

    if (repeatButton) {
      const stepRepeating = repeating && repeatKind === 'step';
      const displayCount = Math.min(repeatTarget, repeatCurrent + (state === 'playing' ? 1 : 0));
      repeatButton.textContent = stepRepeating
        ? `■ ${Math.max(1, displayCount)}/${repeatTarget} 반복 중지`
        : '🔁 10회 반복 듣기';
      repeatButton.classList.toggle('active', stepRepeating);
      repeatButton.setAttribute('aria-pressed', stepRepeating ? 'true' : 'false');
    }

    if (pauseButton) {
      pauseButton.disabled = !(state === 'playing' || state === 'paused');
      pauseButton.textContent = state === 'paused' ? '▶ 계속 듣기' : '⏸ 일시정지';
    }
    if (replayButton) replayButton.disabled = detail.hasReplay === false;
  }

  function syncSpeechHighlight(detail = {}) {
    const activeIndex = Number.isInteger(detail.segmentIndex) ? detail.segmentIndex : -1;
    $$('.script-line').forEach(node => {
      const isActive = Number(node.dataset.stepIndex) === activeIndex;
      node.classList.toggle('speaking', isActive);
      if (isActive) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function cookView(recipe) {
    const step = recipe.steps[cookStep];
    const stepScript = window.TodayCookSpeech.stepText(step, cookStep);
    app.innerHTML = `<section class="cook-screen"><a class="back-link" href="#/recipe/${recipe.id}">← ${escapeHtml(recipe.name)}</a><h1 class="cook-title">${escapeHtml(recipe.name)}</h1><p class="progress-label">${cookStep+1} / ${recipe.steps.length} 단계</p><div class="progress" aria-label="조리 진행률"><span style="width:${((cookStep+1)/recipe.steps.length)*100}%"></span></div><figure class="cook-step-media">${stepImage(recipe, step)}<figcaption>${escapeHtml(step.text)}</figcaption></figure><article class="cook-card"><p class="speech-caption-label">음성 대사</p><h1 class="speech-caption" id="speech-caption">${escapeHtml(stepScript)}</h1><ol class="script-list">${recipe.steps.map((item,index)=>`<li class="script-line ${index===cookStep?'current':''}" data-step-index="${index}"><span>${index+1}</span><p>${escapeHtml(window.TodayCookSpeech.stepText(item,index))}</p></li>`).join('')}</ol></article><div class="voice-panel"><div class="voice-mode-row"><button class="voice-primary" id="speak-step" type="button">🔊 현재 단계</button><button class="voice-repeat" id="repeat-speech" type="button" aria-pressed="false">🔁 10회 반복</button></div><div class="voice-secondary"><button id="pause-speech" type="button" disabled>⏸ 일시정지</button><button id="replay-speech" type="button">↻ 다시 듣기</button><button id="speak-recipe" type="button">🔊 전체 읽기</button></div></div><div class="cook-controls"><button id="prev" ${cookStep===0?'disabled':''}>← 이전</button><button id="next">${cookStep===recipe.steps.length-1?'완료':'다음 →'}</button></div></section>`;

    const setCaption = text => {
      const node = $('#speech-caption');
      if (node) node.textContent = text;
    };

    const playCurrentStep = () => {
      setCaption(window.TodayCookSpeech.stepText(step, cookStep));
      return window.TodayCookSpeech.speakStep(recipe, cookStep);
    };

    const advanceAfterRepeat = () => {
      if (cookStep < recipe.steps.length - 1) {
        cookStep += 1;
        cookView(recipe);
        setTimeout(() => {
          window.TodayCookSpeech.setRepeat(true, 10, advanceAfterRepeat, 'step');
          window.TodayCookSpeech.speakStep(recipe, cookStep);
        }, 250);
      } else {
        toast('맛있는 요리가 완성됐어, 형아!');
        location.hash = `#/recipe/${recipe.id}`;
      }
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
      else { toast('맛있는 요리가 완성됐어, 형아!'); location.hash = `#/recipe/${recipe.id}`; }
    });

    $('#speak-step').addEventListener('click', () => {
      window.TodayCookSpeech.setRepeat(false);
      window.TodayCookSpeech.cancel();
      window.TodayCookSpeech.speakSegments([{ text: window.TodayCookSpeech.stepText(step, cookStep), index: cookStep }]);
    });

    $('#repeat-speech').addEventListener('click', () => {
      if (window.TodayCookSpeech.repeating) {
        window.TodayCookSpeech.setRepeat(false);
        window.TodayCookSpeech.cancel();
        setCaption(stepScript);
        return;
      }
      window.TodayCookSpeech.cancel();
      window.TodayCookSpeech.setRepeat(true, 10, advanceAfterRepeat, 'step');
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
      window.TodayCookSpeech.cancel();
      window.TodayCookSpeech.setRepeat(false);
      setCaption(window.TodayCookSpeech.recipeText(recipe));
      window.TodayCookSpeech.speakSegments(recipe.steps.map((item,index)=>({ text: window.TodayCookSpeech.stepText(item, index), index })));
    });

    syncSpeechControls({
      state: window.TodayCookSpeech.state,
      hasReplay: false,
      repeating: window.TodayCookSpeech.repeating,
      repeatKind: 'step',
      repeatCurrent: 0,
      repeatTarget: 10
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
  document.addEventListener('todaycook:speech', event => {
    syncSpeechControls(event.detail || {});
    syncSpeechHighlight(event.detail || {});
  });
  window.addEventListener('hashchange',()=>render().catch(showError));
  function showError(error){console.error(error);app.innerHTML='<div class="empty"><span class="emoji">😥</span><h1>요리 정보를 불러오지 못했어요.</h1><p>잠시 후 다시 시도해 주세요.</p><button class="button" onclick="location.reload()">다시 시도</button></div>';}
  render().catch(showError).finally(()=>setTimeout(()=>$('#splash').classList.add('hide'),850));
})();
