// recipes.js - Complete recipe functionality with API integration and Nutrition Tracker
class RecipeManager {
    constructor() {
        this.API_BASE = 'https://api.edamam.com/api/recipes/v2';
        this.APP_ID = '1edd8316';
        this.APP_KEY = 'fff5581f3438a5bcac6ab5e038dda7ae';
        this.MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
        
        this.recipes = [];
        this.filteredRecipes = [];
        this.currentPage = 1;
        this.recipesPerPage = 30;
        this.isLoading = false;
        this.favoritesOnly = false;
        this.currentCategory = 'all';
        this.currentView = 'grid';
        this.hasMoreRecipes = true;
        this.currentRecipeForPlan = null;
        
        this.initializeEventListeners();
        this.loadRecipes();
    }

    initializeEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        
        if (searchInput) {
            // Debounce search input
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filterRecipes(e.target.value);
                }, 300);
            });
        }

        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.filterRecipes('');
                }
            });
        }

        // View toggle
        const gridViewBtn = document.getElementById('gridViewBtn');
        const listViewBtn = document.getElementById('listViewBtn');
        
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => {
                this.setView('grid');
            });
        }

        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => {
                this.setView('list');
            });
        }

        // Category filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.filterByCategory(category);
                
                // Update active state
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Favorites toggle
        const favoritesToggle = document.getElementById('favoritesToggle');
        if (favoritesToggle) {
            favoritesToggle.addEventListener('click', () => {
                this.favoritesOnly = !this.favoritesOnly;
                const searchInput = document.getElementById('searchInput');
                this.filterRecipes(searchInput ? searchInput.value : '');
                
                // Update button state
                if (this.favoritesOnly) {
                    favoritesToggle.classList.add('active');
                    favoritesToggle.innerHTML = '<i data-lucide="heart"></i> All Recipes';
                } else {
                    favoritesToggle.classList.remove('active');
                    favoritesToggle.innerHTML = '<i data-lucide="heart"></i> Favorites';
                }
                this.refreshIcons();
            });
        }

        // Advanced filters
        const advancedFiltersBtn = document.getElementById('advancedFiltersBtn');
        const applyFilters = document.getElementById('applyFilters');
        const resetFilters = document.getElementById('resetFilters');
        
        if (advancedFiltersBtn) {
            advancedFiltersBtn.addEventListener('click', () => {
                const advancedFilters = document.getElementById('advancedFilters');
                advancedFilters.classList.toggle('hidden');
            });
        }

        if (applyFilters) {
            applyFilters.addEventListener('click', () => {
                this.applyAdvancedFilters();
            });
        }

        if (resetFilters) {
            resetFilters.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreRecipes();
            });
        }

        // Random recipe buttons
        const randomRecipeBtn = document.getElementById('heroRandomBtn');
        const resetSearch = document.getElementById('resetSearch');
        
        if (randomRecipeBtn) {
            randomRecipeBtn.addEventListener('click', () => {
                this.getRandomRecipe();
            });
        }

        if (resetSearch) {
            resetSearch.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // Hero search button
        const heroSearchBtn = document.getElementById('heroSearchBtn');
        if (heroSearchBtn) {
            heroSearchBtn.addEventListener('click', () => {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    document.querySelector('.controls-section').scrollIntoView({ 
                        behavior: 'smooth' 
                    });
                }
            });
        }

        // Sort functionality
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortRecipes(e.target.value);
            });
        }
    }

    async loadRecipes() {
        if (this.isLoading) return;
        
        this.showLoadingState();
        this.isLoading = true;

        try {
            // Try Edamam API first
            const recipes = await this.fetchFromEdamam();
            if (recipes && recipes.length > 0) {
                this.recipes = recipes;
                this.showToast(`Loaded ${recipes.length} delicious recipes!`, 'success');
            } else {
                // Fallback to MealDB
                const mealDbRecipes = await this.fetchFromMealDB();
                this.recipes = mealDbRecipes;
                this.showToast(`Loaded ${mealDbRecipes.length} recipes from our database`, 'info');
            }
            
            this.filteredRecipes = [...this.recipes];
            this.renderRecipes();
            this.updateResultCount();
            
        } catch (error) {
            console.error('Error loading recipes:', error);
            this.showToast('Failed to load recipes. Using sample data.', 'error');
            // Final fallback to sample data
            this.recipes = this.generateSampleRecipes();
            this.filteredRecipes = [...this.recipes];
            this.renderRecipes();
            this.updateResultCount();
        } finally {
            this.hideLoadingState();
            this.isLoading = false;
        }
    }

    async fetchFromEdamam() {
        try {
            const response = await fetch(
                `${this.API_BASE}?type=public&app_id=${this.APP_ID}&app_key=${this.APP_KEY}&random=true&field=label&field=image&field=source&field=url&field=yield&field=dietLabels&field=healthLabels&field=ingredients&field=calories&field=totalTime`
            );
            
            if (!response.ok) {
                throw new Error(`Edamam API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.hits && data.hits.length > 0) {
                return data.hits.slice(0, 30).map(hit => this.transformEdamamRecipe(hit.recipe));
            }
            
            return [];
            
        } catch (error) {
            console.error('Edamam API error:', error);
            return [];
        }
    }

    async fetchFromMealDB() {
        try {
            const response = await fetch(`${this.MEALDB_BASE}/search.php?s=`);
            
            if (!response.ok) {
                throw new Error(`MealDB API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.meals) {
                return data.meals.slice(0, 30).map(meal => this.transformMealDBRecipe(meal));
            }
            
            return [];
            
        } catch (error) {
            console.error('MealDB API error:', error);
            return [];
        }
    }

    transformEdamamRecipe(recipe) {
        const categories = ['breakfast', 'lunch', 'dinner', 'dessert', 'vegetarian', 'quick'];
        const difficulties = ['easy', 'medium', 'hard'];
        
        return {
            id: recipe.uri ? recipe.uri.split('#')[1] : `edamam-${Date.now()}`,
            title: recipe.label || 'Unknown Recipe',
            description: recipe.source ? `From ${recipe.source}` : 'A delicious and nutritious recipe',
            image: recipe.image || this.getFallbackImage(),
            category: this.determineCategory(recipe.mealType, recipe.dishType, recipe.healthLabels),
            difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
            prepTime: Math.floor(recipe.totalTime) || [15, 30, 45, 60][Math.floor(Math.random() * 4)],
            calories: Math.floor(recipe.calories) || Math.floor(Math.random() * 500) + 200,
            rating: (Math.random() * 1 + 4).toFixed(1),
            isFavorite: false,
            servings: recipe.yield || 4,
            ingredients: recipe.ingredients ? recipe.ingredients.map(ing => ({
                ingredient: ing.food || 'Unknown ingredient',
                measure: ing.text || ''
            })) : this.generateSampleIngredients(),
            instructions: ['Step 1: Prepare ingredients', 'Step 2: Follow recipe instructions', 'Step 3: Serve and enjoy'],
            source: recipe.url
        };
    }

    transformMealDBRecipe(meal) {
        const categories = ['breakfast', 'lunch', 'dinner', 'dessert', 'vegetarian', 'quick'];
        const difficulties = ['easy', 'medium', 'hard'];
        
        return {
            id: meal.idMeal || `mealdb-${Date.now()}`,
            title: meal.strMeal || 'Unknown Recipe',
            description: meal.strInstructions ? meal.strInstructions.substring(0, 150) + '...' : 'A delicious recipe',
            image: meal.strMealThumb || this.getFallbackImage(),
            category: meal.strCategory ? meal.strCategory.toLowerCase() : categories[Math.floor(Math.random() * categories.length)],
            difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
            prepTime: [15, 30, 45, 60][Math.floor(Math.random() * 4)],
            calories: Math.floor(Math.random() * 500) + 200,
            rating: (Math.random() * 1 + 4).toFixed(1),
            isFavorite: false,
            servings: 4,
            ingredients: this.extractMealDBIngredients(meal),
            instructions: meal.strInstructions ? 
                meal.strInstructions.split('\r\n').filter(step => step.trim()).slice(0, 5) : 
                ['Step 1: Prepare ingredients', 'Step 2: Follow recipe instructions', 'Step 3: Serve and enjoy']
        };
    }

    extractMealDBIngredients(meal) {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            
            if (ingredient && ingredient.trim()) {
                ingredients.push({
                    ingredient: ingredient,
                    measure: measure || ''
                });
            }
        }
        return ingredients.length > 0 ? ingredients : this.generateSampleIngredients();
    }

    determineCategory(mealType, dishType, healthLabels) {
        const categories = ['breakfast', 'lunch', 'dinner', 'dessert', 'vegetarian', 'quick'];
        
        if (mealType && Array.isArray(mealType)) {
            if (mealType.includes('breakfast')) return 'breakfast';
            if (mealType.includes('lunch')) return 'lunch';
            if (mealType.includes('dinner')) return 'dinner';
        }
        
        if (healthLabels && healthLabels.includes('Vegetarian')) return 'vegetarian';
        if (dishType && dishType.includes('dessert')) return 'dessert';
        
        return categories[Math.floor(Math.random() * categories.length)];
    }

    generateSampleRecipes() {
        const sampleRecipes = [
            {
                id: 'sample-1',
                title: "Creamy Garlic Parmesan Pasta",
                description: "A rich and creamy pasta dish with garlic, parmesan, and fresh herbs. Perfect for a quick dinner.",
                image: "https://images.unsplash.com/photo-1598866594230-a7c12756260f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                category: "dinner",
                difficulty: "easy",
                prepTime: 25,
                calories: 450,
                rating: "4.7",
                isFavorite: false,
                servings: 4,
                ingredients: [
                    { ingredient: "Pasta", measure: "400g" },
                    { ingredient: "Garlic", measure: "4 cloves" },
                    { ingredient: "Parmesan", measure: "100g" },
                    { ingredient: "Heavy cream", measure: "200ml" },
                    { ingredient: "Fresh parsley", measure: "2 tbsp" }
                ],
                instructions: [
                    "Cook pasta according to package instructions.",
                    "Sauté garlic in olive oil until fragrant.",
                    "Add cream and parmesan, stir until smooth.",
                    "Combine with drained pasta.",
                    "Garnish with parsley and serve immediately."
                ]
            },
            {
                id: 'sample-2',
                title: "Berry Smoothie Bowl",
                description: "A refreshing and nutritious breakfast bowl packed with antioxidants and vitamins.",
                image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                category: "breakfast",
                difficulty: "easy",
                prepTime: 10,
                calories: 280,
                rating: "4.5",
                isFavorite: false,
                servings: 1,
                ingredients: [
                    { ingredient: "Mixed berries", measure: "1 cup" },
                    { ingredient: "Banana", measure: "1" },
                    { ingredient: "Greek yogurt", measure: "150g" },
                    { ingredient: "Honey", measure: "1 tbsp" },
                    { ingredient: "Granola", measure: "2 tbsp" }
                ],
                instructions: [
                    "Blend berries, banana, and yogurt until smooth.",
                    "Pour into a bowl.",
                    "Top with granola and additional berries.",
                    "Drizzle with honey and serve."
                ]
            },
            {
                id: 'sample-3',
                title: "Vegetable Stir Fry",
                description: "A quick and healthy stir fry with fresh vegetables and savory sauce.",
                image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                category: "lunch",
                difficulty: "medium",
                prepTime: 20,
                calories: 320,
                rating: "4.3",
                isFavorite: false,
                servings: 2,
                ingredients: [
                    { ingredient: "Mixed vegetables", measure: "3 cups" },
                    { ingredient: "Soy sauce", measure: "2 tbsp" },
                    { ingredient: "Ginger", measure: "1 tbsp" },
                    { ingredient: "Garlic", measure: "2 cloves" },
                    { ingredient: "Sesame oil", measure: "1 tbsp" }
                ],
                instructions: [
                    "Heat oil in a wok or large pan.",
                    "Add garlic and ginger, stir until fragrant.",
                    "Add vegetables and stir fry for 5-7 minutes.",
                    "Add soy sauce and cook for 2 more minutes.",
                    "Serve hot with rice or noodles."
                ]
            }
        ];

        // Generate more sample recipes
        for (let i = 4; i <= 30; i++) {
            const categories = ['breakfast', 'lunch', 'dinner', 'dessert', 'vegetarian', 'quick'];
            const difficulties = ['easy', 'medium', 'hard'];
            const category = categories[Math.floor(Math.random() * categories.length)];
            
            sampleRecipes.push({
                id: `sample-${i}`,
                title: `Delicious ${category.charAt(0).toUpperCase() + category.slice(1)} Recipe ${i}`,
                description: `A tasty and nutritious ${category} option that's perfect for any occasion. Made with fresh ingredients.`,
                image: this.getFallbackImage(),
                category: category,
                difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
                prepTime: [15, 20, 25, 30, 45, 60][Math.floor(Math.random() * 6)],
                calories: Math.floor(Math.random() * 400) + 200,
                rating: (Math.random() * 1 + 4).toFixed(1),
                isFavorite: Math.random() > 0.8,
                servings: [2, 4, 6][Math.floor(Math.random() * 3)],
                ingredients: this.generateSampleIngredients(),
                instructions: [
                    'Prepare all ingredients by washing and chopping as needed.',
                    'Follow the cooking instructions carefully.',
                    'Adjust seasonings to taste.',
                    'Cook until perfectly done.',
                    'Serve hot and enjoy your meal!'
                ]
            });
        }

        return sampleRecipes;
    }

    generateSampleIngredients() {
        const ingredients = [
            { ingredient: 'Fresh vegetables', measure: '2 cups' },
            { ingredient: 'Protein source', measure: '200g' },
            { ingredient: 'Herbs and spices', measure: '1 tbsp' },
            { ingredient: 'Cooking oil', measure: '2 tbsp' },
            { ingredient: 'Seasoning', measure: 'to taste' }
        ];
        return ingredients;
    }

    getFallbackImage() {
        const foodImages = [
            "https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
        ];
        return foodImages[Math.floor(Math.random() * foodImages.length)];
    }

    filterRecipes(searchTerm) {
        let filtered = [...this.recipes];
        
        // Apply search filter
        if (searchTerm && searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(recipe => 
                recipe.title.toLowerCase().includes(term) ||
                recipe.description.toLowerCase().includes(term) ||
                recipe.category.toLowerCase().includes(term) ||
                recipe.ingredients.some(ing => ing.ingredient.toLowerCase().includes(term))
            );
        }
        
        // Apply favorites filter
        if (this.favoritesOnly) {
            filtered = filtered.filter(recipe => recipe.isFavorite);
        }
        
        // Apply category filter
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(recipe => recipe.category === this.currentCategory);
        }
        
        this.filteredRecipes = filtered;
        this.currentPage = 1;
        this.renderRecipes();
        this.updateResultCount();
    }

    filterByCategory(category) {
        this.currentCategory = category;
        const searchInput = document.getElementById('searchInput');
        this.filterRecipes(searchInput ? searchInput.value : '');
    }

    applyAdvancedFilters() {
        const difficulty = document.getElementById('difficultyFilter')?.value || 'all';
        const maxTime = document.getElementById('timeFilter')?.value || 'all';
        const maxCalories = document.getElementById('caloriesFilter')?.value || 'all';
        
        let filtered = [...this.filteredRecipes];
        
        if (difficulty !== 'all') {
            filtered = filtered.filter(recipe => recipe.difficulty === difficulty);
        }
        
        if (maxTime !== 'all') {
            filtered = filtered.filter(recipe => recipe.prepTime <= parseInt(maxTime));
        }
        
        if (maxCalories !== 'all') {
            filtered = filtered.filter(recipe => recipe.calories <= parseInt(maxCalories));
        }
        
        this.filteredRecipes = filtered;
        this.currentPage = 1;
        this.renderRecipes();
        this.updateResultCount();
    }

    sortRecipes(sortBy) {
        let sorted = [...this.filteredRecipes];
        
        switch (sortBy) {
            case 'newest':
                // Since we don't have dates, randomize
                sorted.sort(() => Math.random() - 0.5);
                break;
            case 'calories':
                sorted.sort((a, b) => a.calories - b.calories);
                break;
            case 'time':
                sorted.sort((a, b) => a.prepTime - b.prepTime);
                break;
            case 'rating':
                sorted.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
                break;
            case 'popular':
            default:
                // Default sorting - by rating
                sorted.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
                break;
        }
        
        this.filteredRecipes = sorted;
        this.currentPage = 1;
        this.renderRecipes();
    }

    resetFilters() {
        const difficultyFilter = document.getElementById('difficultyFilter');
        const timeFilter = document.getElementById('timeFilter');
        const caloriesFilter = document.getElementById('caloriesFilter');
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');
        const advancedFilters = document.getElementById('advancedFilters');
        
        if (difficultyFilter) difficultyFilter.value = 'all';
        if (timeFilter) timeFilter.value = 'all';
        if (caloriesFilter) caloriesFilter.value = 'all';
        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'popular';
        if (advancedFilters) advancedFilters.classList.add('hidden');
        
        this.favoritesOnly = false;
        this.currentCategory = 'all';
        
        // Reset category buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const allCategoryBtn = document.querySelector('.filter-btn[data-category="all"]');
        if (allCategoryBtn) allCategoryBtn.classList.add('active');
        
        // Reset favorites button
        const favoritesBtn = document.getElementById('favoritesToggle');
        if (favoritesBtn) {
            favoritesBtn.classList.remove('active');
            favoritesBtn.innerHTML = '<i data-lucide="heart"></i> Favorites';
            this.refreshIcons();
        }
        
        this.filteredRecipes = [...this.recipes];
        this.currentPage = 1;
        this.renderRecipes();
        this.updateResultCount();
        this.showToast('All filters reset', 'info');
    }

    setView(view) {
        this.currentView = view;
        const gridBtn = document.getElementById('gridViewBtn');
        const listBtn = document.getElementById('listViewBtn');
        const recipeList = document.getElementById('recipeList');
        
        if (gridBtn && listBtn && recipeList) {
            if (view === 'grid') {
                gridBtn.classList.add('active');
                listBtn.classList.remove('active');
                recipeList.classList.remove('list-view');
            } else {
                gridBtn.classList.remove('active');
                listBtn.classList.add('active');
                recipeList.classList.add('list-view');
            }
        }
        
        this.renderRecipes();
    }

    renderRecipes() {
        const recipeList = document.getElementById('recipeList');
        if (!recipeList) return;

        const startIndex = (this.currentPage - 1) * this.recipesPerPage;
        const endIndex = startIndex + this.recipesPerPage;
        const recipesToShow = this.filteredRecipes.slice(startIndex, endIndex);
        
        if (recipesToShow.length === 0) {
            this.showEmptyState();
            return;
        }
        
        recipeList.innerHTML = recipesToShow.map(recipe => this.createRecipeCard(recipe)).join('');
        
        // Update load more button visibility
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            const hasMore = endIndex < this.filteredRecipes.length;
            if (hasMore) {
                loadMoreBtn.classList.remove('hidden');
            } else {
                loadMoreBtn.classList.add('hidden');
            }
        }
        
        // Add event listeners to new cards
        this.attachRecipeCardEvents();
        
        // Refresh Lucide icons
        this.refreshIcons();
    }

    createRecipeCard(recipe) {
        const difficultyClass = `difficulty-${recipe.difficulty}`;
        const difficultyText = recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1);
        
        return `
            <div class="recipe-card" data-id="${recipe.id}">
                <div class="recipe-card-img">
                    <img src="${recipe.image}" alt="${recipe.title}" loading="lazy" 
                         onerror="this.src='${this.getFallbackImage()}'">
                    <div class="recipe-card-badge ${difficultyClass}">${difficultyText}</div>
                </div>
                <div class="recipe-card-content">
                    <div class="recipe-card-header">
                        <h3 class="recipe-card-title">${recipe.title}</h3>
                        <!-- Description removed from card for cleaner look -->
                    </div>
                    <div class="recipe-card-meta">
                        <div class="recipe-meta-item">
                            <i data-lucide="clock"></i>
                            <span>${recipe.prepTime} min</span>
                        </div>
                        <div class="recipe-meta-item">
                            <i data-lucide="flame"></i>
                            <span>${recipe.calories} cal</span>
                        </div>
                        <div class="recipe-meta-item">
                            <i data-lucide="users"></i>
                            <span>${recipe.servings} servings</span>
                        </div>
                    </div>
                    <div class="recipe-card-footer">
                        <div class="recipe-rating">
                            <div class="stars">
                                ${this.generateStarRating(parseFloat(recipe.rating))}
                            </div>
                            <span class="rating-value">${recipe.rating}</span>
                        </div>
                        <div class="recipe-actions">
                            <button class="action-btn favorite ${recipe.isFavorite ? 'active' : ''}" 
                                    aria-label="${recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                                <i data-lucide="heart"></i>
                            </button>
                            <button class="action-btn view" aria-label="View recipe details">
                                <i data-lucide="eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateStarRating(rating) {
        let stars = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars += '★';
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars += '½';
            } else {
                stars += '☆';
            }
        }
        
        return stars;
    }

    attachRecipeCardEvents() {
        // Favorite buttons
        document.querySelectorAll('.recipe-card .favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = e.target.closest('.recipe-card');
                const recipeId = card.dataset.id;
                this.toggleFavorite(recipeId, btn);
            });
        });

        // View buttons
        document.querySelectorAll('.recipe-card .view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = e.target.closest('.recipe-card');
                const recipeId = card.dataset.id;
                this.showRecipeDetails(recipeId);
            });
        });

        // Make entire card clickable to view details
        document.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.recipe-actions')) {
                    const recipeId = card.dataset.id;
                    this.showRecipeDetails(recipeId);
                }
            });
        });
    }

    toggleFavorite(recipeId, button) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (recipe) {
            recipe.isFavorite = !recipe.isFavorite;
            
            if (recipe.isFavorite) {
                button.classList.add('active');
                // Update button text in modal if it's the modal favorite button
                if (button.classList.contains('favorite-detail')) {
                    button.innerHTML = '<i data-lucide="heart"></i> Favorited';
                }
                button.setAttribute('aria-label', 'Remove from favorites');
                this.showToast('Recipe added to favorites! ❤️', 'success');
            } else {
                button.classList.remove('active');
                // Update button text in modal if it's the modal favorite button
                if (button.classList.contains('favorite-detail')) {
                    button.innerHTML = '<i data-lucide="heart"></i> Add to Favorites';
                }
                button.setAttribute('aria-label', 'Add to favorites');
                this.showToast('Recipe removed from favorites', 'info');
            }
            
            // Update icon
            const icon = button.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', 'heart');
                this.refreshIcons();
            }
            
            // If we're in favorites-only mode, re-filter
            if (this.favoritesOnly) {
                const searchInput = document.getElementById('searchInput');
                this.filterRecipes(searchInput ? searchInput.value : '');
            }
        }
    }

    showRecipeDetails(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        const modal = document.getElementById('recipeModal');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody) return;

        // Calculate nutrition values
        const protein = Math.floor(recipe.calories * 0.25 / 4);
        const carbs = Math.floor(recipe.calories * 0.45 / 4);
        const fats = Math.floor(recipe.calories * 0.3 / 9);

        modalBody.innerHTML = `
            <div class="recipe-detail">
                <div class="recipe-detail-header">
                    <img src="${recipe.image}" alt="${recipe.title}" class="recipe-detail-img" 
                         onerror="this.src='${this.getFallbackImage()}'">
                    <div class="recipe-detail-info">
                        <h2>${recipe.title}</h2>
                        <p class="recipe-detail-description">${recipe.description}</p>
                        <div class="recipe-detail-meta">
                            <div class="meta-item">
                                <i data-lucide="clock"></i>
                                <span>${recipe.prepTime} minutes</span>
                            </div>
                            <div class="meta-item">
                                <i data-lucide="flame"></i>
                                <span>${recipe.calories} calories</span>
                            </div>
                            <div class="meta-item">
                                <i data-lucide="users"></i>
                                <span>${recipe.servings} servings</span>
                            </div>
                            <div class="meta-item">
                                <i data-lucide="bar-chart-3"></i>
                                <span>${recipe.difficulty}</span>
                            </div>
                        </div>
                        
                        <!-- Nutrition Information -->
                        <div class="modal-nutrition-tracker">
                            <h3>Nutrition Information</h3>
                            <div class="modal-nutrition-grid">
                                <div class="modal-nutrition-item">
                                    <span class="modal-nutrition-value">${recipe.calories}</span>
                                    <span class="modal-nutrition-label">Calories</span>
                                </div>
                                <div class="modal-nutrition-item">
                                    <span class="modal-nutrition-value">${fats}g</span>
                                    <span class="modal-nutrition-label">Fats</span>
                                </div>
                                <div class="modal-nutrition-item">
                                    <span class="modal-nutrition-value">${protein}g</span>
                                    <span class="modal-nutrition-label">Protein</span>
                                </div>
                                <div class="modal-nutrition-item">
                                    <span class="modal-nutrition-value">${carbs}g</span>
                                    <span class="modal-nutrition-label">Carbs</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="recipe-detail-actions">
                            <button class="btn btn-primary" id="cookNowBtn">
                                <i data-lucide="utensils"></i> Cook Now
                            </button>
                            <button class="btn btn-outline favorite-detail ${recipe.isFavorite ? 'active' : ''}">
                                <i data-lucide="heart"></i> ${recipe.isFavorite ? 'Favorited' : 'Add to Favorites'}
                            </button>
                            <button class="btn btn-outline" id="addToPlanDetail">
                                <i data-lucide="calendar"></i> Add to Plan
                            </button>
                            <button class="btn btn-primary" id="addTrackerBtn">
                                <i data-lucide="activity"></i> Track Nutrition
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="recipe-detail-content">
                    <div class="ingredients-section">
                        <h3>Ingredients</h3>
                        <ul class="ingredients-list">
                            ${recipe.ingredients.map(ing => `
                                <li>
                                    <span class="ingredient-measure">${ing.measure}</span>
                                    <span class="ingredient-name">${ing.ingredient}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <div class="instructions-section">
                        <h3>Instructions</h3>
                        <ol class="instructions-list">
                            ${recipe.instructions.map((step, index) => `
                                <li>
                                    <span class="step-number">${index + 1}</span>
                                    <p>${step}</p>
                                </li>
                            `).join('')}
                        </ol>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        
        // Add event listeners for modal buttons
        const favoriteDetailBtn = document.querySelector('.favorite-detail');
        const addToPlanDetailBtn = document.getElementById('addToPlanDetail');
        const cookNowBtn = document.getElementById('cookNowBtn');
        const addTrackerBtn = document.getElementById('addTrackerBtn');
        
        if (favoriteDetailBtn) {
            favoriteDetailBtn.addEventListener('click', () => {
                this.toggleFavorite(recipeId, favoriteDetailBtn);
            });
        }
        
        if (addToPlanDetailBtn) {
            addToPlanDetailBtn.addEventListener('click', () => {
                this.addToMealPlan(recipeId);
            });
        }
        
        if (cookNowBtn) {
            cookNowBtn.addEventListener('click', () => {
                this.showToast('Happy cooking! 🍳', 'success');
                modal.classList.add('hidden');
            });
        }
        
        if (addTrackerBtn) {
            addTrackerBtn.addEventListener('click', () => {
                this.addToNutritionTracker(recipe);
            });
        }
        
        this.refreshIcons();
    }

    addToNutritionTracker(recipe) {
        if (window.nutritionTracker && typeof window.nutritionTracker.addRecipeToTracker === 'function') {
            const entry = window.nutritionTracker.addRecipeToTracker(recipe);
            this.showToast(`Added "${recipe.title}" to nutrition tracker! 📊`, 'success');
            
            // Close modal
            const modal = document.getElementById('recipeModal');
            if (modal) modal.classList.add('hidden');
            
            return entry;
        } else {
            this.showToast('Nutrition tracker not available', 'error');
        }
    }

    addToMealPlan(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if (recipe) {
            this.showDaySelectionModal(recipe);
        }
    }

    showDaySelectionModal(recipe) {
        const modal = document.getElementById('daySelectionModal');
        if (!modal) return;

        modal.classList.remove('hidden');
        
        // Store the current recipe for later use
        this.currentRecipeForPlan = recipe;
        
        // Reset day selection
        document.querySelectorAll('.day-option').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        const confirmBtn = document.getElementById('confirmDaySelection');
        if (confirmBtn) {
            confirmBtn.disabled = true;
        }
        
        // Add event listeners for day selection
        document.querySelectorAll('.day-option').forEach(btn => {
            // Remove existing listeners first
            btn.replaceWith(btn.cloneNode(true));
        });
        
        // Re-query after cloning
        document.querySelectorAll('.day-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.day-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                if (confirmBtn) {
                    confirmBtn.disabled = false;
                }
            });
        });
        
        // Confirm selection
        const confirmHandler = () => {
            const selectedDay = document.querySelector('.day-option.selected')?.dataset.day;
            if (selectedDay && this.currentRecipeForPlan) {
                this.addToMealPlanConfirmed(this.currentRecipeForPlan, selectedDay);
                modal.classList.add('hidden');
            }
        };
        
        // Remove old listener and add new one
        const oldConfirmBtn = document.getElementById('confirmDaySelection');
        const newConfirmBtn = oldConfirmBtn.cloneNode(true);
        oldConfirmBtn.parentNode.replaceChild(newConfirmBtn, oldConfirmBtn);
        newConfirmBtn.addEventListener('click', confirmHandler);
        
        // Cancel selection
        const cancelHandler = () => {
            modal.classList.add('hidden');
            this.currentRecipeForPlan = null;
        };
        
        const cancelBtn = document.getElementById('cancelDaySelectionBtn');
        const cancelModalBtn = document.getElementById('cancelDaySelection');
        
        if (cancelBtn) {
            cancelBtn.onclick = cancelHandler;
        }
        if (cancelModalBtn) {
            cancelModalBtn.onclick = cancelHandler;
        }
        
        this.refreshIcons();
    }

    addToMealPlanConfirmed(recipe, day) {
        // Get existing meal plan from localStorage
        let mealPlan = JSON.parse(localStorage.getItem('mealPlan')) || {};
        
        // Initialize day if it doesn't exist
        if (!mealPlan[day]) {
            mealPlan[day] = [];
        }
        
        // Add recipe to the day
        mealPlan[day].push({
            id: recipe.id,
            title: recipe.title,
            image: recipe.image,
            calories: recipe.calories,
            prepTime: recipe.prepTime,
            addedAt: new Date().toISOString()
        });
        
        // Save back to localStorage
        localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
        
        this.showToast(`"${recipe.title}" added to ${day}! 📅`, 'success');
    }

    async getRandomRecipe() {
        if (this.recipes.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.recipes.length);
            this.showRecipeDetails(this.recipes[randomIndex].id);
        } else {
            this.showToast('No recipes available', 'error');
        }
    }

    loadMoreRecipes() {
        this.currentPage++;
        this.renderRecipes();
        
        // Scroll to new recipes
        setTimeout(() => {
            const recipeList = document.getElementById('recipeList');
            if (recipeList) {
                const newCards = recipeList.querySelectorAll('.recipe-card');
                if (newCards.length > 0) {
                    newCards[0].scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
            }
        }, 100);
    }

    updateResultCount() {
        const resultCount = document.getElementById('resultCount');
        if (resultCount) {
            resultCount.textContent = this.filteredRecipes.length;
        }
    }

    showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');
        const recipeList = document.getElementById('recipeList');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        if (loadingState) loadingState.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        if (recipeList) recipeList.classList.add('hidden');
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
    }

    hideLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const recipeList = document.getElementById('recipeList');
        
        if (loadingState) loadingState.classList.add('hidden');
        if (recipeList) recipeList.classList.remove('hidden');
    }

    showEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const recipeList = document.getElementById('recipeList');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const loadingState = document.getElementById('loadingState');
        
        if (emptyState) emptyState.classList.remove('hidden');
        if (recipeList) recipeList.classList.add('hidden');
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
        if (loadingState) loadingState.classList.add('hidden');
    }

    showToast(message, type = 'info') {
        const toastArea = document.getElementById('toastArea');
        if (!toastArea) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i data-lucide="${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        toastArea.appendChild(toast);
        
        this.refreshIcons();
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        return icons[type] || 'info';
    }

    refreshIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Nutrition Tracker Class
class NutritionTracker {
    constructor() {
        this.dailyGoals = {
            calories: 2000,
            protein: 50,
            carbs: 250,
            fats: 70
        };
        this.todayHistory = [];
        this.loadFromStorage();
        this.initializeTracker();
    }

    loadFromStorage() {
        const savedGoals = localStorage.getItem('nutritionGoals');
        const savedHistory = localStorage.getItem('nutritionHistory');
        
        if (savedGoals) {
            this.dailyGoals = JSON.parse(savedGoals);
        }
        
        if (savedHistory) {
            const history = JSON.parse(savedHistory);
            const today = new Date().toDateString();
            this.todayHistory = history.filter(item => item.date === today);
        }
    }

    saveToStorage() {
        localStorage.setItem('nutritionGoals', JSON.stringify(this.dailyGoals));
        
        let allHistory = JSON.parse(localStorage.getItem('nutritionHistory')) || [];
        const today = new Date().toDateString();
        
        allHistory = allHistory.filter(item => item.date !== today);
        allHistory = [...allHistory, ...this.todayHistory];
        
        localStorage.setItem('nutritionHistory', JSON.stringify(allHistory));
    }

    initializeTracker() {
        this.updateTrackerDisplay();
        this.setupGoalInputs();
    }

    setupGoalInputs() {
        const caloriesGoal = document.getElementById('caloriesGoal');
        const proteinGoal = document.getElementById('proteinGoal');
        const carbsGoal = document.getElementById('carbsGoal');
        const fatsGoal = document.getElementById('fatsGoal');

        if (caloriesGoal) {
            caloriesGoal.addEventListener('change', (e) => {
                this.dailyGoals.calories = parseInt(e.target.value) || 2000;
                this.saveToStorage();
                this.updateTrackerDisplay();
            });
        }

        if (proteinGoal) {
            proteinGoal.addEventListener('change', (e) => {
                this.dailyGoals.protein = parseInt(e.target.value) || 50;
                this.saveToStorage();
                this.updateTrackerDisplay();
            });
        }

        if (carbsGoal) {
            carbsGoal.addEventListener('change', (e) => {
                this.dailyGoals.carbs = parseInt(e.target.value) || 250;
                this.saveToStorage();
                this.updateTrackerDisplay();
            });
        }

        if (fatsGoal) {
            fatsGoal.addEventListener('change', (e) => {
                this.dailyGoals.fats = parseInt(e.target.value) || 70;
                this.saveToStorage();
                this.updateTrackerDisplay();
            });
        }
    }

    addRecipeToTracker(recipe) {
        const nutrition = this.calculateRecipeNutrition(recipe);
        const entry = {
            id: Date.now(),
            name: recipe.title,
            date: new Date().toDateString(),
            timestamp: new Date().toISOString(),
            ...nutrition
        };

        this.todayHistory.push(entry);
        this.saveToStorage();
        this.updateTrackerDisplay();
        
        return entry;
    }

    calculateRecipeNutrition(recipe) {
        return {
            calories: recipe.calories,
            protein: Math.floor(recipe.calories * 0.25 / 4),
            carbs: Math.floor(recipe.calories * 0.45 / 4),
            fats: Math.floor(recipe.calories * 0.3 / 9)
        };
    }

    removeFromTracker(entryId) {
        this.todayHistory = this.todayHistory.filter(entry => entry.id !== entryId);
        this.saveToStorage();
        this.updateTrackerDisplay();
    }

    getTodayTotals() {
        return this.todayHistory.reduce((totals, entry) => {
            totals.calories += entry.calories;
            totals.protein += entry.protein;
            totals.carbs += entry.carbs;
            totals.fats += entry.fats;
            return totals;
        }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
    }

    updateTrackerDisplay() {
        const totals = this.getTodayTotals();
        this.updateSummary(totals);
        this.updateProgressBars(totals);
        this.updateHistoryList();
        this.updateGoalInputs();
    }

    updateSummary(totals) {
        const totalCalories = document.getElementById('totalCalories');
        const totalProtein = document.getElementById('totalProtein');
        const totalCarbs = document.getElementById('totalCarbs');
        const totalFats = document.getElementById('totalFats');

        if (totalCalories) totalCalories.textContent = totals.calories;
        if (totalProtein) totalProtein.textContent = totals.protein + 'g';
        if (totalCarbs) totalCarbs.textContent = totals.carbs + 'g';
        if (totalFats) totalFats.textContent = totals.fats + 'g';
    }

    updateProgressBars(totals) {
        this.updateProgressBar('calories', totals.calories, this.dailyGoals.calories);
        this.updateProgressBar('protein', totals.protein, this.dailyGoals.protein);
        this.updateProgressBar('carbs', totals.carbs, this.dailyGoals.carbs);
        this.updateProgressBar('fats', totals.fats, this.dailyGoals.fats);
    }

    updateProgressBar(type, current, goal) {
        const percentage = Math.min((current / goal) * 100, 100);
        const fillElement = document.querySelector('.nutrition-progress-fill.' + type);
        const statsElement = document.querySelector('.nutrition-progress-stats.' + type);
        
        if (fillElement) {
            fillElement.style.width = percentage + '%';
        }
        
        if (statsElement) {
            const remaining = goal - current;
            statsElement.textContent = current + '/' + goal + ' (' + (remaining > 0 ? remaining : 0) + ' left)';
            
            if (percentage >= 90) {
                statsElement.classList.add('nutrition-warning');
            } else {
                statsElement.classList.remove('nutrition-warning');
            }
            
            if (percentage >= 100) {
                statsElement.classList.add('nutrition-danger');
            } else {
                statsElement.classList.remove('nutrition-danger');
            }
        }
    }

    updateHistoryList() {
        const historyList = document.getElementById('nutritionHistoryList');
        if (!historyList) return;

        if (this.todayHistory.length === 0) {
            historyList.innerHTML = '<div class="nutrition-empty-state"><p>No meals tracked today</p><small>Add recipes to start tracking your nutrition</small></div>';
            return;
        }

        historyList.innerHTML = this.todayHistory.map(entry => `
            <div class="nutrition-history-item">
                <div class="nutrition-history-info">
                    <span class="nutrition-history-name">${entry.name}</span>
                    <span class="nutrition-history-calories">${entry.calories} calories</span>
                </div>
                <div class="nutrition-history-values">
                    <span>P: ${entry.protein}g</span>
                    <span>C: ${entry.carbs}g</span>
                    <span>F: ${entry.fats}g</span>
                </div>
                <button class="nutrition-history-remove" onclick="nutritionTracker.removeFromTracker(${entry.id})">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    updateGoalInputs() {
        const setValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        };

        setValue('caloriesGoal', this.dailyGoals.calories);
        setValue('proteinGoal', this.dailyGoals.protein);
        setValue('carbsGoal', this.dailyGoals.carbs);
        setValue('fatsGoal', this.dailyGoals.fats);
    }

    resetDay() {
        this.todayHistory = [];
        this.saveToStorage();
        this.updateTrackerDisplay();
        this.showToast('Day reset successfully!', 'success');
    }

    showToast(message, type) {
        if (window.recipeManager && typeof window.recipeManager.showToast === 'function') {
            window.recipeManager.showToast(message, type);
        } else {
            console.log(message);
        }
    }
}

// Initialize the RecipeManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Initialize RecipeManager
    window.recipeManager = new RecipeManager();
    
    // Initialize Nutrition Tracker
    window.nutritionTracker = new NutritionTracker();
    
    // Close modals when clicking close button or outside
    const recipeModal = document.getElementById('recipeModal');
    const daySelectionModal = document.getElementById('daySelectionModal');
    const modalClose = document.getElementById('modalClose');
    
    if (modalClose && recipeModal) {
        modalClose.addEventListener('click', () => {
            recipeModal.classList.add('hidden');
        });
    }
    
    if (recipeModal) {
        recipeModal.addEventListener('click', (e) => {
            if (e.target === recipeModal) {
                recipeModal.classList.add('hidden');
            }
        });
    }
    
    if (daySelectionModal) {
        daySelectionModal.addEventListener('click', (e) => {
            if (e.target === daySelectionModal) {
                daySelectionModal.classList.add('hidden');
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const recipeModal = document.getElementById('recipeModal');
            const daySelectionModal = document.getElementById('daySelectionModal');
            
            if (recipeModal) recipeModal.classList.add('hidden');
            if (daySelectionModal) daySelectionModal.classList.add('hidden');
        }
    });
});