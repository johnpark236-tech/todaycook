(function () {
  const suggested = ['식빵','계란','우유','치즈','떡볶이 떡','고구마','감자','바나나','딸기','요거트','옥수수','라면사리','밀가루','코코아가루','양배추','버터'];
  const normalize = value => value.replace(/다진\s*/g,'').replace(/마른\s*/g,'').trim();
  function match(recipes, selected) {
    const chosen = new Set(selected.map(normalize));
    return recipes.map(recipe => {
      const required = recipe.ingredients.filter(i => !i.optional && !['소금','설탕','고춧가루','고추장','올리고당','식용유','마요네즈','케첩','깨','파슬리','라면수프'].includes(i.name));
      const missing = required.filter(i => ![...chosen].some(item => normalize(i.name).includes(item) || item.includes(normalize(i.name))));
      return { recipe, missing };
    }).sort((a,b) => a.missing.length - b.missing.length || a.recipe.timeMinutes - b.recipe.timeMinutes);
  }
  window.TodayCookIngredients = { suggested, match };
})();
