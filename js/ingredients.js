(function () {
  const suggested = ['김치','계란','두부','감자','양파','대파','마늘','콩나물','돼지고기','소고기','닭고기','참치','고등어','애호박','버섯','어묵'];
  const normalize = value => value.replace(/다진\s*/g,'').replace(/마른\s*/g,'').trim();
  function match(recipes, selected) {
    const chosen = new Set(selected.map(normalize));
    return recipes.map(recipe => {
      const required = recipe.ingredients.filter(i => !i.optional && !['간장','소금','고춧가루','고추장','된장','국간장','올리고당','참기름','마요네즈','새우젓'].includes(i.name));
      const missing = required.filter(i => ![...chosen].some(item => normalize(i.name).includes(item) || item.includes(normalize(i.name))));
      return { recipe, missing };
    }).sort((a,b) => a.missing.length - b.missing.length || a.recipe.timeMinutes - b.recipe.timeMinutes);
  }
  window.TodayCookIngredients = { suggested, match };
})();
