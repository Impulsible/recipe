// Recipe Manager class for handling API calls and recipe data
class RecipeManager {
    constructor() {
        this.API_BASE = 'https://api.edamam.com/api/recipes/v2';
        this.APP_ID = '1edd8316';
        this.APP_KEY = 'fff5581f3438a5bcac6ab5e038dda7ae';
        this.MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
        
        this.recipes = [];
        this.filteredRecipes = [];
        this.currentPage = 1;
        this.recipesPerPage = 9; // Changed to 9 for exactly 9 featured recipes
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
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchRecipes(e.target.value);
            }, 300));
        }

        // Favorites toggle
        const favoritesToggle = document.getElementById('favoritesToggle');
        if (favoritesToggle) {
            favoritesToggle.addEventListener('click', () => {
                this.toggleFavoritesView();
            });
        }

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreRecipes();
            });
        }

        // Random recipe button
        const randomBtn = document.getElementById('randomBtnToolbar');
        if (randomBtn) {
            randomBtn.addEventListener('click', () => {
                this.getRandomRecipe();
            });
        }

        // Surprise me button in hero
        const surpriseHero = document.getElementById('surpriseHero');
        if (surpriseHero) {
            surpriseHero.addEventListener('click', () => {
                this.getRandomRecipe();
            });
        }
    }

    // Load recipes from API
    async loadRecipes(query = '') {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();

        try {
            let recipes = [];
            
            if (query) {
                // Search for recipes
                recipes = await this.searchEdamamRecipes(query);
            } else {
                // Load exactly 9 featured recipes
                recipes = await this.getFeaturedRecipes();
            }

            if (this.currentPage === 1) {
                this.recipes = recipes;
            } else {
                this.recipes = [...this.recipes, ...recipes];
            }

            this.filterRecipes();
            this.renderRecipes();
            this.updateRecipeCount();

            // Check if we have more recipes to load
            this.hasMoreRecipes = recipes.length === this.recipesPerPage;

        } catch (error) {
            console.error('Error loading recipes:', error);
            this.showErrorState('Failed to load recipes. Please try again.');
            
            // Fallback to sample recipes
            this.loadSampleRecipes();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    // Search recipes from Edamam API
    async searchEdamamRecipes(query) {
        const url = `${this.API_BASE}?type=public&q=${encodeURIComponent(query)}&app_id=${this.APP_ID}&app_key=${this.APP_KEY}&from=${(this.currentPage - 1) * this.recipesPerPage}&to=${this.currentPage * this.recipesPerPage}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            
            return data.hits.map(hit => this.formatEdamamRecipe(hit.recipe));
        } catch (error) {
            console.error('Edamam API error:', error);
            // Fallback to sample recipes
            return this.getSampleRecipes().slice(0, this.recipesPerPage);
        }
    }

    // Get exactly 9 featured recipes
    async getFeaturedRecipes() {
        try {
            // Try to get recipes from Edamam API
            const queries = ['chicken', 'pasta', 'salad', 'soup', 'vegetarian', 'healthy'];
            const randomQuery = queries[Math.floor(Math.random() * queries.length)];
            const recipes = await this.searchEdamamRecipes(randomQuery);
            
            // Ensure we get exactly 9 recipes
            if (recipes.length >= 9) {
                return recipes.slice(0, 9);
            } else {
                // If we don't have enough recipes, supplement with sample recipes
                const sampleRecipes = this.getSampleRecipes();
                const needed = 9 - recipes.length;
                return [...recipes, ...sampleRecipes.slice(0, needed)];
            }
        } catch (error) {
            console.error('Failed to fetch from Edamam API:', error);
            return this.getSampleRecipes().slice(0, 9);
        }
    }

    // Fallback sample recipes - 9 recipes
    getSampleRecipes() {
        return [
            {
                id: '1',
                title: 'Creamy Garlic Parmesan Pasta',
                image: 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 25,
                servings: 4,
                calories: 420,
                difficulty: 'easy',
                nutritionScore: 'A',
                rating: 4.8,
                ingredients: ['8 oz pasta', '4 cloves garlic, minced', '1 cup grated parmesan cheese', '1 cup heavy cream', '2 tbsp butter', '2 tbsp fresh parsley, chopped', '1/2 tsp black pepper', '1 tsp salt'],
                instructions: [
                    'Cook pasta according to package instructions in salted water until al dente.',
                    'While pasta cooks, melt butter in a large pan over medium heat.',
                    'Add minced garlic and sauté for 1-2 minutes until fragrant.',
                    'Pour in heavy cream and bring to a gentle simmer.',
                    'Gradually whisk in grated parmesan until the sauce is smooth and creamy.',
                    'Drain pasta, reserving 1/2 cup of pasta water.',
                    'Add pasta to the sauce, tossing to coat. Add pasta water as needed to reach desired consistency.',
                    'Season with salt and black pepper to taste.',
                    'Garnish with fresh parsley and extra parmesan before serving.'
                ],
                cuisineType: 'Italian',
                mealType: 'Dinner',
                tags: ['vegetarian', 'comfort-food', 'quick'],
                description: 'A rich and creamy pasta dish that comes together in under 30 minutes. Perfect for busy weeknights.'
            },
            {
                id: '2',
                title: 'Mediterranean Quinoa Bowl',
                image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 20,
                servings: 2,
                calories: 380,
                difficulty: 'easy',
                nutritionScore: 'A+',
                rating: 4.6,
                ingredients: ['1 cup quinoa', '2 cups vegetable broth', '1 cucumber, diced', '1 cup cherry tomatoes, halved', '1/2 red onion, diced', '1/2 cup feta cheese, crumbled', '1/4 cup kalamata olives', '2 tbsp olive oil', '1 lemon, juiced'],
                instructions: [
                    'Rinse quinoa under cold water until water runs clear.',
                    'Cook quinoa in vegetable broth according to package instructions.',
                    'While quinoa cooks, prepare vegetables and make dressing.',
                    'Whisk together olive oil, lemon juice, salt, and pepper for dressing.',
                    'Fluff cooked quinoa with a fork and let cool slightly.',
                    'Combine quinoa with vegetables in a large bowl.',
                    'Add dressing and toss to combine.',
                    'Top with crumbled feta cheese and serve.'
                ],
                cuisineType: 'Mediterranean',
                mealType: 'Lunch',
                tags: ['vegetarian', 'healthy', 'gluten-free'],
                description: 'A fresh and nutritious bowl packed with Mediterranean flavors and protein-rich quinoa.'
            },
            {
                id: '3',
                title: 'Classic Beef Burger',
                image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 30,
                servings: 4,
                calories: 560,
                difficulty: 'medium',
                nutritionScore: 'B',
                rating: 4.7,
                ingredients: ['1 lb ground beef (80/20)', '4 burger buns', '4 slices cheese', '1 onion, sliced', '1 tomato, sliced', 'Lettuce leaves', '2 tbsp burger seasoning', '1 tbsp oil'],
                instructions: [
                    'Divide ground beef into 4 equal portions and form into patties.',
                    'Season both sides of patties with burger seasoning.',
                    'Heat oil in a grill pan or skillet over medium-high heat.',
                    'Cook patties for 4-5 minutes per side for medium doneness.',
                    'Add cheese slices during the last minute of cooking.',
                    'Toast burger buns lightly.',
                    'Assemble burgers with lettuce, tomato, onion, and your favorite condiments.',
                    'Serve immediately with fries or salad.'
                ],
                cuisineType: 'American',
                mealType: 'Dinner',
                tags: ['beef', 'comfort-food', 'grilled'],
                description: 'Juicy, flavorful beef burgers that are perfect for weekend barbecues or weeknight dinners.'
            },
            {
                id: '4',
                title: 'Thai Green Curry',
                image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 35,
                servings: 4,
                calories: 320,
                difficulty: 'medium',
                nutritionScore: 'A',
                rating: 4.5,
                ingredients: ['2 tbsp green curry paste', '1 can coconut milk', '1 lb chicken breast, sliced', '1 eggplant, cubed', '1 bell pepper, sliced', '1 tbsp fish sauce', '1 tbsp palm sugar', 'Thai basil leaves'],
                instructions: [
                    'Heat 2 tbsp of coconut milk in a wok over medium heat.',
                    'Add green curry paste and fry until fragrant.',
                    'Add chicken and cook until no longer pink.',
                    'Add remaining coconut milk and bring to a simmer.',
                    'Add vegetables and cook until tender.',
                    'Season with fish sauce and palm sugar.',
                    'Garnish with Thai basil and serve with rice.'
                ],
                cuisineType: 'Thai',
                mealType: 'Dinner',
                tags: ['thai', 'spicy', 'curry'],
                description: 'Aromatic and spicy Thai green curry with tender chicken and fresh vegetables.'
            },
            {
                id: '5',
                title: 'Avocado Toast with Poached Egg',
                image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 15,
                servings: 2,
                calories: 280,
                difficulty: 'easy',
                nutritionScore: 'A+',
                rating: 4.4,
                ingredients: ['2 slices sourdough bread', '1 ripe avocado', '2 eggs', '1 tbsp lemon juice', 'Red pepper flakes', 'Salt and pepper to taste'],
                instructions: [
                    'Toast sourdough bread until golden and crispy.',
                    'Mash avocado with lemon juice, salt, and pepper.',
                    'Poach eggs in simmering water for 3-4 minutes.',
                    'Spread avocado mixture on toast.',
                    'Top with poached egg and red pepper flakes.',
                    'Serve immediately.'
                ],
                cuisineType: 'International',
                mealType: 'Breakfast',
                tags: ['vegetarian', 'healthy', 'quick'],
                description: 'A modern breakfast classic featuring creamy avocado and perfectly poached eggs.'
            },
            {
                id: '6',
                title: 'Chocolate Chip Cookies',
                image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 45,
                servings: 24,
                calories: 180,
                difficulty: 'easy',
                nutritionScore: 'C',
                rating: 4.9,
                ingredients: ['2 1/4 cups flour', '1 tsp baking soda', '1 tsp salt', '1 cup butter, softened', '3/4 cup brown sugar', '3/4 cup white sugar', '2 eggs', '2 tsp vanilla', '2 cups chocolate chips'],
                instructions: [
                    'Preheat oven to 375°F (190°C).',
                    'Mix flour, baking soda, and salt in a bowl.',
                    'Cream butter and sugars until light and fluffy.',
                    'Beat in eggs one at a time, then add vanilla.',
                    'Gradually mix in flour mixture.',
                    'Stir in chocolate chips.',
                    'Drop rounded tablespoons onto baking sheets.',
                    'Bake for 9-11 minutes until golden brown.',
                    'Cool on wire racks.'
                ],
                cuisineType: 'American',
                mealType: 'Dessert',
                tags: ['dessert', 'baking', 'sweet'],
                description: 'Classic chocolate chip cookies that are crispy on the edges and chewy in the middle.'
            },
            {
                id: '7',
                title: 'Vegetable Stir Fry',
                image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 20,
                servings: 3,
                calories: 280,
                difficulty: 'easy',
                nutritionScore: 'A+',
                rating: 4.3,
                ingredients: ['2 cups mixed vegetables', '1 tbsp ginger, minced', '2 cloves garlic, minced', '2 tbsp soy sauce', '1 tbsp sesame oil', '1 tsp rice vinegar', '1 tsp honey', '2 tbsp vegetable oil'],
                instructions: [
                    'Heat vegetable oil in a wok over high heat.',
                    'Add ginger and garlic, stir-fry for 30 seconds.',
                    'Add mixed vegetables and stir-fry for 4-5 minutes.',
                    'Mix soy sauce, sesame oil, rice vinegar, and honey.',
                    'Pour sauce over vegetables and toss to coat.',
                    'Cook for another 2 minutes until vegetables are tender-crisp.',
                    'Serve immediately with rice.'
                ],
                cuisineType: 'Asian',
                mealType: 'Lunch',
                tags: ['vegetarian', 'healthy', 'quick'],
                description: 'A quick and healthy vegetable stir fry packed with flavor and nutrients.'
            },
            {
                id: '8',
                title: 'Greek Salad',
                image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 15,
                servings: 2,
                calories: 220,
                difficulty: 'easy',
                nutritionScore: 'A+',
                rating: 4.5,
                ingredients: ['1 cucumber, diced', '2 tomatoes, chopped', '1/2 red onion, sliced', '1/2 cup feta cheese, cubed', '1/4 cup kalamata olives', '2 tbsp olive oil', '1 tbsp red wine vinegar', '1 tsp dried oregano'],
                instructions: [
                    'Combine cucumber, tomatoes, red onion, feta cheese, and olives in a large bowl.',
                    'Whisk together olive oil, red wine vinegar, and oregano for the dressing.',
                    'Pour dressing over the salad and toss gently.',
                    'Season with salt and pepper to taste.',
                    'Let sit for 5 minutes before serving to allow flavors to meld.'
                ],
                cuisineType: 'Mediterranean',
                mealType: 'Lunch',
                tags: ['vegetarian', 'healthy', 'fresh'],
                description: 'A refreshing Greek salad with crisp vegetables, tangy feta, and briny olives.'
            },
            {
                id: '9',
                title: 'Berry Smoothie Bowl',
                image: 'https://images.unsplash.com/photo-1494597564530-871f2b93ac55?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 10,
                servings: 1,
                calories: 320,
                difficulty: 'easy',
                nutritionScore: 'A+',
                rating: 4.7,
                ingredients: ['1 cup mixed berries (frozen)', '1 banana', '1/2 cup Greek yogurt', '2 tbsp almond milk', '1 tbsp honey', '2 tbsp granola', '1 tbsp chia seeds', 'Fresh berries for topping'],
                instructions: [
                    'Combine frozen berries, banana, Greek yogurt, almond milk, and honey in a blender.',
                    'Blend until smooth and creamy.',
                    'Pour the smoothie into a bowl.',
                    'Top with granola, chia seeds, and fresh berries.',
                    'Serve immediately and enjoy your nutritious breakfast!'
                ],
                cuisineType: 'International',
                mealType: 'Breakfast',
                tags: ['vegetarian', 'healthy', 'quick'],
                description: 'A vibrant and nutritious smoothie bowl packed with antioxidants and protein.'
            }
        ];
    }

    // Format recipe from Edamam API
    formatEdamamRecipe(recipe) {
        return {
            id: recipe.uri?.split('#')[1] || Math.random().toString(36).substr(2, 9),
            title: recipe.label,
            image: recipe.image,
            readyInMinutes: Math.round(recipe.totalTime) || 30,
            servings: recipe.yield || 4,
            calories: Math.round(recipe.calories / (recipe.yield || 1)),
            difficulty: this.getDifficultyLevel(Math.round(recipe.totalTime) || 30, recipe.ingredients?.length || 0),
            nutritionScore: this.calculateNutritionScore(recipe),
            rating: (Math.random() * 1 + 4).toFixed(1), // Random rating between 4.0 and 5.0
            ingredients: recipe.ingredientLines || [],
            instructions: recipe.ingredientLines || [], // Edamam doesn't provide instructions
            cuisineType: recipe.cuisineType?.[0] || 'International',
            mealType: recipe.mealType?.[0] || 'Main course',
            tags: (recipe.dietLabels || []).concat(recipe.healthLabels || []).slice(0, 3),
            source: recipe.source,
            url: recipe.url,
            description: 'A delicious recipe loaded with flavor and nutrition.'
        };
    }

    getDifficultyLevel(time, ingredientsCount) {
        if (time <= 20 && ingredientsCount <= 5) return 'easy';
        if (time <= 45 && ingredientsCount <= 10) return 'medium';
        return 'hard';
    }

    calculateNutritionScore(recipe) {
        const nutrients = recipe.totalNutrients || {};
        let score = 100;
        
        // Simple scoring based on fat, sugar, and protein
        if (nutrients.FAT && nutrients.FAT.quantity > 50) score -= 20;
        if (nutrients.SUGAR && nutrients.SUGAR.quantity > 25) score -= 15;
        if (nutrients.PROCNT && nutrients.PROCNT.quantity > 20) score += 10;
        
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        return 'D';
    }

    // Utility methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showLoadingState() {
        const recipeList = document.getElementById('recipeList');
        if (recipeList) {
            recipeList.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <div class="loading mx-auto mb-4"></div>
                    <p class="text-gray-500">Loading delicious recipes...</p>
                </div>
            `;
        }
    }

    hideLoadingState() {
        // Loading state is removed when recipes are rendered
    }

    showErrorState(message) {
        const recipeList = document.getElementById('recipeList');
        if (recipeList) {
            recipeList.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <i data-lucide="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-4"></i>
                    <div class="text-red-500 mb-4">${message}</div>
                    <button onclick="window.spoonfullApp.recipeManager.loadRecipes()" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                        Try Again
                    </button>
                </div>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    filterRecipes() {
        if (this.favoritesOnly) {
            const favorites = JSON.parse(localStorage.getItem('spoonfull_favorites') || '[]');
            this.filteredRecipes = this.recipes.filter(recipe => 
                favorites.some(fav => fav.id === recipe.id)
            );
        } else {
            this.filteredRecipes = [...this.recipes];
        }
    }

    renderRecipes() {
        const recipeList = document.getElementById('recipeList');
        if (!recipeList) return;

        if (this.filteredRecipes.length === 0) {
            recipeList.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <i data-lucide="search" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                    <p class="text-gray-500">No recipes found. Try a different search.</p>
                </div>
            `;
            return;
        }

        recipeList.innerHTML = this.filteredRecipes.map(recipe => {
            const favorites = JSON.parse(localStorage.getItem('spoonfull_favorites') || '[]');
            const isFavorite = favorites.some(fav => fav.id === recipe.id);

            return `
                <div class="recipe-card">
                    <div class="relative">
                        <img src="${recipe.image}" alt="${recipe.title}" class="w-full h-48 object-cover cursor-pointer" onclick="showRecipeDetails('${recipe.id}')">
                        <div class="absolute top-3 right-3 flex gap-1">
                            <button class="action-btn favorite ${isFavorite ? 'active' : ''} p-2 rounded-lg bg-white/90 backdrop-blur shadow-sm" 
                                    onclick="toggleFavorite('${recipe.id}')">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                            </button>
                            <button class="action-btn p-2 rounded-lg bg-white/90 backdrop-blur shadow-sm"
                                    onclick="addToPlan('${recipe.id}')">
                                <i data-lucide="calendar-plus" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    <div class="p-4">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-semibold text-lg flex-1 cursor-pointer hover:text-emerald-600 transition-colors" onclick="showRecipeDetails('${recipe.id}')">${recipe.title}</h3>
                            <span class="nutrition-score px-2 py-1 rounded-full text-xs text-white ml-2">${recipe.nutritionScore}</span>
                        </div>
                        <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <span class="flex items-center gap-1">
                                <i data-lucide="clock" class="w-4 h-4"></i>
                                ${recipe.readyInMinutes} min
                            </span>
                            <span class="flex items-center gap-1">
                                <i data-lucide="users" class="w-4 h-4"></i>
                                ${recipe.servings}
                            </span>
                            <span class="difficulty-badge px-2 py-1 rounded-full text-xs text-white ${recipe.difficulty === 'easy' ? 'difficulty-easy' : recipe.difficulty === 'medium' ? 'difficulty-medium' : 'difficulty-hard'}">
                                ${recipe.difficulty}
                            </span>
                        </div>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">${recipe.description}</p>
                        <div class="recipe-tags flex flex-wrap gap-1">
                            ${recipe.tags.slice(0, 3).map(tag => `
                                <span class="tag px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">${tag}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    updateRecipeCount() {
        const resultCount = document.getElementById('resultCount');
        if (resultCount) {
            resultCount.textContent = this.filteredRecipes.length;
        }
    }

    // Favorite functionality
    toggleFavorite(recipeId) {
        const favorites = JSON.parse(localStorage.getItem('spoonfull_favorites') || '[]');
        const recipe = this.recipes.find(r => r.id === recipeId);
        
        if (!recipe) return;

        const existingIndex = favorites.findIndex(fav => fav.id === recipeId);
        
        if (existingIndex > -1) {
            // Remove from favorites
            favorites.splice(existingIndex, 1);
        } else {
            // Add to favorites
            favorites.push(recipe);
        }
        
        localStorage.setItem('spoonfull_favorites', JSON.stringify(favorites));
        this.renderRecipes();
        
        // Update dashboard stats
        if (window.spoonfullApp) {
            window.spoonfullApp.updateStats();
        }
    }

    // Load more recipes
    loadMoreRecipes() {
        this.currentPage++;
        this.loadRecipes(this.searchQuery);
    }

    // Search functionality
    searchRecipes(query) {
        this.currentPage = 1;
        this.searchQuery = query;
        this.loadRecipes(query);
    }

    // Toggle favorites view
    toggleFavoritesView() {
        this.favoritesOnly = !this.favoritesOnly;
        this.filterRecipes();
        this.renderRecipes();
        this.updateRecipeCount();
    }

    // Random recipe functionality
    getRandomRecipe() {
        if (this.recipes.length === 0) {
            if (window.spoonfullApp) {
                window.spoonfullApp.showNotification('Please wait while recipes are loading...', 'info');
            }
            return;
        }
        
        const randomRecipe = this.recipes[Math.floor(Math.random() * this.recipes.length)];
        if (window.spoonfullApp) {
            window.spoonfullApp.showRecipeModal(randomRecipe);
        }
    }

    // Fallback method
    loadSampleRecipes() {
        this.recipes = this.getSampleRecipes();
        this.filterRecipes();
        this.renderRecipes();
        this.updateRecipeCount();
    }
}





// dashboard.js - Enhanced Dashboard Functionality with API Integration
const spoonfullApp = {
    // Initialize the dashboard
    init: function() {
        this.initQuickActions();
        this.initGoals();
        this.initWeather();
        this.initSeasonal();
        this.initRecommendations();
        this.updateDashboardStats();
        this.setupEventListeners();
        console.log('Dashboard initialized');
    },

    // Quick Actions functionality
    initQuickActions: function() {
        const quickTips = [
            "Plan 3 meals ahead to save time!",
            "Prep ingredients on Sunday for easier weekdays",
            "Try batch cooking for busy weeks",
            "Use seasonal ingredients for better flavor",
            "Don't forget to hydrate while cooking!"
        ];
        
        // Set random tip
        const randomTip = quickTips[Math.floor(Math.random() * quickTips.length)];
        const quickTipElement = document.getElementById('quickTip');
        if (quickTipElement) {
            quickTipElement.textContent = randomTip;
        }
    },

    // Goals functionality
    initGoals: function() {
        // Initialize goals functionality
        this.setupGoalClickHandlers();
    },

    setupGoalClickHandlers: function() {
        const goalCheckboxes = document.querySelectorAll('.goal-checkbox');
        
        goalCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('click', function() {
                const goalItem = this.closest('.goal-item');
                if (goalItem) {
                    goalItem.classList.toggle('completed');
                    this.classList.toggle('completed');
                    
                    // Update goals progress
                    spoonfullApp.updateGoalsProgress();
                }
            });
        });
    },

    updateGoalsProgress: function() {
        const completedGoals = document.querySelectorAll('.goal-item.completed').length;
        const totalGoals = document.querySelectorAll('.goal-item').length;
        const progressElement = document.getElementById('goalsProgress');
        
        if (progressElement) {
            progressElement.textContent = `${completedGoals}/${totalGoals} completed`;
        }
    },

    // Weather functionality
    initWeather: function() {
        // Mock weather data
        const weatherData = {
            temp: this.getRandomTemp(),
            description: this.getWeatherDescription(),
            icon: this.getWeatherIcon(),
            goldenHour: this.getGoldenHour()
        };

        this.updateWeatherDisplay(weatherData);
    },

    getRandomTemp: function() {
        const temps = [22, 23, 24, 25, 26, 27];
        return temps[Math.floor(Math.random() * temps.length)];
    },

    getWeatherDescription: function() {
        const descriptions = [
            "Perfect for indoor cooking!",
            "Great day for trying new recipes",
            "Ideal weather for meal prep",
            "Comfort food weather",
            "Perfect for baking"
        ];
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    },

    getWeatherIcon: function() {
        const icons = ["🌤️", "☀️", "⛅", "🌥️", "🌦️"];
        return icons[Math.floor(Math.random() * icons.length)];
    },

    getGoldenHour: function() {
        const times = ["6:15 PM", "6:30 PM", "6:45 PM", "7:00 PM"];
        return times[Math.floor(Math.random() * times.length)];
    },

    updateWeatherDisplay: function(weather) {
        const weatherTemp = document.getElementById('weatherTemp');
        const weatherDescription = document.getElementById('weatherDescription');
        const weatherIcon = document.getElementById('weatherIcon');
        
        if (weatherTemp) weatherTemp.textContent = `${weather.temp}°C`;
        if (weatherDescription) weatherDescription.textContent = weather.description;
        if (weatherIcon) weatherIcon.textContent = weather.icon;
    },

    // Seasonal functionality
    initSeasonal: function() {
        const seasonalRecipes = [
            { name: "Pumpkin Spice Delights", emoji: "🎃", description: "Perfect autumn recipes featuring seasonal ingredients" },
            { name: "Berry Fresh Smoothies", emoji: "🍓", description: "Refreshing summer berry recipes" },
            { name: "Comfort Soups", emoji: "🍲", description: "Warm and hearty winter soups" },
            { name: "Spring Salads", emoji: "🥗", description: "Fresh spring greens and vegetables" }
        ];

        const currentSeason = this.getCurrentSeason();
        const seasonalRecipe = seasonalRecipes.find(recipe => 
            recipe.name.toLowerCase().includes(currentSeason)
        ) || seasonalRecipes[0];

        this.updateSeasonalDisplay(seasonalRecipe);
    },

    getCurrentSeason: function() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    },

    updateSeasonalDisplay: function(recipe) {
        const seasonalRecipeElement = document.getElementById('seasonalRecipe');
        if (seasonalRecipeElement) {
            seasonalRecipeElement.textContent = recipe.name;
        }
    },

    // Recommendations functionality with API Integration
    initRecommendations: function() {
        this.setupRecommendationClickHandlers();
    },

    setupRecommendationClickHandlers: function() {
        console.log('Setting up recommendation click handlers...');
        
        // Health Boost Card
        const healthBoostCard = document.getElementById('healthBoostCard');
        if (healthBoostCard) {
            console.log('Health Boost card found, adding click handler');
            healthBoostCard.addEventListener('click', () => {
                console.log('Health Boost card clicked');
                this.fetchRandomRecommendationRecipes('Health Boost');
            });
            
            // Add visual feedback
            healthBoostCard.style.cursor = 'pointer';
            healthBoostCard.classList.add('hover:scale-105', 'transition-transform');
        } else {
            console.log('Health Boost card NOT found');
        }

        // Time Saver Card
        const timeSaverCard = document.getElementById('timeSaverCard');
        if (timeSaverCard) {
            console.log('Time Saver card found, adding click handler');
            timeSaverCard.addEventListener('click', () => {
                console.log('Time Saver card clicked');
                this.fetchRandomRecommendationRecipes('Time Saver');
            });
            
            // Add visual feedback
            timeSaverCard.style.cursor = 'pointer';
            timeSaverCard.classList.add('hover:scale-105', 'transition-transform');
        } else {
            console.log('Time Saver card NOT found');
        }

        // Weather Card - Check if it exists in your HTML
        const weatherCard = document.getElementById('weatherCard');
        if (weatherCard) {
            weatherCard.addEventListener('click', () => {
                this.fetchRandomRecommendationRecipes('Weather Inspired');
            });
            weatherCard.style.cursor = 'pointer';
        }

        // Seasonal Card - Check if it exists in your HTML
        const seasonalCard = document.getElementById('seasonalCard');
        if (seasonalCard) {
            seasonalCard.addEventListener('click', () => {
                this.fetchRandomRecommendationRecipes('Seasonal');
            });
            seasonalCard.style.cursor = 'pointer';
        }
    },

    // Fetch RANDOM recipes from Edamam API based on recommendation type
    async fetchRandomRecommendationRecipes(type) {
        console.log(`Fetching random ${type} recipes`);
        
        // Show catchy loading message based on type
        const loadingMessages = {
            'Health Boost': [
                "🥗 Whipping up protein-packed delights...",
                "💪 Fueling your fitness journey...",
                "🌟 Curating nutritious masterpieces...",
                "🍗 Gathering muscle-building recipes...",
                "🥑 Selecting energy-boosting meals...",
                "🔥 Preparing power-packed creations..."
            ],
            'Time Saver': [
                "⚡ Speeding through quick recipes...",
                "⏰ Racing against the clock for you...",
                "🚀 Launching instant meal ideas...",
                "🎯 Targeting 15-minute wonders...",
                "💨 Quick-drawing delicious solutions...",
                "🏃‍♂️ Sprinting to fast food perfection..."
            ]
        };

        const messages = loadingMessages[type] || ["✨ Curating delicious recipes..."];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.showToast(randomMessage, 'info');
        
        try {
            // Different search queries for each type to get variety
            const searchQueries = {
                'Health Boost': [
                    'high-protein chicken', 'protein vegetarian', 'healthy fish recipes',
                    'lean meat recipes', 'protein packed meals', 'nutritious meals',
                    'balanced diet recipes', 'muscle building food', 'energy boosting meals'
                ],
                'Time Saver': [
                    'quick 15-minute', 'easy fast recipes', 'simple quick meals',
                    'under 30 minutes', 'fast dinner ideas', 'quick lunch recipes',
                    'speedy meals', 'fast cooking', 'quick prep meals'
                ]
            };

            // Get a random search query for the type
            const queries = searchQueries[type] || ['healthy recipes'];
            const randomQuery = queries[Math.floor(Math.random() * queries.length)];
            
            console.log(`Using random query: ${randomQuery} for ${type}`);

            const API_BASE = 'https://api.edamam.com/api/recipes/v2';
            const APP_ID = '1edd8316';
            const APP_KEY = 'fff5581f3438a5bcac6ab5e038dda7ae';
            
            // Fetch more recipes than needed so we can randomize the selection
            const url = `${API_BASE}?type=public&q=${encodeURIComponent(randomQuery)}&app_id=${APP_ID}&app_key=${APP_KEY}&from=0&to=20`;
            
            console.log('Making API request to:', url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API request failed with status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API response received:', data);
            
            if (data.hits && data.hits.length > 0) {
                // Randomize the recipes and take exactly 9
                const allRecipes = data.hits.map(hit => this.formatEdamamRecipe(hit.recipe));
                const randomizedRecipes = this.shuffleArray(allRecipes).slice(0, 9);
                
                console.log(`Found ${allRecipes.length} recipes, showing 9 randomized`);
                
                // Show catchy success message
                const successMessages = {
                    'Health Boost': [
                        "💪 Power-packed recipes served!",
                        "🥗 Nutrient boost activated!",
                        "🌟 Healthy delights ready!",
                        "🍗 Protein paradise unlocked!",
                        "🔥 Energy meals loaded!"
                    ],
                    'Time Saver': [
                        "⚡ Quick recipes delivered!",
                        "⏰ Time-saving meals ready!",
                        "🚀 Fast food, made fancy!",
                        "🎯 Speedy solutions served!",
                        "💨 Quick wins on your plate!"
                    ]
                };

                const successMsg = successMessages[type] || ["✨ Delicious recipes ready!"];
                const randomSuccessMsg = successMsg[Math.floor(Math.random() * successMsg.length)];
                
                this.displayRecommendationResults(randomizedRecipes, type, randomSuccessMsg);
            } else {
                console.log('No recipes found in API response');
                this.showToast("🌟 Whipping up some tasty alternatives...", 'warning');
                this.loadRandomSampleRecipes(type);
            }

        } catch (error) {
            console.error('Error fetching recommendation recipes:', error);
            this.showToast("👨‍🍳 Our chefs are preparing something special...", 'warning');
            this.loadRandomSampleRecipes(type);
        }
    },

    // Utility function to shuffle array (Fisher-Yates algorithm)
    shuffleArray: function(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    formatEdamamRecipe: function(recipe) {
        return {
            id: recipe.uri?.split('#')[1] || Math.random().toString(36).substr(2, 9),
            title: recipe.label,
            image: recipe.image,
            readyInMinutes: Math.round(recipe.totalTime) || 30,
            servings: recipe.yield || 4,
            calories: Math.round(recipe.calories / (recipe.yield || 1)),
            difficulty: this.getDifficultyLevel(Math.round(recipe.totalTime) || 30, recipe.ingredients?.length || 0),
            nutritionScore: this.calculateNutritionScore(recipe),
            rating: (Math.random() * 1 + 4).toFixed(1),
            ingredients: recipe.ingredientLines || [],
            instructions: recipe.ingredientLines || ['No instructions available from API'],
            cuisineType: recipe.cuisineType?.[0] || 'International',
            mealType: recipe.mealType?.[0] || 'Main course',
            tags: (recipe.dietLabels || []).concat(recipe.healthLabels || []).slice(0, 3),
            source: recipe.source,
            url: recipe.url,
            description: recipe.label || 'A delicious recipe loaded with flavor and nutrition.'
        };
    },

    getDifficultyLevel: function(time, ingredientsCount) {
        if (time <= 20 && ingredientsCount <= 5) return 'easy';
        if (time <= 45 && ingredientsCount <= 10) return 'medium';
        return 'hard';
    },

    calculateNutritionScore: function(recipe) {
        const nutrients = recipe.totalNutrients || {};
        let score = 100;
        
        if (nutrients.FAT && nutrients.FAT.quantity > 50) score -= 20;
        if (nutrients.SUGAR && nutrients.SUGAR.quantity > 25) score -= 15;
        if (nutrients.PROCNT && nutrients.PROCNT.quantity > 20) score += 10;
        
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        return 'D';
    },

    displayRecommendationResults: function(recipes, type, successMessage) {
        console.log(`Displaying ${recipes.length} ${type} recipes`);
        
        // Update the recipe manager with the new recipes
        if (window.spoonfullApp && window.spoonfullApp.recipeManager) {
            window.spoonfullApp.recipeManager.recipes = recipes;
            window.spoonfullApp.recipeManager.filteredRecipes = recipes;
            window.spoonfullApp.recipeManager.currentPage = 1;
            window.spoonfullApp.recipeManager.favoritesOnly = false;
            
            // Render the recipes
            window.spoonfullApp.recipeManager.renderRecipes();
            window.spoonfullApp.recipeManager.updateRecipeCount();
            
            // Update the result count to show we're viewing recommendations
            const resultCount = document.getElementById('resultCount');
            if (resultCount) {
                resultCount.textContent = recipes.length;
            }
            
            // Update the section title
            const sectionTitle = document.querySelector('#featured-recipes h2');
            if (sectionTitle) {
                sectionTitle.innerHTML = `${type} Recipes (<span id="resultCount">${recipes.length}</span>)`;
            }
            
            // Update the section description
            const sectionDescription = document.querySelector('#featured-recipes p');
            if (sectionDescription) {
                const descriptions = {
                    'Health Boost': 'Protein-packed recipes to fuel your healthy lifestyle',
                    'Time Saver': 'Quick & easy meals for your busy schedule'
                };
                sectionDescription.textContent = descriptions[type] || `Randomized ${type.toLowerCase()} recipes for your cooking inspiration`;
            }
            
            // Show success message
            if (successMessage) {
                this.showToast(successMessage, 'success');
            } else {
                const defaultMessages = {
                    'Health Boost': "💪 Power-packed recipes served!",
                    'Time Saver': "⚡ Quick recipes delivered!"
                };
                this.showToast(defaultMessages[type] || "✨ Delicious recipes ready!", 'success');
            }
            
            // Scroll to recipes section
            setTimeout(() => {
                const featuredRecipes = document.getElementById('featured-recipes');
                if (featuredRecipes) {
                    featuredRecipes.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 500);
            
        } else {
            console.error('Recipe manager not found');
            this.showToast('👨‍🍳 Our kitchen needs a quick restart...', 'error');
        }
    },

    loadRandomSampleRecipes: function(type) {
        console.log(`Loading random sample recipes for ${type}`);
        
        // Show catchy fallback message
        const fallbackMessages = {
            'Health Boost': "🌟 Whipping up nutritious alternatives...",
            'Time Saver': "⚡ Preparing quick backup recipes..."
        };
        
        this.showToast(fallbackMessages[type] || "👨‍🍳 Preparing something special...", 'info');

        // Sample recipes array
        const allSampleRecipes = [
            // Health Boost Recipes
            {
                id: 'health-1',
                title: 'Grilled Chicken Salad',
                image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 20,
                servings: 2,
                calories: 320,
                difficulty: 'easy',
                nutritionScore: 'A+',
                rating: 4.5,
                ingredients: ['2 chicken breasts', '4 cups mixed greens', '1 cucumber', '1 avocado', '2 tbsp olive oil', '1 lemon'],
                instructions: ['Grill chicken until cooked through', 'Chop vegetables', 'Mix with dressing', 'Serve fresh'],
                tags: ['high-protein', 'healthy', 'salad'],
                description: 'A protein-packed salad perfect for a healthy meal.'
            },
            {
                id: 'health-2',
                title: 'Quinoa Power Bowl',
                image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 25,
                servings: 2,
                calories: 380,
                difficulty: 'easy',
                nutritionScore: 'A+',
                rating: 4.6,
                ingredients: ['1 cup quinoa', '2 cups vegetable broth', '1 cup chickpeas', '1 avocado', '2 tbsp tahini'],
                instructions: ['Cook quinoa in broth', 'Mix with chickpeas', 'Add avocado and dressing'],
                tags: ['vegetarian', 'high-protein', 'healthy'],
                description: 'Nutrient-dense quinoa bowl with plant-based protein.'
            },
            // Time Saver Recipes
            {
                id: 'time-1',
                title: '15-Minute Stir Fry',
                image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 15,
                servings: 2,
                calories: 280,
                difficulty: 'easy',
                nutritionScore: 'A',
                rating: 4.3,
                ingredients: ['2 cups mixed vegetables', '1 tbsp oil', '2 tbsp soy sauce', '1 tsp ginger', '2 cloves garlic'],
                instructions: ['Heat oil in wok', 'Add vegetables and stir-fry', 'Add sauce and serve'],
                tags: ['quick', 'easy', 'vegetarian'],
                description: 'Quick and delicious stir fry ready in minutes.'
            },
            {
                id: 'time-2',
                title: 'Speedy Avocado Toast',
                image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 10,
                servings: 1,
                calories: 250,
                difficulty: 'easy',
                nutritionScore: 'A',
                rating: 4.4,
                ingredients: ['2 slices bread', '1 avocado', '1 tsp lemon juice', 'Salt and pepper to taste'],
                instructions: ['Toast bread', 'Mash avocado with lemon juice', 'Spread on toast and season'],
                tags: ['quick', 'healthy', 'breakfast'],
                description: 'Simple and nutritious breakfast ready in 10 minutes.'
            }
        ];

        // Filter by type and randomize
        let filteredRecipes = allSampleRecipes;
        
        if (type === 'Health Boost') {
            filteredRecipes = allSampleRecipes.filter(recipe => 
                recipe.tags.some(tag => tag.includes('protein') || tag.includes('healthy'))
            );
        } else if (type === 'Time Saver') {
            filteredRecipes = allSampleRecipes.filter(recipe => 
                recipe.tags.some(tag => tag.includes('quick') || recipe.readyInMinutes <= 20)
            );
        }
        
        // Randomize and take exactly 9 recipes (duplicate if needed for demo)
        let randomizedRecipes = this.shuffleArray(filteredRecipes);
        while (randomizedRecipes.length < 9) {
            randomizedRecipes = randomizedRecipes.concat(randomizedRecipes);
        }
        randomizedRecipes = randomizedRecipes.slice(0, 9);
        
        // Show success message for sample recipes
        const sampleSuccessMessages = {
            'Health Boost': "💪 Backup boosters served!",
            'Time Saver': "⚡ Quick alternatives ready!"
        };
        
        this.displayRecommendationResults(randomizedRecipes, type, sampleSuccessMessages[type]);
    },

    // Dashboard stats
    updateDashboardStats: function() {
        // This would update the stats in the dashboard
        console.log('Updating dashboard stats...');
    },

    // Quick Actions handlers
    quickAddToPlan: function(mealType) {
        const suggestedRecipes = {
            breakfast: ["Overnight Oats", "Avocado Toast", "Smoothie Bowl"],
            lunch: ["Quinoa Salad", "Wrap", "Buddha Bowl"],
            dinner: ["Stir Fry", "Pasta", "Sheet Pan Dinner"]
        };

        const suggestions = suggestedRecipes[mealType];
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        
        this.showToast(`Quick add: ${randomSuggestion} for ${mealType}`, 'success');
    },

    generateShoppingList: function() {
        this.showToast('Shopping list feature coming soon!', 'info');
    },

    // Utility functions
    showToast: function(message, type = 'info') {
        // Remove existing toasts
        document.querySelectorAll('.custom-toast').forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `custom-toast fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300 ${
            type === 'success' ? 'bg-emerald-500' : 
            type === 'warning' ? 'bg-yellow-500' : 
            type === 'error' ? 'bg-red-500' : 
            'bg-blue-500'
        }`;
        toast.textContent = message;
        toast.style.transform = 'translateX(100%)';
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    },

    setupEventListeners: function() {
        // Add any additional event listeners here
        console.log('Setting up event listeners...');
    }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing dashboard...');
    
    // Initialize the dashboard
    spoonfullApp.init();
    
    // Refresh Lucide icons after dynamic content
    if (window.lucide) {
        setTimeout(() => {
            lucide.createIcons();
        }, 100);
    }
});

// Make spoonfullApp available globally
window.spoonfullApp = spoonfullApp;

// Add global click handlers as backup
document.addEventListener('click', function(e) {
    // Health Boost Card
    if (e.target.closest('#healthBoostCard')) {
        console.log('Health Boost card clicked (global handler)');
        if (window.spoonfullApp) {
            window.spoonfullApp.fetchRandomRecommendationRecipes('Health Boost');
        }
    }
    
    // Time Saver Card
    if (e.target.closest('#timeSaverCard')) {
        console.log('Time Saver card clicked (global handler)');
        if (window.spoonfullApp) {
            window.spoonfullApp.fetchRandomRecommendationRecipes('Time Saver');
        }
    }
});

// Main Application Class

// Main Application Class - OPTIMIZED
class SpoonfullApp {
    constructor() {
        this.recipeManager = new RecipeManager();
        this.userProfile = this.loadUserProfile();
        this.foodQuotes = this.initializeFoodQuotes();
        this.currentQuoteIndex = 0;
        this.currentRecipeForPlan = null;
        this.modalContentCache = new Map(); // Cache for modal content
        
        this.init();
    }

    init() {
        // Initialize all components
        this.initLucideIcons();
        this.initEventListeners();
        this.initDynamicContent();
        this.loadDashboardData();
        this.startQuoteRotation();
        this.initGoals();
        
        // Load recipes from API
        this.recipeManager.loadRecipes();
    }

    // User Profile Management
    loadUserProfile() {
        const savedProfile = localStorage.getItem('spoonfull_profile');
        if (savedProfile) {
            return JSON.parse(savedProfile);
        }
        
        // Default profile
        return {
            name: 'Guest',
            email: 'Not signed in',
            diet: '',
            allergies: '',
            stats: {
                recipesTried: 0,
                favorites: 0,
                mealsPlanned: 0,
                progress: 0
            }
        };
    }

    saveUserProfile(profile) {
        this.userProfile = { ...this.userProfile, ...profile };
        localStorage.setItem('spoonfull_profile', JSON.stringify(this.userProfile));
        this.updateProfileDisplay();
    }

    updateProfileDisplay() {
        const sidebarName = document.getElementById('sidebarName');
        const sidebarEmail = document.getElementById('sidebarEmail');
        const welcomeName = document.getElementById('welcomeName');
        
        if (sidebarName) sidebarName.textContent = this.userProfile.name;
        if (sidebarEmail) sidebarEmail.textContent = this.userProfile.email;
        if (welcomeName) welcomeName.textContent = this.userProfile.name;
    }

    // Food Quotes System
    initializeFoodQuotes() {
        return [
            {
                quote: "Cooking is like love. It should be entered into with abandon or not at all.",
                tip: "Always taste as you cook! Your palate is your best guide."
            },
            {
                quote: "The secret of good cooking is, first, having a love of it.",
                tip: "Keep your knives sharp - a sharp knife is safer than a dull one."
            },
            {
                quote: "Food is our common ground, a universal experience.",
                tip: "Don't overcrowd the pan when sautéing for better browning."
            },
            {
                quote: "A recipe has no soul. You, as the cook, must bring soul to the recipe.",
                tip: "Let meat rest before slicing - it stays juicier!"
            },
            {
                quote: "Cooking is at once child's play and adult joy.",
                tip: "Season in layers for more complex, developed flavors."
            },
            {
                quote: "The only real stumbling block is fear of failure.",
                tip: "Use a kitchen scale for baking - precision matters!"
            },
            {
                quote: "People who love to eat are always the best people.",
                tip: "Prep all ingredients before you start cooking (mise en place)."
            },
            {
                quote: "Food is symbolic of love when words are inadequate.",
                tip: "Clean as you go to avoid a messy kitchen at the end."
            },
            {
                quote: "Life is a combination of magic and pasta.",
                tip: "Trust your senses more than the timer."
            },
            {
                quote: "Cooking is not difficult. Everyone has taste, even if they don't realize it.",
                tip: "Cook with love - it makes everything taste better!"
            },
            {
                quote: "Good food is the foundation of genuine happiness.",
                tip: "Batch-prep grains on Sunday to save weeknight time."
            },
            {
                quote: "The discovery of a new dish does more for human happiness than the discovery of a star.",
                tip: "Store herbs in water like flowers to keep them fresh longer."
            }
        ];
    }

    startQuoteRotation() {
        this.showNextQuote();
        setInterval(() => {
            this.showNextQuote();
        }, 8000);
    }

    showNextQuote() {
        const quoteData = this.foodQuotes[this.currentQuoteIndex];
        const foodTalk = document.getElementById('foodTalk');
        const tipTalk = document.getElementById('tipTalk');
        
        if (foodTalk && tipTalk) {
            foodTalk.classList.add('opacity-0', 'transform', '-translate-y-2');
            tipTalk.classList.add('opacity-0', 'transform', '-translate-y-2');
            
            setTimeout(() => {
                foodTalk.textContent = quoteData.quote;
                tipTalk.textContent = `💡 ${quoteData.tip}`;
                
                foodTalk.classList.remove('opacity-0', '-translate-y-2');
                tipTalk.classList.remove('opacity-0', '-translate-y-2');
                foodTalk.classList.add('opacity-100', 'translate-y-0');
                tipTalk.classList.add('opacity-100', 'translate-y-0');
                
                foodTalk.classList.add('animate-quote-slide');
                tipTalk.classList.add('animate-quote-slide');
                
                setTimeout(() => {
                    foodTalk.classList.remove('animate-quote-slide');
                    tipTalk.classList.remove('animate-quote-slide');
                }, 1000);
                
            }, 300);
        }
        
        this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.foodQuotes.length;
    }

    // =============================================
    // ENHANCED DASHBOARD FUNCTIONALITY
    // =============================================

    loadDashboardData() {
        this.updateStats();
        this.updateMealPlanDisplay();
        this.updateDateAndGreeting();
        this.updateUserActivity();
    }

    updateStats() {
        const favorites = JSON.parse(localStorage.getItem('spoonfull_favorites') || '[]');
        const mealPlan = JSON.parse(localStorage.getItem('spoonfull_mealPlan') || '{}');
        
        let totalMeals = 0;
        Object.values(mealPlan).forEach(day => {
            if (typeof day === 'object') {
                Object.values(day).forEach(meals => {
                    if (Array.isArray(meals)) {
                        totalMeals += meals.length;
                    }
                });
            }
        });
        
        const progress = Math.min(Math.floor((totalMeals + favorites.length) * 5), 100);
        
        const plannedMeals = document.getElementById('plannedMeals');
        const favoritesCount = document.getElementById('favorites');
        const progressElement = document.getElementById('progress');
        
        if (plannedMeals) plannedMeals.textContent = totalMeals;
        if (favoritesCount) favoritesCount.textContent = favorites.length;
        if (progressElement) progressElement.textContent = `${progress}%`;
        
        this.userProfile.stats = {
            recipesTried: 0,
            favorites: favorites.length,
            mealsPlanned: totalMeals,
            progress: progress
        };
        
        this.saveUserProfile(this.userProfile);
    }

    updateMealPlanDisplay() {
        const mealPlan = JSON.parse(localStorage.getItem('spoonfull_mealPlan') || '{}');
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        
        days.forEach(day => {
            const countElement = document.getElementById(`${day.substring(0, 3)}Count`);
            const mealsElement = document.getElementById(`${day}Meals`);
            
            if (countElement && mealsElement) {
                const dayMeals = mealPlan[day] || {};
                let totalMeals = 0;
                let mealItems = [];
                
                Object.entries(dayMeals).forEach(([mealType, meals]) => {
                    if (Array.isArray(meals)) {
                        totalMeals += meals.length;
                        meals.forEach(meal => {
                            mealItems.push(`${mealType}: ${meal.title}`);
                        });
                    }
                });
                
                countElement.textContent = totalMeals;
                mealsElement.innerHTML = '';
                
                if (mealItems.length > 0) {
                    mealItems.slice(0, 3).forEach(mealText => {
                        const li = document.createElement('li');
                        li.className = 'text-xs text-gray-600 dark:text-gray-400 truncate';
                        li.textContent = mealText;
                        mealsElement.appendChild(li);
                    });
                    
                    if (mealItems.length > 3) {
                        const li = document.createElement('li');
                        li.className = 'text-xs text-gray-500 dark:text-gray-500 italic';
                        li.textContent = `+${mealItems.length - 3} more...`;
                        mealsElement.appendChild(li);
                    }
                } else {
                    const li = document.createElement('li');
                    li.className = 'text-xs text-gray-400 dark:text-gray-500 italic';
                    li.textContent = 'No meals planned';
                    mealsElement.appendChild(li);
                }
            }
        });
    }

    updateDateAndGreeting() {
        const todayElement = document.getElementById('today');
        const greetingElement = document.getElementById('greeting');
        
        if (todayElement) {
            todayElement.textContent = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        if (greetingElement) {
            const hour = new Date().getHours();
            let greeting = 'Good evening';
            if (hour < 12) greeting = 'Good morning';
            else if (hour < 18) greeting = 'Good afternoon';
            
            greetingElement.innerHTML = `${greeting} 👋 <span id="welcomeName">${this.userProfile.name}</span>`;
        }
    }

    // =============================================
    // ENHANCED RESET FUNCTIONALITY
    // =============================================

    initDashboardEvents() {
        // Surprise Me buttons
        const surpriseHero = document.getElementById('surpriseHero');
        const randomBtnToolbar = document.getElementById('randomBtnToolbar');

        if (surpriseHero) {
            surpriseHero.addEventListener('click', () => {
                this.recipeManager.getRandomRecipe();
            });
        }

        if (randomBtnToolbar) {
            randomBtnToolbar.addEventListener('click', () => {
                this.recipeManager.getRandomRecipe();
            });
        }

        // CORRECTED RESET BUTTON - CLEARS ALL DATA
        const resetPlannerLink = document.getElementById('resetPlannerLink');
        if (resetPlannerLink) {
            resetPlannerLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showResetConfirmation();
            });
        }

        // Show Favorites button
        const showFavoritesBtn = document.getElementById('showFavoritesBtn');
        if (showFavoritesBtn) {
            showFavoritesBtn.addEventListener('click', () => {
                this.recipeManager.toggleFavoritesView();
            });
        }

        // Day buttons in meal planner
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const day = e.target.closest('.day-item').dataset.day;
                this.openMealPlannerForDay(day);
            });
        });
    }

    showResetConfirmation() {
        const modalContent = `
            <div class="text-center p-6">
                <div class="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="alert-triangle" class="w-8 h-8 text-rose-600"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Reset Everything?</h3>
                <p class="text-gray-600 dark:text-gray-300 mb-6">
                    This will clear ALL your data: meal plans, favorites, goals, and progress. This cannot be undone.
                </p>
                <div class="grid grid-cols-2 gap-3">
                    <button id="confirmFullReset" class="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">
                        Reset Everything
                    </button>
                    <button id="cancelReset" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        this.showCustomModal('Reset Confirmation', modalContent, () => {
            setTimeout(() => {
                const confirmBtn = document.getElementById('confirmFullReset');
                const cancelBtn = document.getElementById('cancelReset');
                
                if (confirmBtn) {
                    confirmBtn.addEventListener('click', () => {
                        this.resetAllData();
                        this.closeModal('recipeModal');
                    });
                }
                
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        this.closeModal('recipeModal');
                    });
                }
            }, 50);
        });
    }

    resetAllData() {
        // Clear ALL data from localStorage
        const keysToRemove = [
            'spoonfull_mealPlan',
            'spoonfull_favorites', 
            'spoonfull_goals',
            'spoonfull_userActivity',
            'spoonfull_profile'
        ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Reset user profile to default
        this.userProfile = {
            name: 'Guest',
            email: 'Not signed in',
            diet: '',
            allergies: '',
            stats: { recipesTried: 0, favorites: 0, mealsPlanned: 0, progress: 0 }
        };
        
        // Update ALL dashboard components
        this.updateProfileDisplay();
        this.updateMealPlanDisplay();
        this.updateStats();
        this.initGoals(); // Reset goals
        this.updateUserActivity();
        
        // Clear modal cache
        this.modalContentCache.clear();
        
        this.showNotification('All data has been reset successfully! Dashboard cleared.', 'success');
    }

    // =============================================
    // OPTIMIZED MODAL MANAGEMENT
    // =============================================

    showRecipeModal(recipe) {
        const modal = document.getElementById('recipeModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalTitle || !modalBody) return;
        
        requestAnimationFrame(() => {
            modalTitle.textContent = recipe.title;
            
            // Use cache for better performance
            const cacheKey = `recipe_${recipe.id}`;
            if (this.modalContentCache.has(cacheKey)) {
                modalBody.innerHTML = this.modalContentCache.get(cacheKey);
            } else {
                const content = this.createOptimizedRecipeModalContent(recipe);
                this.modalContentCache.set(cacheKey, content);
                modalBody.innerHTML = content;
            }
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.initLucideIcons();
        });
    }

    createOptimizedRecipeModalContent(recipe) {
        const favorites = JSON.parse(localStorage.getItem('spoonfull_favorites') || '[]');
        const isFavorite = favorites.some(fav => fav.id === recipe.id);
        
        const ingredientsCount = recipe.ingredients ? recipe.ingredients.length : 0;
        const instructionsCount = recipe.instructions ? recipe.instructions.length : 0;
        
        return `
            <div class="space-y-6">
                <!-- Recipe Header - Optimized -->
                <div class="flex flex-col lg:flex-row gap-6">
                    <div class="lg:w-1/2">
                        <img src="${recipe.image}" alt="${recipe.title}" 
                             class="w-full h-48 lg:h-64 object-cover rounded-xl shadow-md"
                             loading="lazy" decoding="async">
                    </div>
                    <div class="lg:w-1/2 space-y-4">
                        <div class="flex items-start justify-between">
                            <h4 class="text-xl lg:text-2xl font-bold">${recipe.title}</h4>
                            <button class="favorite-btn p-2 rounded-lg bg-gray-100 dark:bg-gray-800 transition-colors ${isFavorite ? 'text-rose-500' : 'text-gray-600'}" 
                                    onclick="window.spoonfullApp.toggleFavorite('${recipe.id}')">
                                <i data-lucide="heart" class="w-5 h-5 ${isFavorite ? 'fill-current' : ''}"></i>
                            </button>
                        </div>
                        
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                <i data-lucide="clock" class="w-4 h-4 mx-auto mb-1"></i>
                                <div class="font-semibold">${recipe.readyInMinutes} min</div>
                            </div>
                            <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                                <i data-lucide="users" class="w-4 h-4 mx-auto mb-1"></i>
                                <div class="font-semibold">${recipe.servings}</div>
                            </div>
                            <div class="text-center p-3 rounded-lg ${this.getDifficultyClass(recipe.difficulty)} text-white">
                                <div class="font-semibold capitalize">${recipe.difficulty || 'easy'}</div>
                            </div>
                            <div class="text-center p-3 rounded-lg nutrition-score text-white">
                                <div class="font-semibold">${recipe.nutritionScore || '4.5'}</div>
                            </div>
                        </div>
                        
                        <p class="text-gray-600 dark:text-gray-300 text-sm lg:text-base">${recipe.description || 'A delicious recipe that will delight your taste buds.'}</p>
                        
                        <div class="flex flex-col sm:flex-row gap-3 pt-4">
                            <button onclick="window.spoonfullApp.openAddToPlanModal('${recipe.id}')" 
                                    class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                                <i data-lucide="calendar-plus" class="w-5 h-5"></i>
                                Add to Plan
                            </button>
                            <button class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <i data-lucide="share-2" class="w-5 h-5"></i>
                                Share
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Ingredients & Instructions - Optimized -->
                <div class="ingredients-instructions-grid">
                    <div class="ingredients-column">
                        <div class="ingredients-header">
                            <h5 class="text-lg font-semibold flex items-center gap-2">
                                <i data-lucide="list-checks" class="w-5 h-5 text-emerald-600"></i>
                                Ingredients
                                <span class="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                    ${ingredientsCount} items
                                </span>
                            </h5>
                        </div>
                        <div class="ingredients-list">
                            ${recipe.ingredients ? this.renderIngredients(recipe.ingredients) : this.renderEmptyState('ingredients')}
                        </div>
                    </div>
                    
                    <div class="instructions-column">
                        <div class="instructions-header">
                            <h5 class="text-lg font-semibold flex items-center gap-2">
                                <i data-lucide="chef-hat" class="w-5 h-5 text-emerald-600"></i>
                                Instructions
                                <span class="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                    ${instructionsCount} steps
                                </span>
                            </h5>
                        </div>
                        <div class="instructions-list">
                            ${recipe.instructions ? this.renderInstructions(recipe.instructions) : this.renderEmptyState('instructions')}
                        </div>
                    </div>
                </div>

                <!-- Nutrition & Video -->
                <div class="grid md:grid-cols-2 gap-6 lg:gap-8">
                    ${this.renderNutritionFacts(recipe)}
                    ${this.renderVideoSection()}
                </div>
            </div>
        `;
    }

    // Optimized helper methods
    getDifficultyClass(difficulty) {
        const classes = {
            easy: 'difficulty-easy',
            medium: 'difficulty-medium',
            hard: 'difficulty-hard'
        };
        return classes[difficulty] || 'difficulty-easy';
    }

    renderIngredients(ingredients) {
        return ingredients.map(ingredient => `
            <div class="ingredient-item flex items-center gap-3">
                <input type="checkbox" class="ingredient-checkbox">
                <span class="flex-1 text-sm lg:text-base">${ingredient}</span>
            </div>
        `).join('');
    }

    renderInstructions(instructions) {
        return instructions.map((instruction, index) => `
            <div class="instruction-item flex gap-4">
                <div class="instruction-number">${index + 1}</div>
                <div class="flex-1">
                    <p class="text-sm lg:text-base leading-relaxed text-gray-700 dark:text-gray-300">${instruction}</p>
                </div>
            </div>
        `).join('');
    }

    renderEmptyState(type) {
        return `
            <div class="text-center py-8 text-gray-500">
                <i data-lucide="alert-circle" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                <p>No ${type} available</p>
            </div>
        `;
    }

    renderNutritionFacts(recipe) {
        return `
            <div>
                <h5 class="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i data-lucide="activity" class="w-5 h-5 text-emerald-600"></i>
                    Nutrition Facts
                </h5>
                <div class="grid grid-cols-2 gap-3">
                    <div class="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                        <div class="text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-400">${recipe.calories}</div>
                        <div class="text-sm text-blue-600 dark:text-blue-400">Calories</div>
                    </div>
                    <div class="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/30">
                        <div class="text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">${recipe.protein || '12g'}</div>
                        <div class="text-sm text-green-600 dark:text-green-400">Protein</div>
                    </div>
                    <div class="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/30">
                        <div class="text-xl lg:text-2xl font-bold text-yellow-600 dark:text-yellow-400">${recipe.carbs || '45g'}</div>
                        <div class="text-sm text-yellow-600 dark:text-yellow-400">Carbs</div>
                    </div>
                    <div class="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/30">
                        <div class="text-xl lg:text-2xl font-bold text-red-600 dark:text-red-400">${recipe.fat || '8g'}</div>
                        <div class="text-sm text-red-600 dark:text-red-400">Fat</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderVideoSection() {
        return `
            <div>
                <h5 class="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i data-lucide="play-circle" class="w-5 h-5 text-emerald-600"></i>
                    Video Tutorial
                </h5>
                <div class="video-container bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div class="text-center text-gray-500">
                        <i data-lucide="video" class="w-12 h-12 mx-auto mb-2"></i>
                        <p class="text-sm">Video tutorial coming soon</p>
                    </div>
                </div>
            </div>
        `;
    }

    showCustomModal(title, content, onShowCallback = null) {
        const modal = document.getElementById('recipeModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalTitle || !modalBody) return;
        
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.initLucideIcons();
        
        if (onShowCallback) onShowCallback();
    }

    // =============================================
    // OPTIMIZED FAVORITE TOGGLE
    // =============================================

    toggleFavorite(recipeId) {
        const favorites = JSON.parse(localStorage.getItem('spoonfull_favorites') || '[]');
        const recipe = this.recipeManager.recipes.find(r => r.id === recipeId);
        
        if (!recipe) return;

        const existingIndex = favorites.findIndex(fav => fav.id === recipeId);
        
        if (existingIndex > -1) {
            favorites.splice(existingIndex, 1);
            this.showNotification('Removed from favorites', 'info');
        } else {
            favorites.push(recipe);
            this.showNotification('Added to favorites!', 'success');
        }
        
        localStorage.setItem('spoonfull_favorites', JSON.stringify(favorites));
        this.updateStats();
        this.updateUserActivity();
        
        // Update UI without full refresh
        this.updateFavoriteButton(recipeId, existingIndex === -1);
        this.modalContentCache.delete(`recipe_${recipeId}`);
    }

    updateFavoriteButton(recipeId, isNowFavorite) {
        const modal = document.getElementById('recipeModal');
        if (modal.classList.contains('active')) {
            const favoriteBtn = modal.querySelector('.favorite-btn');
            if (favoriteBtn) {
                if (isNowFavorite) {
                    favoriteBtn.classList.add('text-rose-500');
                    favoriteBtn.classList.remove('text-gray-600');
                    const icon = favoriteBtn.querySelector('i');
                    if (icon) icon.classList.add('fill-current');
                } else {
                    favoriteBtn.classList.remove('text-rose-500');
                    favoriteBtn.classList.add('text-gray-600');
                    const icon = favoriteBtn.querySelector('i');
                    if (icon) icon.classList.remove('fill-current');
                }
            }
        }
    }

    // =============================================
    // WEEKLY GOALS FUNCTIONALITY
    // =============================================

    initGoals() {
        this.loadGoalStates();
        this.setupGoalClickHandlers();
        this.updateGoalsProgress();
    }

    setupGoalClickHandlers() {
        const goalCheckboxes = document.querySelectorAll('.goal-checkbox');
        
        goalCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleGoal(checkbox);
            });
        });

        document.querySelectorAll('.goal-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('goal-checkbox')) {
                    const checkbox = item.querySelector('.goal-checkbox');
                    this.toggleGoal(checkbox);
                }
            });
        });
    }

    toggleGoal(checkbox) {
        const goalItem = checkbox.closest('.goal-item');
        const goalId = checkbox.getAttribute('data-goal');
        
        if (goalItem) {
            const wasCompleted = goalItem.classList.contains('completed');
            
            goalItem.classList.toggle('completed');
            checkbox.classList.toggle('completed');
            
            this.saveGoalState(goalId, !wasCompleted);
            this.updateGoalsProgress();
            this.updateUserActivity();
            
            const goalText = goalItem.querySelector('span').textContent;
            if (!wasCompleted) {
                this.showNotification(`Goal completed: ${goalText}`, 'success');
            }
        }
    }

    saveGoalState(goalId, completed) {
        const goals = JSON.parse(localStorage.getItem('spoonfull_goals') || '{}');
        goals[goalId] = completed;
        localStorage.setItem('spoonfull_goals', JSON.stringify(goals));
    }

    loadGoalStates() {
        const goals = JSON.parse(localStorage.getItem('spoonfull_goals') || '{}');
        
        Object.keys(goals).forEach(goalId => {
            const checkbox = document.querySelector(`.goal-checkbox[data-goal="${goalId}"]`);
            const goalItem = document.querySelector(`.goal-item[data-goal="${goalId}"]`);
            
            if (checkbox && goalItem && goals[goalId]) {
                checkbox.classList.add('completed');
                goalItem.classList.add('completed');
            }
        });
        
        this.updateGoalsProgress();
    }

    updateGoalsProgress() {
        const completedGoals = document.querySelectorAll('.goal-item.completed').length;
        const totalGoals = document.querySelectorAll('.goal-item').length;
        const progressElement = document.getElementById('goalsProgress');
        
        if (progressElement) {
            progressElement.textContent = `${completedGoals}/${totalGoals} completed`;
        }
    }

    // =============================================
    // USER ACTIVITY TRACKING
    // =============================================

    updateUserActivity() {
        const userActivity = JSON.parse(localStorage.getItem('spoonfull_userActivity') || '{}');
        const today = new Date().toISOString().split('T')[0];
        
        if (!userActivity[today]) {
            userActivity[today] = {
                mealsAdded: 0,
                favoritesAdded: 0,
                goalsCompleted: 0,
                recipesViewed: 0,
                lastActive: new Date().toISOString()
            };
        }
        
        const mealPlan = JSON.parse(localStorage.getItem('spoonfull_mealPlan') || '{}');
        let totalMeals = 0;
        Object.values(mealPlan).forEach(day => {
            if (typeof day === 'object') {
                Object.values(day).forEach(meals => {
                    if (Array.isArray(meals)) {
                        totalMeals += meals.length;
                    }
                });
            }
        });
        
        const favorites = JSON.parse(localStorage.getItem('spoonfull_favorites') || '[]');
        const completedGoals = document.querySelectorAll('.goal-item.completed').length;
        
        userActivity[today].mealsAdded = totalMeals;
        userActivity[today].favoritesAdded = favorites.length;
        userActivity[today].goalsCompleted = completedGoals;
        userActivity[today].lastActive = new Date().toISOString();
        
        localStorage.setItem('spoonfull_userActivity', JSON.stringify(userActivity));
        
        this.updateCookingStreak();
        this.updateRecipesMastered();
    }

    updateCookingStreak() {
        const userActivity = JSON.parse(localStorage.getItem('spoonfull_userActivity') || '{}');
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            if (userActivity[dateStr] && (userActivity[dateStr].mealsAdded > 0 || userActivity[dateStr].goalsCompleted > 0)) {
                streak++;
            } else {
                break;
            }
        }
        
        const streakElement = document.getElementById('cookingStreak');
        if (streakElement) {
            streakElement.textContent = streak;
            const progressBar = streakElement.closest('.rounded-xl').querySelector('.bg-white');
            if (progressBar) {
                const progressWidth = Math.min((streak / 30) * 100, 100);
                progressBar.style.width = `${progressWidth}%`;
            }
        }
    }

    updateRecipesMastered() {
        const favorites = JSON.parse(localStorage.getItem('spoonfull_favorites') || '[]');
        const recipesMastered = favorites.length;
        
        const recipesElement = document.getElementById('recipesLearned');
        if (recipesElement) {
            recipesElement.textContent = recipesMastered;
            const progressBar = recipesElement.closest('.rounded-xl').querySelector('.bg-white');
            if (progressBar) {
                const progressWidth = Math.min((recipesMastered / 50) * 100, 100);
                progressBar.style.width = `${progressWidth}%`;
            }
        }
    }

    // =============================================
    // UTILITY METHODS
    // =============================================

    initLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    initEventListeners() {
        this.initSidebarEvents();
        this.initDarkModeEvents();
        this.initModalEvents();
        this.initDashboardEvents();
        this.initNavigationEvents();
    }

    initSidebarEvents() {
        const menuBtn = document.getElementById('menuBtn');
        const closeSidebar = document.getElementById('closeSidebar');
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('backdrop');
        const logoutBtn = document.getElementById('logoutBtn');

        const toggleSidebar = (show) => {
            if (show) {
                sidebar.classList.add('open');
                backdrop.classList.add('show');
                document.body.style.overflow = 'hidden';
            } else {
                sidebar.classList.remove('open');
                backdrop.classList.remove('show');
                document.body.style.overflow = '';
            }
        };

        if (menuBtn) menuBtn.addEventListener('click', () => toggleSidebar(true));
        if (closeSidebar) closeSidebar.addEventListener('click', () => toggleSidebar(false));
        if (backdrop) backdrop.addEventListener('click', () => toggleSidebar(false));
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('spoonfull_profile');
                localStorage.removeItem('spoonfull_favorites');
                localStorage.removeItem('spoonfull_mealPlan');
                localStorage.removeItem('spoonfull_goals');
                localStorage.removeItem('spoonfull_userActivity');
                
                this.userProfile = {
                    name: 'Guest',
                    email: 'Not signed in',
                    diet: '',
                    allergies: '',
                    stats: { recipesTried: 0, favorites: 0, mealsPlanned: 0, progress: 0 }
                };
                
                this.updateProfileDisplay();
                this.loadDashboardData();
                toggleSidebar(false);
                this.showNotification('Successfully logged out!', 'success');
            });
        }
    }

    initDarkModeEvents() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                const isDark = document.documentElement.classList.toggle('dark');
                localStorage.setItem('spoonfull_darkMode', isDark);
                
                const icon = darkModeToggle.querySelector('i');
                if (icon) {
                    if (isDark) {
                        icon.setAttribute('data-lucide', 'sun');
                    } else {
                        icon.setAttribute('data-lucide', 'moon');
                    }
                    this.initLucideIcons();
                }
            });

            const savedDarkMode = localStorage.getItem('spoonfull_darkMode') === 'true';
            if (savedDarkMode) {
                document.documentElement.classList.add('dark');
                const icon = darkModeToggle.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'sun');
                    this.initLucideIcons();
                }
            }
        }
    }

    initModalEvents() {
        const modalClose = document.getElementById('modalClose');
        const recipeModal = document.getElementById('recipeModal');

        if (modalClose && recipeModal) {
            modalClose.addEventListener('click', () => {
                this.closeModal('recipeModal');
            });
        }

        const planModalClose = document.getElementById('planModalClose');
        const planModal = document.getElementById('planModal');
        const confirmAddToPlan = document.getElementById('confirmAddToPlan');
        const cancelAddToPlan = document.getElementById('cancelAddToPlan');

        if (planModalClose && planModal) {
            planModalClose.addEventListener('click', () => {
                this.closeModal('planModal');
            });
        }

        if (confirmAddToPlan) {
            confirmAddToPlan.addEventListener('click', () => {
                const day = document.getElementById('planDay').value;
                const mealType = document.getElementById('planMealType').value;
                this.addToMealPlan(day, mealType);
            });
        }

        if (cancelAddToPlan) {
            cancelAddToPlan.addEventListener('click', () => {
                this.closeModal('planModal');
            });
        }

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal('recipeModal');
                this.closeModal('planModal');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal('recipeModal');
                this.closeModal('planModal');
            }
        });
    }

    initNavigationEvents() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('#') && href.length > 1) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                        if (window.innerWidth < 768) {
                            this.closeModal('sidebar');
                        }
                    }
                }
            });
        });

        document.querySelectorAll('a[href="#featured-recipes"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'recipes.html';
            });
        });

        const findRecipesBtn = document.querySelector('a[href="#featured-recipes"]');
        if (findRecipesBtn) {
            findRecipesBtn.href = 'recipes.html';
        }

        const browseRecipesBtn = document.querySelector('a[href="#featured-recipes"]');
        if (browseRecipesBtn) {
            browseRecipesBtn.href = 'recipes.html';
        }
    }

    initDynamicContent() {
        const currentYear = document.getElementById('currentYear');
        if (currentYear) {
            currentYear.textContent = new Date().getFullYear();
        }
        this.updateProfileDisplay();
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('backdrop').classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    showNotification(message, type = 'info') {
        document.querySelectorAll('.custom-toast').forEach(toast => toast.remove());
        
        const notification = document.createElement('div');
        notification.className = `custom-toast fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300 ${
            type === 'success' ? 'bg-emerald-500' : 
            type === 'warning' ? 'bg-yellow-500' : 
            type === 'error' ? 'bg-red-500' : 
            'bg-blue-500'
        }`;
        notification.textContent = message;
        notification.style.transform = 'translateX(100%)';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Keep your existing methods for quick actions, meal planning, etc.
    quickAddToPlan(mealType) {
        if (this.recipeManager.recipes.length === 0) {
            this.showNotification('Please wait while recipes are loading...', 'info');
            return;
        }

        const randomRecipe = this.recipeManager.recipes[Math.floor(Math.random() * this.recipeManager.recipes.length)];
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        this.addQuickMealToPlan(today, mealType, randomRecipe);
    }

    addQuickMealToPlan(day, mealType, recipe) {
        const mealPlan = JSON.parse(localStorage.getItem('spoonfull_mealPlan') || '{}');
        
        if (!mealPlan[day]) mealPlan[day] = {};
        if (!mealPlan[day][mealType]) mealPlan[day][mealType] = [];
        
        const existingIndex = mealPlan[day][mealType].findIndex(meal => meal.id === recipe.id);
        if (existingIndex === -1) {
            mealPlan[day][mealType].push({
                id: recipe.id,
                title: recipe.title,
                time: recipe.readyInMinutes,
                type: mealType,
                image: recipe.image,
                description: recipe.description
            });
            
            localStorage.setItem('spoonfull_mealPlan', JSON.stringify(mealPlan));
            this.updateMealPlanDisplay();
            this.updateStats();
            this.updateUserActivity();
            this.showNotification(`Added "${recipe.title}" to ${day} ${mealType}!`, 'success');
        } else {
            this.showNotification('Recipe already added to this meal!', 'warning');
        }
    }

    openAddToPlanModal(recipeId) {
        const recipe = this.recipeManager.recipes.find(r => r.id === recipeId);
        if (!recipe) return;
        
        this.currentRecipeForPlan = recipe;
        const modal = document.getElementById('planModal');
        
        if (modal) {
            modal.classList.add('active');
            document.getElementById('backdrop').classList.add('show');
        }
    }

    addToMealPlan(day, mealType) {
        if (!this.currentRecipeForPlan) return;
        
        const mealPlan = JSON.parse(localStorage.getItem('spoonfull_mealPlan') || '{}');
        
        if (!mealPlan[day]) mealPlan[day] = {};
        if (!mealPlan[day][mealType]) mealPlan[day][mealType] = [];
        
        const existingIndex = mealPlan[day][mealType].findIndex(meal => meal.id === this.currentRecipeForPlan.id);
        if (existingIndex === -1) {
            mealPlan[day][mealType].push({
                id: this.currentRecipeForPlan.id,
                title: this.currentRecipeForPlan.title,
                time: this.currentRecipeForPlan.readyInMinutes,
                type: mealType
            });
            
            localStorage.setItem('spoonfull_mealPlan', JSON.stringify(mealPlan));
            this.updateMealPlanDisplay();
            this.updateStats();
            this.updateUserActivity();
            this.closeModal('planModal');
            this.showNotification(`Added "${this.currentRecipeForPlan.title}" to ${day} ${mealType}!`, 'success');
        } else {
            this.showNotification('Recipe already added to this meal!', 'warning');
        }
    }

    generateShoppingList() {
        const mealPlan = JSON.parse(localStorage.getItem('spoonfull_mealPlan') || '{}');
        let shoppingItems = [];
        
        Object.values(mealPlan).forEach(day => {
            if (typeof day === 'object') {
                Object.values(day).forEach(meals => {
                    if (Array.isArray(meals)) {
                        meals.forEach(meal => {
                            const ingredients = this.getGenericIngredients(meal.type);
                            shoppingItems = [...shoppingItems, ...ingredients];
                        });
                    }
                });
            }
        });
        
        shoppingItems = [...new Set(shoppingItems)];
        localStorage.setItem('spoonfull_shoppingList', JSON.stringify(shoppingItems));
        
        this.showNotification(`Generated shopping list with ${shoppingItems.length} items!`, 'success');
        
        setTimeout(() => {
            window.location.href = 'shopping.html';
        }, 1500);
    }

    getGenericIngredients(mealType) {
        const baseIngredients = {
            breakfast: ['Eggs', 'Milk', 'Bread', 'Butter', 'Fruits', 'Yogurt', 'Oats', 'Honey'],
            lunch: ['Rice', 'Pasta', 'Vegetables', 'Chicken', 'Salad', 'Olive Oil', 'Spices'],
            dinner: ['Protein (Chicken/Fish/Beef)', 'Vegetables', 'Grains', 'Sauces', 'Herbs', 'Potatoes'],
            snack: ['Fruits', 'Nuts', 'Yogurt', 'Crackers', 'Cheese', 'Hummus']
        };
        
        return baseIngredients[mealType] || ['Fresh ingredients', 'Spices', 'Cooking oil'];
    }

    openMealPlannerForDay(day) {
        this.showNotification(`Opening meal planner for ${day}...`, 'info');
    }

    searchRecipes(query) {
        this.recipeManager.searchRecipes(query);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.spoonfullApp = new SpoonfullApp();
});

// Global functions for onclick handlers
function toggleFavorite(recipeId) {
    if (window.spoonfullApp) {
        window.spoonfullApp.toggleFavorite(recipeId);
    }
}

function showRecipeDetails(recipeId) {
    if (window.spoonfullApp && window.spoonfullApp.recipeManager) {
        const recipe = window.spoonfullApp.recipeManager.recipes.find(r => r.id === recipeId);
        if (recipe) {
            window.spoonfullApp.showRecipeModal(recipe);
        }
    }
}

function addToPlan(recipeId) {
    if (window.spoonfullApp) {
        window.spoonfullApp.openAddToPlanModal(recipeId);
    }
}

// Make functions available globally
window.toggleFavorite = toggleFavorite;
window.showRecipeDetails = showRecipeDetails;
window.addToPlan = addToPlan;