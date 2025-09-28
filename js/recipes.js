(() => {
  const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
  const EDAMAM_API = 'https://api.edamam.com/api/nutrition-data';
  const EDAMAM_ID = ''; // optional
  const EDAMAM_KEY = ''; // optional

  // --- DOM ---
  const recipeList = document.getElementById('recipeList');
  const resultCount = document.getElementById('resultCount');
  const searchDesktop = document.getElementById('searchInputDesktop');
  const searchMobile = document.getElementById('searchInput');
  const randomBtn = document.getElementById('randomBtn');
  const favoritesToggle = document.getElementById('favoritesToggle');
  const favoritesBtn = document.getElementById('favoritesBtn');

  const applyBtn = document.getElementById('applyFilters');
  const resetBtn = document.getElementById('clearFilters');
  const filterCategory = document.getElementById('filterCategory');
  const filterArea = document.getElementById('filterArea');
  const dietSelect = document.getElementById('dietSelect');
  const caloriesRange = document.getElementById('caloriesRange');
  const calLabel = document.getElementById('calLabel');
  const cuisineInput = document.getElementById('searchInput');

  const recipeModal = document.getElementById('recipeModal');
  const modalClose = document.getElementById('modalClose');
  const modalBody = document.getElementById('modalBody');
  const statusMsg = document.getElementById('statusMsg');

  // --- State ---
  let lastRecipes = [];
  let showingFavoritesOnly = false;

  const FAV_KEY = 'rf_favorites';
  const PLANNER_KEY = 'rf_planner';

  // --- Storage helpers ---
  const getFavorites = () => JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  const setFavorites = list => localStorage.setItem(FAV_KEY, JSON.stringify(list));
  const isFavorite = id => getFavorites().some(f => f.idMeal === id);

  function toggleFavorite(meal) {
    const favs = getFavorites();
    const index = favs.findIndex(f => f.idMeal === meal.idMeal);
    if (index >= 0) {
      favs.splice(index, 1);
      statusMsg && (statusMsg.textContent = `${meal.strMeal} removed from favorites`);
    } else {
      favs.unshift(meal);
      statusMsg && (statusMsg.textContent = `${meal.strMeal} added to favorites`);
    }
    setFavorites(favs);
    renderRecipes(lastRecipes);
  }

  function addToPlanner(meal, day = 'monday') {
    try {
      const planner = JSON.parse(localStorage.getItem(PLANNER_KEY) || '{}');
      planner[day] = planner[day] || [];
      planner[day].push({ id: meal.idMeal, name: meal.strMeal });
      localStorage.setItem(PLANNER_KEY, JSON.stringify(planner));
      alert(`Added "${meal.strMeal}" to ${day}`);
    } catch (err) {
      console.error('Planner add failed', err);
    }
  }

  // --- Utils ---
  const debounce = (fn, wait = 300) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };
  const escapeHtml = str => String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // --- Fetch helpers ---
  const fetchMeals = async url => {
    try {
      const res = await fetch(url);
      const json = await res.json();
      return json.meals || [];
    } catch {
      return [];
    }
  };
  const fetchMealsBySearch = q => fetchMeals(`${MEALDB_BASE}/search.php?s=${encodeURIComponent(q)}`);
  const fetchRandomMeal = () => fetchMeals(`${MEALDB_BASE}/random.php`);
  const fetchMealById = id => fetchMeals(`${MEALDB_BASE}/lookup.php?i=${id}`);
  const fetchNutritionForIngredient = async ingr => {
    if (!EDAMAM_ID || !EDAMAM_KEY) return null;
    try {
      const res = await fetch(`${EDAMAM_API}?app_id=${EDAMAM_ID}&app_key=${EDAMAM_KEY}&ingr=${encodeURIComponent(ingr)}`);
      return await res.json();
    } catch { return null; }
  };

  async function fetchCategories() {
    if (!filterCategory) return;
    const data = await fetchMeals(`${MEALDB_BASE}/list.php?c=list`);
    data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.strCategory;
      opt.textContent = c.strCategory;
      filterCategory.appendChild(opt);
    });
  }

  async function fetchAreas() {
    if (!filterArea) return;
    const data = await fetchMeals(`${MEALDB_BASE}/list.php?a=list`);
    data.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.strArea;
      opt.textContent = a.strArea;
      filterArea.appendChild(opt);
    });
  }

  // --- Render ---
  async function renderRecipes(recipes = []) {
    lastRecipes = recipes;
    recipeList.innerHTML = '';
    if (!recipes.length) {
      recipeList.innerHTML = `<p class="empty">No recipes found.</p>`;
      resultCount && (resultCount.textContent = '0');
      return;
    }

    const toShow = showingFavoritesOnly ? getFavorites() : recipes;
    resultCount && (resultCount.textContent = toShow.length);

    // Preload calories in parallel and attach to each meal
    const mealsWithCalories = await Promise.all(
      toShow.map(async meal => {
        let calories = null;
        if (meal.strIngredient1 && EDAMAM_ID && EDAMAM_KEY) {
          const nutrit = await fetchNutritionForIngredient(`${meal.strIngredient1} 100g`);
          calories = nutrit?.calories ? Math.round(nutrit.calories) : null;
        }
        return { ...meal, calories };
      })
    );

    const cards = await Promise.all(
      mealsWithCalories.map(async meal => {
        const isFav = isFavorite(meal.idMeal);
        const calorieLabel = meal.calories ? `${meal.calories} cal` : '—';

        const card = document.createElement('article');
        card.className = 'recipe-card';
        card.innerHTML = `
          <div class="card-image">
            <img src="${meal.strMealThumb}" alt="${escapeHtml(meal.strMeal)}">
            <div class="overlay">
              <a href="${meal.strSource || '#'}" target="_blank" rel="noopener" class="btn small">View Recipe</a>
            </div>
          </div>
          <div class="card-body">
            <h4 class="recipe-title">${escapeHtml(meal.strMeal)}</h4>
            <div class="recipe-meta">
              <span class="badge"><i data-lucide="flame"></i> ${calorieLabel}</span>
              <span class="badge"><i data-lucide="globe"></i> ${escapeHtml(meal.strArea || 'Unknown')}</span>
            </div>
            <div class="recipe-actions">
              <button class="btn outline save-btn">${isFav ? 'Unsave' : 'Save'}</button>
              <button class="btn planner-btn">Add to Planner</button>
              <button class="btn small detail-btn">View</button>
            </div>
          </div>
        `;

        card.querySelector('.save-btn')?.addEventListener('click', () => toggleFavorite(meal));
        card.querySelector('.planner-btn')?.addEventListener('click', () => {
          const day = prompt('Add to which day? (monday, tuesday, etc.)', 'monday');
          if (day) addToPlanner(meal, day.toLowerCase());
        });
        card.querySelector('.detail-btn')?.addEventListener('click', () => openModal(meal.idMeal));
        return card;
      })
    );

    cards.forEach(card => recipeList.appendChild(card));
    window.lucide?.createIcons();
  }

  // --- Modal ---
  async function openModal(id) {
    const meals = await fetchMealById(id);
    const meal = meals[0];
    if (!meal) return;

    let ingredients = '';
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ing?.trim()) ingredients += `<li>${ing} - ${measure}</li>`;
    }

    const favText = isFavorite(meal.idMeal) ? '❤️ Unsave' : '🤍 Save';
    modalBody.innerHTML = `
      <h2>${meal.strMeal}</h2>
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="modal-img" />
      <h3>Ingredients</h3><ul>${ingredients}</ul>
      <h3>Instructions</h3><p>${meal.strInstructions}</p>
      <button class="btn fav-modal-btn">${favText}</button>
    `;
    modalBody.querySelector('.fav-modal-btn')?.addEventListener('click', () => {
      toggleFavorite(meal);
      openModal(meal.idMeal);
    });
    recipeModal.classList.remove('hidden');
  }
  modalClose?.addEventListener('click', () => recipeModal.classList.add('hidden'));

  // --- Filters ---
  const applyFilters = async () => {
    const maxCal = Number(caloriesRange?.value || 1200);
    const diet = dietSelect?.value?.toLowerCase().trim();
    const area = filterArea?.value?.toLowerCase().trim();
    const cat = filterCategory?.value?.toLowerCase().trim();

    let filtered = lastRecipes.filter(meal => {
      let ok = true;
      if (diet) ok = ok && ((meal.strTags || '').toLowerCase().includes(diet) || (meal.strMeal || '').toLowerCase().includes(diet));
      if (area) ok = ok && (meal.strArea || '').toLowerCase() === area;
      if (cat) ok = ok && (meal.strCategory || '').toLowerCase() === cat;
      if (meal.calories != null) ok = ok && meal.calories <= maxCal;
      return ok;
    });

    await renderRecipes(filtered);
  };

  applyBtn?.addEventListener('click', applyFilters);
  resetBtn?.addEventListener('click', async () => {
    dietSelect.value = '';
    filterArea.value = '';
    filterCategory.value = '';
    caloriesRange.value = 800;
    calLabel.textContent = 800;
    await fetchAndShowDefault();
  });

  filterArea?.addEventListener('change', applyFilters);
  filterCategory?.addEventListener('change', applyFilters);
  caloriesRange?.addEventListener('input', e => calLabel && (calLabel.textContent = e.target.value));

  // --- Search ---
  const debouncedSearch = debounce(q => searchAndRender(q), 400);
  searchDesktop?.addEventListener('input', e => e.target.value.length > 1 && debouncedSearch(e.target.value.trim()));
  searchMobile?.addEventListener('input', e => e.target.value.length > 1 && debouncedSearch(e.target.value.trim()));

  async function searchAndRender(q) {
    const meals = await fetchMealsBySearch(q);
    await renderRecipes(meals);
  }

  // --- Favorites ---
  favoritesToggle?.addEventListener('click', async () => {
    showingFavoritesOnly = !showingFavoritesOnly;
    favoritesToggle.classList.toggle('active', showingFavoritesOnly);
    showingFavoritesOnly ? await renderRecipes(getFavorites()) : await fetchAndShowDefault();
  });
  favoritesBtn?.addEventListener('click', () => renderRecipes(getFavorites()));

  // --- Random ---
  randomBtn?.addEventListener('click', async () => {
    const meals = await fetchRandomMeal();
    await renderRecipes(meals);
  });

  // --- Default ---
  async function fetchAndShowDefault() {
    let meals = await fetchMealsBySearch('jollof');
    if (!meals.length) meals = await fetchMealsBySearch('chicken');
    await renderRecipes(meals);
  }

  // --- Init ---
  fetchCategories();
  fetchAreas();
  fetchAndShowDefault();
})();

async function renderRecipes(recipes) {
  recipeList.innerHTML = "";
  if (!recipes || recipes.length === 0) {
    recipeList.innerHTML = "<p>No recipes found.</p>";
    return;
  }

  for (const r of recipes) {
    // Collect ingredients
    let ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = r[`strIngredient${i}`];
      const measure = r[`strMeasure${i}`];
      if (ing && ing.trim()) ingredients.push(`${measure} ${ing}`);
    }
    const shortIngredients = ingredients.slice(0, 4).join(", ");

    // Nutrition lookup (first ingredient demo)
    let nutrition = {
      calories: 400 + Math.floor(Math.random() * 400),
      protein: 15,
      carbs: 50,
      fat: 20,
      fiber: 5,
      sugar: 10
    };
    if (EDAMAM_ID && EDAMAM_KEY && r.strIngredient1) {
      try {
        const res = await fetch(`${EDAMAM_API}?app_id=${EDAMAM_ID}&app_key=${EDAMAM_KEY}&ingr=${encodeURIComponent(r.strIngredient1 + " 100g")}`);
        const data = await res.json();
        nutrition = {
          calories: Math.round(data.calories || nutrition.calories),
          protein: Math.round(data.totalNutrients?.PROCNT?.quantity || 0),
          carbs: Math.round(data.totalNutrients?.CHOCDF?.quantity || 0),
          fat: Math.round(data.totalNutrients?.FAT?.quantity || 0),
          fiber: Math.round(data.totalNutrients?.FIBTG?.quantity || 0),
          sugar: Math.round(data.totalNutrients?.SUGAR?.quantity || 0)
        };
      } catch (err) {
        console.warn("Nutrition fetch failed", err);
      }
    }

    // Ratings (demo)
    const rating = (3.5 + Math.random() * 1.5).toFixed(1);
    const stars = "⭐".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));

    // Card HTML
    const card = document.createElement("article");
    card.className = "recipe-card";
    card.innerHTML = `
      <div class="card-image">
        <img src="${r.strMealThumb}" alt="${r.strMeal}">
      </div>
      <div class="card-body">
        <h4>${r.strMeal}</h4>
        <p class="meta">${r.strArea} • ${r.strCategory}</p>

        <p class="ingredients"><strong>Ingredients:</strong> ${shortIngredients}...</p>

        <div class="nutrition">
          <span>🔥 ${nutrition.calories} cal</span> |
          <span>🥩 ${nutrition.protein}g protein</span> |
          <span>🍞 ${nutrition.carbs}g carbs</span> |
          <span>🧈 ${nutrition.fat}g fat</span>
        </div>

        <div class="rating">
          <span>${stars}</span> <small>(${rating})</small>
        </div>

        <div class="card-actions">
          <button class="btn small detail-btn" data-id="${r.idMeal}">View Details</button>
        </div>
      </div>
    `;
    recipeList.appendChild(card);
  }

  // Detail modal
  document.querySelectorAll(".detail-btn").forEach(btn =>
    btn.addEventListener("click", () => openModal(btn.dataset.id))
  );
}

async function openModal(id) {
  const res = await fetch(`${MEALDB_API}lookup.php?i=${id}`);
  const data = await res.json();
  const meal = data.meals[0];

  // Build ingredient list
  let ingredientsList = "";
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      ingredientsList += `<li>${measure} ${ing}</li>`;
    }
  }

  // Nutrition again (fallback simulated)
  let nutrition = {
    calories: 500,
    protein: 20,
    carbs: 60,
    fat: 18,
    fiber: 6,
    sugar: 12
  };
  if (EDAMAM_ID && EDAMAM_KEY && meal.strIngredient1) {
    try {
      const resNut = await fetch(`${EDAMAM_API}?app_id=${EDAMAM_ID}&app_key=${EDAMAM_KEY}&ingr=${encodeURIComponent(meal.strIngredient1 + " 100g")}`);
      const dataNut = await resNut.json();
      nutrition = {
        calories: Math.round(dataNut.calories || nutrition.calories),
        protein: Math.round(dataNut.totalNutrients?.PROCNT?.quantity || 0),
        carbs: Math.round(dataNut.totalNutrients?.CHOCDF?.quantity || 0),
        fat: Math.round(dataNut.totalNutrients?.FAT?.quantity || 0),
        fiber: Math.round(dataNut.totalNutrients?.FIBTG?.quantity || 0),
        sugar: Math.round(dataNut.totalNutrients?.SUGAR?.quantity || 0)
      };
    } catch {}
  }

  modalBody.innerHTML = `
    <h2>${meal.strMeal}</h2>
    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="modal-img" />
    <h3>Ingredients</h3>
    <ul>${ingredientsList}</ul>

    <h3>Nutrition Facts</h3>
    <ul class="nutrition-list">
      <li>Calories: ${nutrition.calories}</li>
      <li>Protein: ${nutrition.protein} g</li>
      <li>Carbs: ${nutrition.carbs} g</li>
      <li>Fat: ${nutrition.fat} g</li>
      <li>Fiber: ${nutrition.fiber} g</li>
      <li>Sugar: ${nutrition.sugar} g</li>
    </ul>

    <h3>Instructions</h3>
    <p>${meal.strInstructions}</p>
  `;

  recipeModal.classList.remove("hidden");
}
