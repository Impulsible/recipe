// recipes.js - dummy dataset, search, filters, ratings (localStorage)
document.addEventListener('DOMContentLoaded', () => {
  const recipeList = document.getElementById('recipeList');
  const resultCount = document.getElementById('resultCount');
  const searchInput = document.getElementById('searchInput') || document.getElementById('searchInputDesktop');
  const searchInputDesktop = document.getElementById('searchInputDesktop');
  const dietSelect = document.getElementById('dietSelect');
  const caloriesRange = document.getElementById('caloriesRange');
  const calLabel = document.getElementById('calLabel');
  const cuisineInput = document.getElementById('cuisineInput');
  const randomBtn = document.getElementById('randomBtn');

  // Dummy recipe array (replace with API fetch in future)
  const recipes = [
    { id: 'r1', title: 'Grilled Chicken Salad', time: '30 min', calories: 350, image: 'images/placeholder.webp', diet: 'any', cuisine: 'nigerian' },
    { id: 'r2', title: 'Vegan Jollof Rice', time: '45 min', calories: 520, image: 'images/placeholder.webp', diet: 'vegan', cuisine: 'nigerian' },
    { id: 'r3', title: 'Spicy Prawn Pasta', time: '25 min', calories: 610, image: 'images/placeholder.webp', diet: 'any', cuisine: 'italian' },
    { id: 'r4', title: 'Keto Egg Muffins', time: '20 min', calories: 210, image: 'images/placeholder.webp', diet: 'keto', cuisine: 'american' },
    { id: 'r5', title: 'Plantain & Beans', time: '40 min', calories: 480, image: 'images/placeholder.webp', diet: 'vegetarian', cuisine: 'nigerian' }
  ];

  // Helper: render a recipe card
  function renderCard(r) {
    const card = document.createElement('article');
    card.className = 'recipe-card';
    card.setAttribute('data-id', r.id);
    card.innerHTML = `
      <div class="card-media">
        <img loading="lazy" src="${r.image}" alt="${r.title}" />
      </div>
      <div>
        <h4 class="recipe-title">${r.title}</h4>
        <div class="recipe-meta"><span>⏱ ${r.time}</span><span>🔥 ${r.calories} cal</span></div>
      </div>
      <div class="recipe-actions" style="margin-top:6px;">
        <div class="stars" role="radiogroup" aria-label="Rating for ${r.title}"></div>
        <div style="display:flex;gap:8px">
          <button class="btn view-btn" data-id="${r.id}">View Nutrition</button>
          <button class="btn ghost save-btn" data-id="${r.id}">Save</button>
        </div>
      </div>
    `;
    // Stars
    const starContainer = card.querySelector('.stars');
    for (let i=1;i<=5;i++){
      const s = document.createElement('span');
      s.setAttribute('data-value', i);
      s.innerHTML = '★';
      starContainer.appendChild(s);
    }
    attachRatingHandlers(starContainer, r.id);

    // Save button
    const saveBtn = card.querySelector('.save-btn');
    saveBtn.addEventListener('click', () => {
      const key = 'favorites';
      const favorites = JSON.parse(localStorage.getItem(key) || '[]');
      if (!favorites.includes(r.id)) {
        favorites.push(r.id);
        localStorage.setItem(key, JSON.stringify(favorites));
        window.showToast('Saved to favorites');
      } else {
        window.showToast('Already in favorites');
      }
    });

    // View nutrition placeholder
    card.querySelector('.view-btn').addEventListener('click', () => {
      window.showToast(`Nutrition: ${r.calories} kcal (details later)`);
    });

    return card;
  }

  // Attach rating star handlers: saves to localStorage as rating-[id]
  function attachRatingHandlers(container, recipeId){
    const key = `rating-${recipeId}`;
    const saved = parseInt(localStorage.getItem(key) || '0', 10);
    const stars = [...container.children];
    function updateUI(n){
      stars.forEach((s,idx)=> s.classList.toggle('active', idx < n));
    }
    updateUI(saved);

    container.addEventListener('click', (e) => {
      if (e.target.matches('span')) {
        const val = parseInt(e.target.getAttribute('data-value'),10);
        localStorage.setItem(key, String(val));
        updateUI(val);
        window.showToast(`Rated ${val} ★`);
      }
    });
  }

  // Render list (filtered)
  function renderList(list){
    recipeList.innerHTML = '';
    list.forEach(r => recipeList.appendChild(renderCard(r)));
    if (resultCount) resultCount.textContent = list.length;
  }

  // Initial render
  renderList(recipes);

  // Filtering logic
  function applyFilters(){
    const q = (searchInput && searchInput.value) ? searchInput.value.toLowerCase() : '';
    const diet = (dietSelect && dietSelect.value) ? dietSelect.value.toLowerCase() : '';
    const maxCal = caloriesRange ? Number(caloriesRange.value) : Infinity;
    const cuisine = (cuisineInput && cuisineInput.value) ? cuisineInput.value.toLowerCase() : '';

    const filtered = recipes.filter(r => {
      if (diet && diet !== 'any' && r.diet && r.diet.toLowerCase() !== diet) {
        // allow 'any'
        if (diet !== '') return false;
      }
      if (r.calories > maxCal) return false;
      if (q && !(`${r.title} ${r.cuisine}`).toLowerCase().includes(q)) return false;
      if (cuisine && !r.cuisine.toLowerCase().includes(cuisine)) return false;
      return true;
    });
    renderList(filtered);
  }

  // Events
  if (searchInput) searchInput.addEventListener('input', debounce(applyFilters, 300));
  if (searchInputDesktop) searchInputDesktop.addEventListener('input', debounce(applyFilters, 300));
  if (dietSelect) dietSelect.addEventListener('change', applyFilters);
  if (caloriesRange) {
    caloriesRange.addEventListener('input', () => {
      if (calLabel) calLabel.textContent = caloriesRange.value;
      applyFilters();
    });
  }
  if (cuisineInput) cuisineInput.addEventListener('input', debounce(applyFilters, 300));

  if (randomBtn) randomBtn.addEventListener('click', () => {
    const idx = Math.floor(Math.random()*recipes.length);
    const chosen = recipes[idx];
    window.showToast(`Try: ${chosen.title}`);
  });

  // Debounce helper
  function debounce(fn, wait=250){
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(()=> fn(...args), wait);
    };
  }
});
