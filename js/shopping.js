(function () {
  const KEY = 'todaycook.shopping.v1';
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
  function write(items) { localStorage.setItem(KEY, JSON.stringify(items)); document.dispatchEvent(new CustomEvent('todaycook:shopping')); return items; }
  function addRecipe(recipe) {
    const items = read();
    let added = 0;
    recipe.ingredients.filter(i => !i.optional).forEach(ingredient => {
      const key = `${recipe.id}:${ingredient.id}`;
      if (!items.some(item => item.key === key)) {
        items.push({ key, recipeId: recipe.id, recipeName: recipe.name, id: ingredient.id, name: ingredient.name, amount: ingredient.amount, checked: false });
        added++;
      }
    });
    write(items);
    return added;
  }
  function toggle(key) { return write(read().map(item => item.key === key ? {...item, checked: !item.checked} : item)); }
  function remove(key) { return write(read().filter(item => item.key !== key)); }
  function clearCompleted() { return write(read().filter(item => !item.checked)); }
  function clearAll() { return write([]); }
  window.TodayCookShopping = { read, addRecipe, toggle, remove, clearCompleted, clearAll };
})();
