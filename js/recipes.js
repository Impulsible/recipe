/* js/recipes.js
   Full Recipes page logic: Theme-agnostic, works with your global CSS and recipes.css
   - Uses TheMealDB for recipes
   - Optional Edamam integration for nutrition (provide EDAMAM_ID/EDAMAM_KEY)
*/

(() => {
  // =========================
  // Config & DOM
  // =========================
const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
const EDAMAM_API = 'https://api.edamam.com/api/nutrition-data';
const EDAMAM_ID = '1edd8316'; // your Edamam ID
const EDAMAM_KEY = 'fff5581f3438a5bcac6ab5e038dda7ae'; // your Edamam KEY

  // DOM
  const recipeList = document.getElementById('recipeList');
  const resultCount = document.getElementById('resultCount');
  const searchInputs = [document.getElementById('searchInput'), document.getElementById('searchInputDesktop')].filter(Boolean);
  const randomBtn = document.getElementById('randomBtn');
  const favoritesToggleBtn = document.getElementById('favoritesToggle');
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

  const addFavoritesBtn = document.getElementById('addFavoritesToTracker');
  const clearTrackerBtn = document.getElementById('clearTracker');

  // Stats UI
  const favoritesCountEl = document.getElementById('favorites');
  const plannedMealsEl = document.getElementById('plannedMeals');
  const progressEl = document.getElementById('progress');

  // =========================
  // Keys & State
  // =========================
  const FAV_KEY = 'rf_favorites';
  const PLANNER_KEY = 'rf_planner';
  const RATINGS_KEY = 'rf_ratings';
  const TRACKER_KEY = 'rf_tracker';

  let lastRecipes = [];
  let showingFavoritesOnly = false;

  // Daily goals (exposed in DOM as #goalCalories etc.)
  const goals = {
    calories: Number(document.getElementById('goalCalories')?.textContent || 2000),
    protein: Number(document.getElementById('goalProtein')?.textContent || 150),
    carbs: Number(document.getElementById('goalCarbs')?.textContent || 250),
    fat: Number(document.getElementById('goalFat')?.textContent || 70),
  };

  // Tracker persistence (calories/protein/carbs/fat totals)
  let tracker = JSON.parse(localStorage.getItem(TRACKER_KEY) || JSON.stringify({ calories: 0, protein: 0, carbs: 0, fat: 0 }));

  // =========================
  // Storage helpers
  // =========================
  const getFavorites = () => JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  const setFavorites = (list) => localStorage.setItem(FAV_KEY, JSON.stringify(list));

  const getRatings = () => JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}');
  const setRatings = (obj) => localStorage.setItem(RATINGS_KEY, JSON.stringify(obj));

  const getPlanner = () => JSON.parse(localStorage.getItem(PLANNER_KEY) || '{}');
  const setPlanner = (obj) => localStorage.setItem(PLANNER_KEY, JSON.stringify(obj));

  const saveTracker = () => localStorage.setItem(TRACKER_KEY, JSON.stringify(tracker));

  const isFavorite = (id) => getFavorites().some(f => f.idMeal === id);

  // =========================
  // Helper: Fetch wrappers
  // =========================
  const fetchJSON = async (url) => {
    try {
      const res = await fetch(url);
      return await res.json();
    } catch (err) {
      console.error('fetch error', err);
      return null;
    }
  };

  const fetchMealsBySearch = async (q) => {
    const data = await fetchJSON(`${MEALDB_BASE}/search.php?s=${encodeURIComponent(q)}`);
    return (data && data.meals) ? data.meals : [];
  };

  const fetchRandomMeal = async () => {
    const data = await fetchJSON(`${MEALDB_BASE}/random.php`);
    return (data && data.meals) ? data.meals : [];
  };

  const fetchMealById = async (id) => {
    const data = await fetchJSON(`${MEALDB_BASE}/lookup.php?i=${id}`);
    return (data && data.meals) ? data.meals : [];
  };

  const fetchCategories = async () => {
    if (!filterCategory) return;
    const data = await fetchJSON(`${MEALDB_BASE}/list.php?c=list`);
    (data && data.meals || []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.strCategory;
      opt.textContent = c.strCategory;
      filterCategory.appendChild(opt);
    });
  };

  const fetchAreas = async () => {
    if (!filterArea) return;
    const data = await fetchJSON(`${MEALDB_BASE}/list.php?a=list`);
    (data && data.meals || []).forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.strArea;
      opt.textContent = a.strArea;
      filterArea.appendChild(opt);
    });
  };

  // Edamam nutrition for single ingredient or full ingredient string (optional)
  const fetchNutritionForIngredient = async (ingr) => {
    if (!EDAMAM_ID || !EDAMAM_KEY) return null;
    try {
      const url = `${EDAMAM_API}?app_id=${EDAMAM_ID}&app_key=${EDAMAM_KEY}&ingr=${encodeURIComponent(ingr)}`;
      const data = await fetchJSON(url);
      return data || null;
    } catch {
      return null;
    }
  };

  // Fetch nutrition for an array of ingredient strings (grams/measures included)
  const fetchNutrition = async (ingredients = []) => {
    if (!EDAMAM_ID || !EDAMAM_KEY) return null;
    // accumulate
    let total = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };
    for (const ingr of ingredients) {
      try {
        const data = await fetchNutritionForIngredient(ingr);
        if (!data) continue;
        total.calories += data.calories || 0;
        total.protein += data.totalNutrients?.PROCNT?.quantity || 0;
        total.carbs += data.totalNutrients?.CHOCDF?.quantity || 0;
        total.fat += data.totalNutrients?.FAT?.quantity || 0;
        total.fiber += data.totalNutrients?.FIBTG?.quantity || 0;
        total.sugar += data.totalNutrients?.SUGAR?.quantity || 0;
      } catch (err) {
        // ignore ingredient failures
        console.warn('nutrition fetch failed for', ingr);
      }
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

  // =========================
  // Ratings UI
  // =========================
  function renderStars() {
    document.querySelectorAll(".rating").forEach((ratingDiv) => {
      const id = ratingDiv.dataset.id;
      const stars = Array.from(ratingDiv.querySelectorAll(".star"));
      const ratings = getRatings();
      const entry = ratings[id] || [];
      const avg = entry.length ? (entry.reduce((a, b) => a + b, 0) / entry.length) : 0;
      const avgRounded = Number(avg.toFixed(1));

      stars.forEach((star, i) => {
        star.classList.toggle("active", i < Math.round(avg));
        // remove previous handlers to avoid duplication
        star.replaceWith(star.cloneNode(true));
      });

      // reselect stars after cloning
      const freshStars = Array.from(ratingDiv.querySelectorAll(".star"));
      freshStars.forEach((star) => {
        star.addEventListener("click", () => {
          const val = Number(star.dataset.value);
          const ratingsNow = getRatings();
          ratingsNow[id] = ratingsNow[id] || [];
          ratingsNow[id].push(val);
          setRatings(ratingsNow);
          renderStars(); // refresh
        });
      });

      const avgSpan = ratingDiv.querySelector(".avg");
      if (avgSpan) avgSpan.textContent = ` (${avgRounded})`;
    });
  }

  // =========================
  // Progress Ring helper
  // =========================
  function updateProgressRing(selector, percent) {
    const circle = document.querySelector(selector);
    if (!circle) return;
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (Math.max(0, Math.min(percent, 100)) / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }

  // =========================
  // UI: update tracker display (rings + numbers)
  // =========================
  function updateTrackerDisplay() {
    // elements
    const elCalories = document.getElementById('summaryCalories');
    const elProtein = document.getElementById('summaryProtein');
    const elCarbs = document.getElementById('summaryCarbs');
    const elFat = document.getElementById('summaryFat');

    const valCalories = document.getElementById('summaryCaloriesValue');
    const valProtein = document.getElementById('summaryProteinValue');
    const valCarbs = document.getElementById('summaryCarbsValue');
    const valFat = document.getElementById('summaryFatValue');

    // numeric update
    if (elCalories) elCalories.textContent = tracker.calories;
    if (elProtein) elProtein.textContent = tracker.protein;
    if (elCarbs) elCarbs.textContent = tracker.carbs;
    if (elFat) elFat.textContent = tracker.fat;

    // percent
    const pctCalories = Math.floor((tracker.calories / Math.max(goals.calories, 1)) * 100);
    const pctProtein = Math.floor((tracker.protein / Math.max(goals.protein, 1)) * 100);
    const pctCarbs = Math.floor((tracker.carbs / Math.max(goals.carbs, 1)) * 100);
    const pctFat = Math.floor((tracker.fat / Math.max(goals.fat, 1)) * 100);

    if (valCalories) valCalories.textContent = Math.max(0, Math.min(100, pctCalories));
    if (valProtein) valProtein.textContent = Math.max(0, Math.min(100, pctProtein));
    if (valCarbs) valCarbs.textContent = Math.max(0, Math.min(100, pctCarbs));
    if (valFat) valFat.textContent = Math.max(0, Math.min(100, pctFat));

    // rings
    updateProgressRing('.progress.calories', pctCalories);
    updateProgressRing('.progress.protein', pctProtein);
    updateProgressRing('.progress.carbs', pctCarbs);
    updateProgressRing('.progress.fat', pctFat);

    // persist
    saveTracker();
  }

  // =========================
  // Update dashboard stats (favorites, planner)
  // =========================
  function updateStats() {
    const favorites = getFavorites();
    const planner = getPlanner();

    if (favoritesCountEl) favoritesCountEl.textContent = favorites.length;
    if (plannedMealsEl) {
      const plannedCount = Object.values(planner).reduce((sum, dayMeals) => sum + (dayMeals?.length || 0), 0);
      plannedMealsEl.textContent = plannedCount;
    }
    if (progressEl) {
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
      const filledDays = days.filter(day => (planner[day] || []).length > 0).length;
      const progress = Math.round((filledDays / days.length) * 100);
      progressEl.textContent = progress + "%";
    }
  }

  // =========================
  // Favorites & Planner actions
  // =========================
  function toggleFavorite(meal) {
    const favs = getFavorites();
    const index = favs.findIndex(f => f.idMeal === meal.idMeal);
    if (index >= 0) {
      favs.splice(index, 1);
      if (statusMsg) statusMsg.textContent = `${meal.strMeal} removed from favorites`;
    } else {
      favs.unshift(meal);
      if (statusMsg) statusMsg.textContent = `${meal.strMeal} added to favorites`;
    }
    setFavorites(favs);
    renderRecipes(lastRecipes);
    updateStats();
  }

  function addToPlanner(meal, day = 'monday') {
    try {
      const planner = getPlanner();
      planner[day] = planner[day] || [];
      planner[day].push({ id: meal.idMeal, name: meal.strMeal });
      setPlanner(planner);
      alert(`Added "${meal.strMeal}" to ${day}`);
      updateStats();
    } catch (err) {
      console.error('Planner add failed', err);
    }
  }

  // =========================
  // Add favorites to tracker (sums nutrition)
  // =========================
  async function addFavoritesToTracker() {
    const favs = getFavorites();
    if (!favs.length) {
      alert('No favorites to add. Save some recipes first.');
      return;
    }

    // sum nutrition from cached meal._nutrition or fetch with Edamam (if keys set)
    let sum = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const meal of favs) {
      // prefer cached nutrition saved on meal object (we put _nutrition at render time)
      if (meal._nutrition) {
        sum.calories += meal._nutrition.calories || 0;
        sum.protein += meal._nutrition.protein || 0;
        sum.carbs += meal._nutrition.carbs || 0;
        sum.fat += meal._nutrition.fat || 0;
      } else if (EDAMAM_ID && EDAMAM_KEY) {
        // Collect ingredient strings for that meal by lookup (remote)
        try {
          const meals = await fetchMealById(meal.idMeal);
          const m = meals[0];
          const ingredients = [];
          for (let i = 1; i <= 20; i++) {
            const ing = m[`strIngredient${i}`];
            const measure = m[`strMeasure${i}`];
            if (ing?.trim()) ingredients.push(`${measure || ''} ${ing}`);
          }
          const nutrit = await fetchNutrition(ingredients);
          if (nutrit) {
            sum.calories += nutrit.calories || 0;
            sum.protein += nutrit.protein || 0;
            sum.carbs += nutrit.carbs || 0;
            sum.fat += nutrit.fat || 0;
            // cache
            meal._nutrition = nutrit;
          }
        } catch (err) { /* ignore */ }
      } else {
        // fallback estimate: moderately portioned meal
        sum.calories += 400;
        sum.protein += 25;
        sum.carbs += 45;
        sum.fat += 12;
      }
    }

    // update global tracker
    tracker.calories += Math.round(sum.calories);
    tracker.protein += Math.round(sum.protein);
    tracker.carbs += Math.round(sum.carbs);
    tracker.fat += Math.round(sum.fat);

    // feedback & persist
    saveTracker();
    updateTrackerDisplay();
    const btn = addFavoritesBtn;
    if (btn) {
      btn.textContent = '✅ Added!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Add Favorites to Tracker';
        btn.disabled = false;
      }, 1400);
    }
  }

  function clearTracker() {
    tracker = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    saveTracker();
    updateTrackerDisplay();
    const btn = clearTrackerBtn;
    if (btn) {
      btn.textContent = 'Cleared';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Clear Tracker';
        btn.disabled = false;
      }, 900);
    }
  }

  // =========================
  // Render recipes (cards)
  // =========================
  async function renderRecipes(recipes = []) {
    lastRecipes = recipes || [];
    recipeList.innerHTML = '';

    const toShow = showingFavoritesOnly ? getFavorites() : recipes;
    resultCount && (resultCount.textContent = toShow.length || 0);

    if (!toShow.length) {
      recipeList.innerHTML = '<p class="empty">No recipes found.</p>';
      return;
    }

    // create fragment
    const frag = document.createDocumentFragment();

    for (const meal of toShow) {
      // Card
      const card = document.createElement('article');
      card.className = 'recipe-card';

      // Placeholder nutrition; we'll attempt to fetch/calc and set meal._nutrition
      const nutritionText = 'Loading nutrition…';

      card.innerHTML = `
        <div class="card-image">
          <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        </div>
        <div class="card-body">
          <h4>${meal.strMeal}</h4>
          <p class="meta">${meal.strArea || '—'} • ${meal.strCategory || '—'}</p>
          <div class="nutrition">${nutritionText}</div>
          <div class="rating" data-id="${meal.idMeal}">
            <span class="star" data-value="1">★</span>
            <span class="star" data-value="2">★</span>
            <span class="star" data-value="3">★</span>
            <span class="star" data-value="4">★</span>
            <span class="star" data-value="5">★</span>
            <span class="avg"></span>
          </div>
          <div class="card-actions">
            <button class="btn outline save-btn">${isFavorite(meal.idMeal) ? 'Unsave' : 'Save'}</button>
            <button class="btn planner-btn">Add to Planner</button>
            <button class="btn small detail-btn">View</button>
          </div>
        </div>
      `;

      // Attach behavior
      const saveBtn = card.querySelector('.save-btn');
      const plannerBtn = card.querySelector('.planner-btn');
      const detailBtn = card.querySelector('.detail-btn');
      const nutEl = card.querySelector('.nutrition');

      saveBtn?.addEventListener('click', () => toggleFavorite(meal));
      plannerBtn?.addEventListener('click', async () => {
        const day = prompt('Add to which day? (monday, tuesday, etc.)', 'monday');
        if (day) addToPlanner(meal, day.toLowerCase());
      });

      detailBtn?.addEventListener('click', async () => openModal(meal.idMeal));

      // Try to compute nutrition: use meal.strIngredient1 raw method for quick single-ingredient calories if EDAMAM provided,
      // or fetch nutrition for all ingredients asynchronously and attach to meal._nutrition.
      (async () => {
        // Build ingredients list
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
          const ing = meal[`strIngredient${i}`];
          const measure = meal[`strMeasure${i}`];
          if (ing?.trim()) ingredients.push(`${measure || ''} ${ing}`.trim());
        }

        // If we have Edamam keys, fetch nutrition aggregation
        if (EDAMAM_ID && EDAMAM_KEY && ingredients.length) {
          const nutrit = await fetchNutrition(ingredients);
          if (nutrit) {
            meal._nutrition = nutrit; // attach to object for later reuse
            nutEl.textContent = `🔥 ${nutrit.calories} cal | 🥩 ${nutrit.protein}g | 🍞 ${nutrit.carbs}g | 🧈 ${nutrit.fat}g`;
          } else {
            nutEl.textContent = 'Nutrition info unavailable';
          }
        } else {
          // No Edamam keys: show approximate by checking first ingredient or fallback
          if (meal.strIngredient1) {
            // optional: attempt one-ingredient quick lookup (best-effort)
            const quick = await fetchNutritionForIngredient(`${meal.strIngredient1} 100g`);
            if (quick && quick.calories) {
              meal._nutrition = {
                calories: Math.round(quick.calories),
                protein: Math.round(quick.totalNutrients?.PROCNT?.quantity || 0),
                carbs: Math.round(quick.totalNutrients?.CHOCDF?.quantity || 0),
                fat: Math.round(quick.totalNutrients?.FAT?.quantity || 0)
              };
              nutEl.textContent = `🔥 ${meal._nutrition.calories} cal (est)`;
            } else {
              // fallback simple estimate
              meal._nutrition = { calories: 400, protein: 25, carbs: 45, fat: 12 };
              nutEl.textContent = `🔥 ~${meal._nutrition.calories} cal (est)`;
            }
          } else {
            nutEl.textContent = 'Nutrition info unavailable';
          }
        }
      })();

      frag.appendChild(card);
    }

    recipeList.appendChild(frag);

    // render ratings stars
    renderStars();

    // re-create icons (lucide)
    window.lucide?.createIcons?.();
  }

  // =========================
  // Modal (detailed view)
  // =========================
  async function openModal(id) {
    const meals = await fetchMealById(id);
    const meal = meals[0];
    if (!meal) return;

    // ingredients list
    let ingredientsHtml = '';
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ing?.trim()) {
        ingredients.push(`${measure || ''} ${ing}`.trim());
        ingredientsHtml += `<li>${ing} - ${measure || ''}</li>`;
      }
    }

    // nutrition (prefer cached)
    let nutrition = meal._nutrition || null;
    if (!nutrition && (EDAMAM_ID && EDAMAM_KEY)) {
      nutrition = await fetchNutrition(ingredients);
      if (nutrition) meal._nutrition = nutrition;
    }

    modalBody.innerHTML = `
      <h2 id="modalTitle">${meal.strMeal}</h2>
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="modal-img" />
      <h3>Ingredients</h3>
      <ul>${ingredientsHtml}</ul>
      ${nutrition ? `<h3>Nutrition</h3>
        <ul>
          <li>Calories: ${nutrition.calories}</li>
          <li>Protein: ${nutrition.protein} g</li>
          <li>Carbs: ${nutrition.carbs} g</li>
          <li>Fat: ${nutrition.fat} g</li>
          <li>Fiber: ${nutrition.fiber} g</li>
          <li>Sugar: ${nutrition.sugar} g</li>
        </ul>` : ''}
      <h3>Instructions</h3>
      <p>${meal.strInstructions || '—'}</p>
      <div style="display:flex;gap:.5rem;margin-top:1rem;">
        <button class="btn fav-modal-btn">${isFavorite(meal.idMeal) ? '❤️ Unsave' : '🤍 Save'}</button>
        <button class="btn small add-to-tracker-modal">Add to Tracker</button>
      </div>
    `;

    // fav toggle inside modal
    modalBody.querySelector('.fav-modal-btn')?.addEventListener('click', () => {
      toggleFavorite(meal);
      openModal(meal.idMeal); // refresh
    });

    // add this meal's nutrition to tracker
    modalBody.querySelector('.add-to-tracker-modal')?.addEventListener('click', () => {
      const nut = meal._nutrition || { calories: 400, protein: 25, carbs: 45, fat: 12 };
      tracker.calories += Math.round(nut.calories || 0);
      tracker.protein += Math.round(nut.protein || 0);
      tracker.carbs += Math.round(nut.carbs || 0);
      tracker.fat += Math.round(nut.fat || 0);
      saveTracker();
      updateTrackerDisplay();
      updateStats();
      alert('Added this meal to your tracker.');
    });

    recipeModal.classList.remove('hidden');
  }

  modalClose?.addEventListener('click', () => recipeModal.classList.add('hidden'));
  recipeModal?.addEventListener('click', (e) => { if (e.target === recipeModal) recipeModal.classList.add('hidden'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') recipeModal.classList.add('hidden'); });

  // =========================
  // Filters & Search
  // =========================
  const debounce = (fn, wait = 350) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  async function searchAndRender(q) {
    if (!q || q.trim().length < 1) return;
    const meals = await fetchMealsBySearch(q.trim());
    await renderRecipes(meals);
  }

  const debouncedSearch = debounce((q) => searchAndRender(q), 450);
  searchInputs.forEach(input => input.addEventListener('input', (e) => {
    const v = e.target.value;
    if (v.length > 1) debouncedSearch(v);
  }));

  // apply filter locally on lastRecipes (or favorites)
  const applyFiltersHandler = async () => {
    const maxCal = Number(caloriesRange?.value || 1200);
    const diet = (dietSelect?.value || '').toLowerCase().trim();
    const area = (filterArea?.value || '').toLowerCase().trim();
    const cat = (filterCategory?.value || '').toLowerCase().trim();

    const source = showingFavoritesOnly ? getFavorites() : lastRecipes;
    const filtered = (source || []).filter(meal => {
      let ok = true;
      if (diet) ok = ok && ((meal.strTags || '').toLowerCase().includes(diet) || (meal.strMeal || '').toLowerCase().includes(diet));
      if (area) ok = ok && (meal.strArea || '').toLowerCase() === area;
      if (cat) ok = ok && (meal.strCategory || '').toLowerCase() === cat;
      // calories filtering - if meal._nutrition exists
      if (meal._nutrition && maxCal) ok = ok && (meal._nutrition.calories <= maxCal);
      return ok;
    });

    await renderRecipes(filtered);
  };

  applyBtn?.addEventListener('click', applyFiltersHandler);
  resetBtn?.addEventListener('click', async () => {
    if (dietSelect) dietSelect.value = '';
    if (filterArea) filterArea.value = '';
    if (filterCategory) filterCategory.value = '';
    if (caloriesRange) {
      caloriesRange.value = 800;
      if (calLabel) calLabel.textContent = 800;
    }
    await fetchAndShowDefault();
  });

  filterArea?.addEventListener('change', applyFiltersHandler);
  filterCategory?.addEventListener('change', applyFiltersHandler);
  caloriesRange?.addEventListener('input', (e) => calLabel && (calLabel.textContent = e.target.value));

  // =========================
  // Favorites toggle + Random
  // =========================
  favoritesToggleBtn?.addEventListener('click', async () => {
    showingFavoritesOnly = !showingFavoritesOnly;
    favoritesToggleBtn.classList.toggle('active', showingFavoritesOnly);
    if (showingFavoritesOnly) {
      await renderRecipes(getFavorites());
    } else {
      await fetchAndShowDefault();
    }
  });

  randomBtn?.addEventListener('click', async () => {
    const meals = await fetchRandomMeal();
    await renderRecipes(meals);
  });

  // =========================
  // Fetch default / initial
  // =========================
  const fetchAndShowDefault = async () => {
    let meals = await fetchMealsBySearch('jollof');
    if (!meals.length) meals = await fetchMealsBySearch('chicken');
    lastRecipes = meals;
    await renderRecipes(meals);
  };

  // =========================
  // Bind tracker buttons
  // =========================
  addFavoritesBtn?.addEventListener('click', addFavoritesToTracker);
  clearTrackerBtn?.addEventListener('click', clearTracker);

  // =========================
  // Reset planner button (if present)
  // =========================
  document.getElementById('resetPlannerBtn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset your planner?')) {
      localStorage.removeItem(PLANNER_KEY);
      updateStats();
      alert('Planner has been reset!');
    }
  });

  // =========================
  // Init: fetch lists, default recipes and update UI
  // =========================
  (async function init() {
    await fetchCategories();
    await fetchAreas();
    await fetchAndShowDefault();
    renderStars();
    updateStats();
    updateTrackerDisplay();
  })();

  // Expose minimal functions for console debugging (optional)
  window.RF = {
    fetchAndShowDefault,
    renderRecipes,
    getFavorites,
    toggleFavorite,
    addToPlanner,
    tracker,
    updateTrackerDisplay,
    updateStats
  };

})();

const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
const EDAMAM_API = 'https://api.edamam.com/api/nutrition-data';
const EDAMAM_ID = '1edd8316'; // your Edamam ID
const EDAMAM_KEY = 'fff5581f3438a5bcac6ab5e038dda7ae'; // your Edamam KEY

const dashboardGrid = document.getElementById('dashboardGrid');
const modal = document.getElementById('dashboardModal');
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');
const modalSteps = document.getElementById('modalSteps');
const backBtn = document.getElementById('backToDashboard');
const closeModal = modal.querySelector('.modal-close');

// Utility: fetch a random meal
async function fetchRandomMeal() {
  const res = await fetch(`${MEALDB_BASE}/random.php`);
  const data = await res.json();
  return data.meals ? data.meals[0] : null;
}

// Create mini macro ring
function createMiniMacroRing(container, macro, value) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const circleTrack = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  const circleProgress = document.createElementNS("http://www.w3.org/2000/svg", "circle");

  const radius = 16;
  const circumference = 2 * Math.PI * radius;

  svg.setAttribute("viewBox", "0 0 40 40");
  circleTrack.setAttribute("cx", 20);
  circleTrack.setAttribute("cy", 20);
  circleTrack.setAttribute("r", radius);
  circleTrack.setAttribute("class", "track");

  circleProgress.setAttribute("cx", 20);
  circleProgress.setAttribute("cy", 20);
  circleProgress.setAttribute("r", radius);
  circleProgress.setAttribute("class", macro);
  circleProgress.style.strokeDasharray = circumference;
  circleProgress.style.strokeDashoffset = circumference - (value / 100) * circumference;

  svg.appendChild(circleTrack);
  svg.appendChild(circleProgress);

  const macroDiv = document.createElement("div");
  macroDiv.classList.add("macro-ring");
  macroDiv.appendChild(svg);

  const valueDiv = document.createElement("div");
  valueDiv.classList.add("macro-value");
  valueDiv.textContent = value + "%";
  macroDiv.appendChild(valueDiv);

  container.appendChild(macroDiv);
}

// Generate dashboard cards with nutrition info
async function generateDashboardCards() {
  const usedMeals = new Set();

  for (let i = 0; i < 12; i++) {
    let meal;
    do {
      meal = await fetchRandomMeal();
    } while (!meal || usedMeals.has(meal.idMeal));
    usedMeals.add(meal.idMeal);

    const card = document.createElement('div');
    card.classList.add('dashboard-card');
    card.dataset.title = meal.strMeal;
    card.dataset.steps = meal.strInstructions;

    // Ingredients text for Edamam
    const ingredients = [];
    for (let j = 1; j <= 20; j++) {
      const ingredient = meal[`strIngredient${j}`];
      const measure = meal[`strMeasure${j}`];
      if (ingredient) ingredients.push(`${measure} ${ingredient}`);
    }
    const ingredientsText = ingredients.join(', ');
    card.dataset.description = ingredientsText;

    // Fetch nutrition data immediately
    try {
      const url = `${EDAMAM_API}?app_id=${EDAMAM_ID}&app_key=${EDAMAM_KEY}&ingr=${encodeURIComponent(ingredientsText)}`;
      const nutritionRes = await fetch(url);
      const nutritionData = await nutritionRes.json();
      card.dataset.nutrition = `
        Calories: ${nutritionData.calories || 'N/A'} kcal,
        Protein: ${nutritionData.totalNutrients?.PROCNT?.quantity?.toFixed(1) || 'N/A'} g,
        Carbs: ${nutritionData.totalNutrients?.CHOCDF?.quantity?.toFixed(1) || 'N/A'} g,
        Fat: ${nutritionData.totalNutrients?.FAT?.quantity?.toFixed(1) || 'N/A'} g
      `;
    } catch {
      card.dataset.nutrition = 'Nutrition info unavailable.';
    }

    // Card inner HTML
    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <div class="card-overlay">
        <h3>${meal.strMeal}</h3>
        <p>Click to view recipe & macros</p>
      </div>
    `;

    // Add mini macro rings
    const overlay = card.querySelector('.card-overlay');
    const macroContainer = document.createElement("div");
    macroContainer.classList.add("macro-mini");
    overlay.appendChild(macroContainer);
    createMiniMacroRing(macroContainer, "protein", Math.floor(Math.random() * 50) + 20);
    createMiniMacroRing(macroContainer, "carbs", Math.floor(Math.random() * 50) + 20);
    createMiniMacroRing(macroContainer, "fat", Math.floor(Math.random() * 50) + 10);

    dashboardGrid.appendChild(card);

    // Modal click
    card.addEventListener("click", () => {
      modal.classList.remove("hidden");
      modalTitle.textContent = card.dataset.title;
      modalSteps.textContent = card.dataset.steps;
      modalDescription.textContent = card.dataset.nutrition;
    });
  }
}

// Close modal events
closeModal.addEventListener('click', () => modal.classList.add('hidden'));
backBtn.addEventListener('click', () => modal.classList.add('hidden'));
window.addEventListener('keydown', e => { if (e.key === "Escape") modal.classList.add('hidden'); });

// Initialize dashboard
generateDashboardCards();
