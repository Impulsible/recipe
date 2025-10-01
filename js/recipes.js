(() => {
  // =========================
  // Constants & DOM
  // =========================
  const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
  const EDAMAM_API = 'https://api.edamam.com/api/nutrition-data';
  const EDAMAM_ID = ''; // optional
  const EDAMAM_KEY = ''; // optional

  const recipeList = document.getElementById('recipeList');
  const resultCount = document.getElementById('resultCount');
  const searchInputs = [document.getElementById('searchInput'), document.getElementById('searchInputDesktop')].filter(Boolean);
  const randomBtn = document.getElementById('randomBtn');
  const favoritesToggle = document.getElementById('favoritesToggle');
  const applyBtn = document.getElementById('applyFilters');
  const resetBtn = document.getElementById('clearFilters');
  const filterCategory = document.getElementById('filterCategory');
  const filterArea = document.getElementById('filterArea');
  const dietSelect = document.getElementById('dietSelect');
  const caloriesRange = document.getElementById('caloriesRange');
  const calLabel = document.getElementById('calLabel');

  const recipeModal = document.getElementById('recipeModal');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');
  const statusMsg = document.getElementById('statusMsg');

  // =========================
  // State
  // =========================
  let lastRecipes = [];
  let showingFavoritesOnly = false;
  const FAV_KEY = 'rf_favorites';
  const PLANNER_KEY = 'rf_planner';

  // =========================
  // Storage helpers
  // =========================
  const getFavorites = () => JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  const setFavorites = list => localStorage.setItem(FAV_KEY, JSON.stringify(list));
  const isFavorite = id => getFavorites().some(f => f.idMeal === id);

  const toggleFavorite = (meal) => {
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
  };

  const addToPlanner = (meal, day = 'monday') => {
    try {
      const planner = JSON.parse(localStorage.getItem(PLANNER_KEY) || '{}');
      planner[day] = planner[day] || [];
      planner[day].push({ id: meal.idMeal, name: meal.strMeal });
      localStorage.setItem(PLANNER_KEY, JSON.stringify(planner));
      alert(`Added "${meal.strMeal}" to ${day}`);
    } catch (err) {
      console.error('Planner add failed', err);
    }
  };

  // =========================
  // Fetch helpers
  // =========================
  const fetchMeals = async (url) => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      return data.meals || [];
    } catch {
      return [];
    }
  };

  const fetchMealsBySearch = (q) => fetchMeals(`${MEALDB_BASE}/search.php?s=${encodeURIComponent(q)}`);
  const fetchRandomMeal = () => fetchMeals(`${MEALDB_BASE}/random.php`);
  const fetchMealById = (id) => fetchMeals(`${MEALDB_BASE}/lookup.php?i=${id}`);

  const fetchNutritionForIngredient = async (ingr) => {
    if (!EDAMAM_ID || !EDAMAM_KEY) return null;
    try {
      const res = await fetch(`${EDAMAM_API}?app_id=${EDAMAM_ID}&app_key=${EDAMAM_KEY}&ingr=${encodeURIComponent(ingr)}`);
      return await res.json();
    } catch { return null; }
  };

  const fetchCategories = async () => {
    if (!filterCategory) return;
    const data = await fetchMeals(`${MEALDB_BASE}/list.php?c=list`);
    data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.strCategory;
      opt.textContent = c.strCategory;
      filterCategory.appendChild(opt);
    });
  };

  const fetchAreas = async () => {
    if (!filterArea) return;
    const data = await fetchMeals(`${MEALDB_BASE}/list.php?a=list`);
    data.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.strArea;
      opt.textContent = a.strArea;
      filterArea.appendChild(opt);
    });
  };

  // =========================
  // Render
  // =========================
  async function renderRecipes(recipes = []) {
    lastRecipes = recipes;
    recipeList.innerHTML = '';

    if (!recipes.length) {
      recipeList.innerHTML = '<p class="empty">No recipes found.</p>';
      resultCount && (resultCount.textContent = '0');
      return;
    }

    const toShow = showingFavoritesOnly ? getFavorites() : recipes;
    resultCount && (resultCount.textContent = toShow.length);

    for (const meal of toShow) {
      // Fetch calories if Edamam keys provided
      let calories = null;
      if (meal.strIngredient1 && EDAMAM_ID && EDAMAM_KEY) {
        const nutrit = await fetchNutritionForIngredient(`${meal.strIngredient1} 100g`);
        calories = nutrit?.calories ? Math.round(nutrit.calories) : null;
      }

      const isFav = isFavorite(meal.idMeal);
      const card = document.createElement('article');
      card.className = 'recipe-card';
      card.innerHTML = `
        <div class="card-image">
          <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        </div>
        <div class="card-body">
          <h4>${meal.strMeal}</h4>
          <p class="meta">${meal.strArea} • ${meal.strCategory}</p>
          <div class="nutrition">🔥 ${calories ?? '—'} cal</div>
          <div class="card-actions">
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

      recipeList.appendChild(card);
    }

    window.lucide?.createIcons();
  }

  // =========================
  // Modal
  // =========================
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

    modalBody.innerHTML = `
      <h2>${meal.strMeal}</h2>
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="modal-img" />
      <h3>Ingredients</h3><ul>${ingredients}</ul>
      <h3>Instructions</h3><p>${meal.strInstructions}</p>
      <button class="btn fav-modal-btn">${isFavorite(meal.idMeal) ? '❤️ Unsave' : '🤍 Save'}</button>
    `;
    modalBody.querySelector('.fav-modal-btn')?.addEventListener('click', () => {
      toggleFavorite(meal);
      openModal(meal.idMeal); // Refresh modal
    });

    recipeModal.classList.remove('hidden');
  }

  modalClose?.addEventListener('click', () => recipeModal.classList.add('hidden'));
  recipeModal?.addEventListener('click', e => {
    if (e.target === recipeModal) recipeModal.classList.add('hidden');
  });

  // =========================
  // Filters
  // =========================
  const applyFilters = async () => {
    const maxCal = Number(caloriesRange?.value || 1200);
    const diet = dietSelect?.value?.toLowerCase().trim();
    const area = filterArea?.value?.toLowerCase().trim();
    const cat = filterCategory?.value?.toLowerCase().trim();

    const filtered = lastRecipes.filter(meal => {
      let ok = true;
      if (diet) ok = ok && ((meal.strTags || '').toLowerCase().includes(diet) || (meal.strMeal || '').toLowerCase().includes(diet));
      if (area) ok = ok && (meal.strArea || '').toLowerCase() === area;
      if (cat) ok = ok && (meal.strCategory || '').toLowerCase() === cat;
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

  // =========================
  // Search
  // =========================
  const debounce = (fn, wait = 300) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  const searchAndRender = async (q) => {
    const meals = await fetchMealsBySearch(q);
    await renderRecipes(meals);
  };

  const debouncedSearch = debounce(q => searchAndRender(q), 400);
  searchInputs.forEach(input => input.addEventListener('input', e => {
    if (e.target.value.length > 1) debouncedSearch(e.target.value.trim());
  }));

  // =========================
  // Favorites toggle
  // =========================
  favoritesToggle?.addEventListener('click', async () => {
    showingFavoritesOnly = !showingFavoritesOnly;
    favoritesToggle.classList.toggle('active', showingFavoritesOnly);
    showingFavoritesOnly ? await renderRecipes(getFavorites()) : await fetchAndShowDefault();
  });

  // =========================
  // Random recipe
  // =========================
  randomBtn?.addEventListener('click', async () => {
    const meals = await fetchRandomMeal();
    await renderRecipes(meals);
  });

  // =========================
  // Default load
  // =========================
  const fetchAndShowDefault = async () => {
    let meals = await fetchMealsBySearch('jollof');
    if (!meals.length) meals = await fetchMealsBySearch('chicken');
    await renderRecipes(meals);
  };

  // =========================
  // Init
  // =========================
  fetchCategories();
  fetchAreas();
  fetchAndShowDefault();

})();


(async () => {
  const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
  const EDAMAM_API = 'https://api.edamam.com/api/nutrition-data';
  const EDAMAM_ID = ''; // put your ID
  const EDAMAM_KEY = ''; // put your key

  const recipeList = document.getElementById('recipeList');
  const resultCount = document.getElementById('resultCount');

  const recipeModal = document.getElementById('recipeModal');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  const getFavorites = () => JSON.parse(localStorage.getItem('rf_favorites') || '[]');
  const setFavorites = (list) => localStorage.setItem('rf_favorites', JSON.stringify(list));
  const isFavorite = (id) => getFavorites().some(f => f.idMeal === id);

  // --- Fetch nutrition for all ingredients ---
  const fetchNutrition = async (ingredients) => {
    if (!EDAMAM_ID || !EDAMAM_KEY) return null;

    let total = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };
    for (let i = 0; i < ingredients.length; i++) {
      try {
        const res = await fetch(`${EDAMAM_API}?app_id=${EDAMAM_ID}&app_key=${EDAMAM_KEY}&ingr=${encodeURIComponent(ingredients[i])}`);
        const data = await res.json();
        total.calories += data.calories || 0;
        total.protein += data.totalNutrients?.PROCNT?.quantity || 0;
        total.carbs += data.totalNutrients?.CHOCDF?.quantity || 0;
        total.fat += data.totalNutrients?.FAT?.quantity || 0;
        total.fiber += data.totalNutrients?.FIBTG?.quantity || 0;
        total.sugar += data.totalNutrients?.SUGAR?.quantity || 0;
      } catch { continue; }
    }
    return {
      calories: Math.round(total.calories),
      protein: Math.round(total.protein),
      carbs: Math.round(total.carbs),
      fat: Math.round(total.fat),
      fiber: Math.round(total.fiber),
      sugar: Math.round(total.sugar)
    };
  };

  const fetchMealsBySearch = async (q) => {
    const res = await fetch(`${MEALDB_BASE}/search.php?s=${encodeURIComponent(q)}`);
    const data = await res.json();
    return data.meals || [];
  };

  const renderRecipes = async (recipes) => {
    recipeList.innerHTML = '';
    if (!recipes.length) {
      recipeList.innerHTML = '<p>No recipes found.</p>';
      resultCount && (resultCount.textContent = '0');
      return;
    }
    resultCount && (resultCount.textContent = recipes.length);

    for (const meal of recipes) {
      const card = document.createElement('article');
      card.className = 'recipe-card';
      card.innerHTML = `
        <div class="card-image">
          <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
          <div class="overlay">Loading nutrition...</div>
        </div>
        <div class="card-body">
          <h4>${meal.strMeal}</h4>
          <p class="meta">${meal.strArea} • ${meal.strCategory}</p>
          <div class="nutrition">Calories: loading...</div>
          <div class="card-actions">
            <button class="btn small detail-btn">View</button>
          </div>
        </div>
      `;
      recipeList.appendChild(card);

      // Collect ingredients
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ing?.trim()) ingredients.push(`${measure} ${ing}`);
      }

      // Fetch nutrition asynchronously
      fetchNutrition(ingredients).then(nutrition => {
        const nutEl = card.querySelector('.nutrition');
        if (nutrition) {
          nutEl.textContent = `🔥 ${nutrition.calories} cal | 🥩 ${nutrition.protein}g protein | 🍞 ${nutrition.carbs}g carbs | 🧈 ${nutrition.fat}g fat`;
        } else {
          nutEl.textContent = 'Nutrition info unavailable';
        }
      });

      // View modal
      card.querySelector('.detail-btn').addEventListener('click', async () => {
        let ingList = '';
        ingredients.forEach(i => ingList += `<li>${i}</li>`);

        const nutrition = await fetchNutrition(ingredients);

        modalBody.innerHTML = `
          <h2>${meal.strMeal}</h2>
          <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="modal-img" />
          <h3>Ingredients</h3><ul>${ingList}</ul>
          ${nutrition ? `<h3>Nutrition</h3>
          <ul>
            <li>Calories: ${nutrition.calories}</li>
            <li>Protein: ${nutrition.protein} g</li>
            <li>Carbs: ${nutrition.carbs} g</li>
            <li>Fat: ${nutrition.fat} g</li>
            <li>Fiber: ${nutrition.fiber} g</li>
            <li>Sugar: ${nutrition.sugar} g</li>
          </ul>` : ''}
          <h3>Instructions</h3><p>${meal.strInstructions}</p>
        `;
        recipeModal.classList.remove('hidden');
      });
    }
  };

  modalClose?.addEventListener('click', () => recipeModal.classList.add('hidden'));
  recipeModal?.addEventListener('click', e => { if(e.target === recipeModal) recipeModal.classList.add('hidden'); });

  // Initial fetch
  const meals = await fetchMealsBySearch('jollof');
  renderRecipes(meals);
})();

// =========================
// Update Stats Function
// =========================
function updateStats() {
  const FAV_KEY = "rf_favorites";
  const PLANNER_KEY = "rf_planner";

  const favEl = document.getElementById("favorites");
  const plannedMealsEl = document.getElementById("plannedMeals");
  const progressEl = document.getElementById("progress");

  const favorites = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  const planner = JSON.parse(localStorage.getItem(PLANNER_KEY) || "{}");

  favEl.textContent = favorites.length;

  const plannedCount = Object.values(planner).reduce((sum, dayMeals) => sum + dayMeals.length, 0);
  plannedMealsEl.textContent = plannedCount;

  const days = ["monday","tuesday","wednesday","thursday","friday"];
  const filledDays = days.filter(day => (planner[day] || []).length > 0).length;
  const progress = Math.round((filledDays / days.length) * 100);
  progressEl.textContent = progress + "%";
}

// Call on load
document.addEventListener("DOMContentLoaded", updateStats);

// =========================
// Modified Functions
// =========================
const toggleFavorite = (meal) => {
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

  // 🔄 Refresh stats instantly
  updateStats();
};

const addToPlanner = (meal, day = 'monday') => {
  try {
    const planner = JSON.parse(localStorage.getItem(PLANNER_KEY) || '{}');
    planner[day] = planner[day] || [];
    planner[day].push({ id: meal.idMeal, name: meal.strMeal });
    localStorage.setItem(PLANNER_KEY, JSON.stringify(planner));
    alert(`Added "${meal.strMeal}" to ${day}`);

    // 🔄 Refresh stats instantly
    updateStats();
  } catch (err) {
    console.error('Planner add failed', err);
  }
};

// =========================
// Reset Planner Button
// =========================
document.getElementById("resetPlannerBtn")?.addEventListener("click", () => {
  if (confirm("Are you sure you want to reset your planner?")) {
    localStorage.removeItem("rf_planner"); // clear planner storage
    alert("Planner has been reset!");
    updateStats(); // 🔄 instantly update dashboard
  }
});

