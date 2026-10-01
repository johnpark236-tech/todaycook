(function () {
  function parse() {
    const raw = location.hash.replace(/^#\/?/, '') || 'home';
    const [name, id] = raw.split('/');
    return { name, id };
  }
  function setActive(name) {
    const root = name === 'recipe' || name === 'cook' ? 'recipes' : name;
    window.TC.$$('.bottom-nav a').forEach(a => {
      const active = a.dataset.route === root;
      a.classList.toggle('active', active);
      active ? a.setAttribute('aria-current','page') : a.removeAttribute('aria-current');
    });
  }
  window.TodayCookRouter = { parse, setActive };
})();
