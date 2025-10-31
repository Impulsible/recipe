// recipes.js - Enhanced Recipe Management for Spoonfull App

class RecipeManager {
    constructor() {
        // API configuration
        this.apiConfig = {
            baseUrl: 'https://api.edamam.com/api/recipes/v2',
            credentials: {
                appId: '1edd8316',
                appKey: 'fff5581f3438a5bcac6ab5e038dda7ae'
            },
            mealDbUrl: 'https://www.themealdb.com/api/json/v1/1'
        };
        
        // Data structures
        this.recipeCollection = [];
        this.displayedRecipes = [];
        this.pagination = {
            currentPage: 1,
            itemsPerPage: 30,
            hasMoreItems: true
        };
        this.uiState = {
            isLoading: false,
            showFavorites: false,
            activeCategory: 'all',
            displayMode: 'grid',
            searchTerm: ''
        };
        this.selectedRecipe = null;
        this.dailyRecipe = null;
        
        // Initialize managers
        this.profileManager = new RecipeProfileManager();
        this.toastManager = new RecipeToastManager();
        
        this.setupEventHandlers();
        this.initProfileSystem();
        this.injectAdditionalStyles();
    }

    injectAdditionalStyles() {
        const styles = `
            /* Enhanced List View Styles */
            .recipe-list {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                max-width: 100%;
            }

            .recipe-list .recipe-card {
                display: flex;
                gap: 1.5rem;
                padding: 1.5rem;
                background: white;
                border-radius: 1rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                border: 1px solid #e5e7eb;
                transition: all 0.3s ease;
            }

            .recipe-list .recipe-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }

            .recipe-list .recipe-card > .relative {
                flex: 0 0 200px;
                min-width: 200px;
            }

            .recipe-list .recipe-card img {
                height: 150px;
                width: 100%;
                border-radius: 0.75rem;
            }

            .recipe-list .recipe-card > div:last-child {
                flex: 1;
                padding: 0;
            }

            .recipe-list .nutrition-preview {
                grid-template-columns: repeat(4, 1fr);
                max-width: 300px;
            }

            .recipe-list .flex.items-center.justify-between {
                justify-content: flex-start;
                gap: 2rem;
            }

            /* Dark mode support */
            .dark .recipe-list .recipe-card {
                background: #1f2937;
                border-color: #374151;
            }

            /* Responsive list view */
            @media (max-width: 768px) {
                .recipe-list .recipe-card {
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .recipe-list .recipe-card > .relative {
                    flex: 0 0 auto;
                    min-width: 100%;
                }
                
                .recipe-list .recipe-card img {
                    height: 200px;
                }
                
                .recipe-list .nutrition-preview {
                    grid-template-columns: repeat(3, 1fr);
                    max-width: 100%;
                }
            }

            /* Enhanced Hero Section */
            .hero-section {
                position: relative;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 4rem 1rem;
                text-align: center;
                overflow: hidden;
            }

            .hero-section::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" opacity="0.1"><path fill="white" d="M500,100 C700,100 900,200 900,400 C900,600 700,700 500,700 C300,700 100,600 100,400 C100,200 300,100 500,100 Z"/></svg>') no-repeat center;
                background-size: cover;
            }

            .hero-content {
                position: relative;
                z-index: 2;
                max-width: 800px;
                margin: 0 auto;
            }

            .hero-buttons {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
                margin-top: 2rem;
            }

            .hero-button {
                padding: 0.75rem 1.5rem;
                border-radius: 0.75rem;
                font-weight: 600;
                transition: all 0.3s ease;
                border: 2px solid transparent;
            }

            .hero-button.primary {
                background: white;
                color: #059669;
            }

            .hero-button.secondary {
                background: transparent;
                color: white;
                border-color: white;
            }

            .hero-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
            }

            /* Recipe of the Day Enhancements */
            .recipe-of-day-card {
                background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
                border: 1px solid #d1fae5;
                border-radius: 1rem;
                padding: 2rem;
                position: relative;
                overflow: hidden;
            }

            .dark .recipe-of-day-card {
                background: linear-gradient(135deg, #052e16 0%, #1f2937 100%);
                border-color: #065f46;
            }

            .recipe-of-day-badge {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: #10b981;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 2rem;
                font-size: 0.875rem;
                font-weight: 600;
            }

            /* Enhanced Modal Styles */
            .modal-content {
                max-height: 90vh;
                overflow-y: auto;
            }

            .modal-header {
                position: sticky;
                top: 0;
                background: white;
                z-index: 10;
                padding: 1.5rem 2rem;
                border-bottom: 1px solid #e5e7eb;
            }

            .dark .modal-header {
                background: #1f2937;
                border-color: #374151;
            }

            .modal-body {
                padding: 2rem;
            }

            /* Print Recipe Styles */
            @media print {
                .modal-header,
                .modal-footer,
                .action-buttons {
                    display: none !important;
                }
                
                .modal-content {
                    max-height: none;
                    overflow: visible;
                }
                
                .modal-body {
                    padding: 0;
                }
            }

            /* Enhanced Complexity Badges */
            .complexity-simple {
                background: #10b981;
            }

            .complexity-moderate {
                background: #f59e0b;
            }

            .complexity-advanced {
                background: #ef4444;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    initProfileSystem() {
        this.profileManager.refreshProfile();
    }

    setupEventHandlers() {
        // Search functionality
        const searchField = document.getElementById('searchInput');
        if (searchField) {
            searchField.addEventListener('input', this.createDelayedHandler((e) => {
                this.performSearch(e.target.value);
            }, 300));
        }

        // Favorites toggle
        const favoritesSwitch = document.getElementById('favoritesToggle');
        if (favoritesSwitch) {
            favoritesSwitch.addEventListener('click', () => {
                this.switchFavoritesView();
            });
        }

        // Random recipe buttons - FIXED
        const randomRecipeBtn = document.getElementById('randomBtnToolbar');
        if (randomRecipeBtn) {
            randomRecipeBtn.addEventListener('click', () => {
                this.selectRandomRecipe();
            });
        }

        const heroRandomBtn = document.getElementById('heroRandomBtn');
        if (heroRandomBtn) {
            heroRandomBtn.addEventListener('click', () => {
                this.selectRandomRecipe();
            });
        }

        // Hero search button - FIXED
        const heroSearchBtn = document.getElementById('heroSearchBtn');
        if (heroSearchBtn) {
            heroSearchBtn.addEventListener('click', () => {
                this.scrollToSearch();
            });
        }

        // View controls
        const viewControls = document.querySelectorAll('.view-btn');
        viewControls.forEach(control => {
            control.addEventListener('click', (e) => {
                this.changeDisplayMode(e.target.dataset.view);
            });
        });

        // Filter buttons
        const filterControls = document.querySelectorAll('.filter-btn');
        filterControls.forEach(control => {
            control.addEventListener('click', (e) => {
                this.applyFilter(e.target);
            });
        });

        // Recipe of the day - FIXED
        const viewDailyRecipe = document.getElementById('viewRecipeOfDay');
        if (viewDailyRecipe) {
            viewDailyRecipe.addEventListener('click', () => {
                this.displayDailyRecipe();
            });
        }

        const timerControl = document.getElementById('timerBtn');
        if (timerControl) {
            timerControl.addEventListener('click', () => {
                this.launchTimer();
            });
        }

        // Modal close handlers
        const closeModalButtons = document.querySelectorAll('.modal-close, .modal-cancel');
        closeModalButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.closeModalWindow();
            });
        });

        // Close modal when clicking backdrop
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModalWindow();
                }
            });
        });

        // Print recipe button
        const printButton = document.getElementById('printRecipe');
        if (printButton) {
            printButton.addEventListener('click', () => {
                this.printRecipe();
            });
        }

        // Share recipe button
        const shareButton = document.getElementById('shareRecipe');
        if (shareButton) {
            shareButton.addEventListener('click', () => {
                this.shareRecipe();
            });
        }
    }

    scrollToSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
            // Focus after scroll
            setTimeout(() => {
                searchInput.focus();
            }, 500);
        }
    }

    async fetchRecipes(searchTerm = '') {
        if (this.uiState.isLoading) return;
        
        this.uiState.isLoading = true;
        this.displayLoading();

        try {
            let recipeData = [];
            
            if (searchTerm) {
                recipeData = await this.queryRecipeAPI(searchTerm);
            } else {
                recipeData = await this.getPopularRecipes();
            }

            if (this.pagination.currentPage === 1) {
                this.recipeCollection = recipeData;
            } else {
                this.recipeCollection = [...this.recipeCollection, ...recipeData];
            }

            this.applyRecipeFilters();
            this.displayRecipes();
            this.updateResultsCounter();
            this.refreshDailyRecipe();

            this.pagination.hasMoreItems = recipeData.length === this.pagination.itemsPerPage;

        } catch (error) {
            console.error('Error fetching recipes:', error);
            this.showMessage('Unable to load recipes. Please check your connection.', 'error');
            this.loadBackupRecipes();
        } finally {
            this.uiState.isLoading = false;
            this.hideLoading();
        }
    }

    async queryRecipeAPI(query) {
        const requestUrl = `${this.apiConfig.baseUrl}?type=public&q=${encodeURIComponent(query)}&app_id=${this.apiConfig.credentials.appId}&app_key=${this.apiConfig.credentials.appKey}&from=${(this.pagination.currentPage - 1) * this.pagination.itemsPerPage}&to=${this.pagination.currentPage * this.pagination.itemsPerPage}`;
        
        try {
            const apiResponse = await fetch(requestUrl);
            if (!apiResponse.ok) throw new Error('API request unsuccessful');

            const responseData = await apiResponse.json();
            return responseData.hits.map(item => this.processAPIRecipe(item.recipe));
        } catch (error) {
            console.error('Recipe API error:', error);
            return this.getBackupRecipes().slice(0, this.pagination.itemsPerPage);
        }
    }

    async getPopularRecipes() {
        try {
            const searchTerms = ['chicken', 'pasta', 'salad', 'soup', 'vegetarian', 'healthy'];
            const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
            const recipes = await this.queryRecipeAPI(randomTerm);
            
            if (recipes.length >= 30) {
                return recipes.slice(0, 30);
            } else {
                const backupRecipes = this.getBackupRecipes();
                const requiredCount = 30 - recipes.length;
                return [...recipes, ...backupRecipes.slice(0, requiredCount)];
            }
        } catch (error) {
            console.error('Failed to fetch from recipe API:', error);
            return this.getBackupRecipes().slice(0, 30);
        }
    }

    processAPIRecipe(recipeData) {
        const nutritionInfo = recipeData.totalNutrients || {};
        
        return {
            identifier: recipeData.uri?.split('#')[1] || Math.random().toString(36).substr(2, 9),
            name: recipeData.label,
            imageUrl: recipeData.image,
            summary: `A delicious ${recipeData.mealType?.[0] || 'recipe'} from ${recipeData.source || 'our collection'}`,
            preparationTime: recipeData.totalTime || Math.floor(Math.random() * 60) + 10,
            cookingTime: 0,
            servingSize: recipeData.yield || 4,
            complexity: ['Simple', 'Moderate', 'Advanced'][Math.floor(Math.random() * 3)],
            category: recipeData.mealType?.[0] || 'Main Course',
            origin: recipeData.cuisineType?.[0] || 'International',
            components: recipeData.ingredientLines || [],
            steps: recipeData.instructions || ['Follow the recipe instructions carefully.'],
            nutritionalInfo: {
                energy: Math.round(recipeData.calories / (recipeData.yield || 4)) || 0,
                protein: Math.round((nutritionInfo.PROCNT?.quantity || 0) / (recipeData.yield || 4)) || 0,
                carbohydrates: Math.round((nutritionInfo.CHOCDF?.quantity || 0) / (recipeData.yield || 4)) || 0,
                fats: Math.round((nutritionInfo.FAT?.quantity || 0) / (recipeData.yield || 4)) || 0
            },
            labels: recipeData.healthLabels || [],
            originSource: recipeData.source,
            recipeUrl: recipeData.url,
            userRating: this.getUserRating(recipeData.uri?.split('#')[1]),
            totalReviews: Math.floor(Math.random() * 100) + 1
        };
    }

    getUserRating(recipeIdentifier) {
        const allRatings = JSON.parse(localStorage.getItem('recipeRatings')) || {};
        return allRatings[recipeIdentifier]?.rating || (Math.random() * 1 + 4).toFixed(1);
    }

    getBackupRecipes() {
        return [
            {
                identifier: '1',
                name: 'Classic Spaghetti Carbonara',
                imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
                summary: 'Creamy Italian pasta with eggs, cheese, and pancetta',
                preparationTime: 15,
                cookingTime: 20,
                servingSize: 4,
                complexity: 'Moderate',
                category: 'Main Course',
                origin: 'Italian',
                components: ['400g spaghetti', '200g pancetta', '4 eggs', '100g Parmesan cheese', 'Black pepper', 'Salt'],
                steps: [
                    'Cook spaghetti according to package instructions',
                    'Fry pancetta until crispy',
                    'Whisk eggs with grated Parmesan',
                    'Combine hot pasta with pancetta, then mix in egg mixture',
                    'Season with black pepper and serve immediately'
                ],
                nutritionalInfo: { energy: 450, protein: 25, carbohydrates: 55, fats: 15 },
                labels: ['Pasta', 'Italian', 'Comfort Food'],
                userRating: 4.5,
                totalReviews: 128
            },
            {
                identifier: '2',
                name: 'Fresh Garden Salad',
                imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
                summary: 'Healthy salad with mixed greens and vinaigrette',
                preparationTime: 10,
                cookingTime: 0,
                servingSize: 2,
                complexity: 'Simple',
                category: 'Salad',
                origin: 'International',
                components: ['Mixed greens', 'Cherry tomatoes', 'Cucumber', 'Red onion', 'Olive oil', 'Lemon juice', 'Salt', 'Pepper'],
                steps: [
                    'Wash and chop all vegetables',
                    'Combine in a large bowl',
                    'Whisk together olive oil and lemon juice',
                    'Toss salad with dressing and season'
                ],
                nutritionalInfo: { energy: 120, protein: 3, carbohydrates: 8, fats: 9 },
                labels: ['Healthy', 'Vegetarian', 'Quick'],
                userRating: 4.2,
                totalReviews: 89
            },
            {
                identifier: '3',
                name: 'Chicken Stir Fry',
                imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
                summary: 'Quick and healthy chicken stir fry with vegetables',
                preparationTime: 15,
                cookingTime: 10,
                servingSize: 3,
                complexity: 'Simple',
                category: 'Main Course',
                origin: 'Asian',
                components: ['2 chicken breasts', '2 bell peppers', '1 onion', '2 cloves garlic', 'Soy sauce', 'Ginger', 'Vegetable oil'],
                steps: [
                    'Slice chicken and vegetables',
                    'Heat oil in a wok',
                    'Stir-fry chicken until cooked',
                    'Add vegetables and sauce',
                    'Cook until vegetables are tender-crisp'
                ],
                nutritionalInfo: { energy: 280, protein: 30, carbohydrates: 12, fats: 8 },
                labels: ['Healthy', 'Quick', 'High-Protein'],
                userRating: 4.4,
                totalReviews: 156
            }
        ];
    }

    displayRecipes() {
        const recipeContainer = document.getElementById('recipeList');
        if (!recipeContainer) return;

        if (this.displayedRecipes.length === 0) {
            recipeContainer.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <i data-lucide="search" class="w-12 h-12 text-gray-400 mx-auto mb-4"></i>
                    <p class="text-gray-500">No recipes match your criteria. Try adjusting your search.</p>
                </div>
            `;
            return;
        }

        recipeContainer.innerHTML = this.displayedRecipes.map(recipe => 
            this.uiState.displayMode === 'grid' 
                ? this.generateRecipeCard(recipe)
                : this.generateRecipeCardList(recipe)
        ).join('');
        
        this.attachCardInteractions();
        
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    generateRecipeCard(recipe) {
        const favoriteRecipes = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFavorited = favoriteRecipes.includes(recipe.identifier);
        const ratingValue = recipe.userRating || 0;
        const reviewCount = recipe.totalReviews || 0;

        return `
            <article class="recipe-card group" data-recipe-id="${recipe.identifier}">
                <div class="relative overflow-hidden">
                    <img src="${recipe.imageUrl}" 
                         alt="${recipe.name}"
                         class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                         loading="lazy">
                    <div class="absolute top-3 right-3 flex gap-1">
                        <button class="favorite-btn action-btn ${isFavorited ? 'favorite active' : ''} w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                                data-recipe-id="${recipe.identifier}"
                                aria-label="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                            <i data-lucide="heart" class="w-4 h-4 ${isFavorited ? 'fill-current' : ''}"></i>
                        </button>
                    </div>
                    <div class="absolute top-3 left-3">
                        <span class="complexity-${recipe.complexity.toLowerCase()} px-2 py-1 rounded-full text-xs font-semibold text-white">
                            ${recipe.complexity}
                        </span>
                    </div>
                </div>
                
                <div class="p-4">
                    <div class="flex items-start justify-between mb-2">
                        <h3 class="font-semibold text-lg line-clamp-2 flex-1 mr-2">${recipe.name}</h3>
                        <button class="recipe-more-btn text-gray-500 hover:text-gray-700 transition-colors"
                                data-recipe-id="${recipe.identifier}"
                                aria-label="More options">
                            <i data-lucide="more-vertical" class="w-5 h-5"></i>
                        </button>
                    </div>
                    
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">${recipe.summary}</p>
                    
                    <!-- Rating Section -->
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex items-center gap-2">
                            <div class="star-rating" data-recipe-id="${recipe.identifier}">
                                ${this.generateStarRating(ratingValue)}
                            </div>
                            <span class="text-xs text-gray-500">(${reviewCount})</span>
                        </div>
                        <button class="rate-recipe-btn text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                                data-recipe-id="${recipe.identifier}">
                            Rate Recipe
                        </button>
                    </div>
                    
                    <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span class="flex items-center gap-1">
                            <i data-lucide="clock" class="w-4 h-4"></i>
                            ${recipe.preparationTime + (recipe.cookingTime || 0)} mins
                        </span>
                        <span class="flex items-center gap-1">
                            <i data-lucide="users" class="w-4 h-4"></i>
                            ${recipe.servingSize}
                        </span>
                        <span class="flex items-center gap-1">
                            <i data-lucide="flame" class="w-4 h-4"></i>
                            ${recipe.nutritionalInfo.energy} cal
                        </span>
                    </div>
                    
                    <div class="nutrition-preview grid grid-cols-3 gap-2 text-xs mb-3">
                        <div class="text-center p-1 bg-gray-100 dark:bg-gray-800 rounded">
                            <div class="font-semibold">${recipe.nutritionalInfo.protein}g</div>
                            <div class="text-gray-500">Protein</div>
                        </div>
                        <div class="text-center p-1 bg-gray-100 dark:bg-gray-800 rounded">
                            <div class="font-semibold">${recipe.nutritionalInfo.carbohydrates}g</div>
                            <div class="text-gray-500">Carbs</div>
                        </div>
                        <div class="text-center p-1 bg-gray-100 dark:bg-gray-800 rounded">
                            <div class="font-semibold">${recipe.nutritionalInfo.fats}g</div>
                            <div class="text-gray-500">Fats</div>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        <button class="view-recipe-btn flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm"
                                data-recipe-id="${recipe.identifier}">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                            View
                        </button>
                        <button class="add-to-tracker-btn inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                                data-recipe-id="${recipe.identifier}"
                                aria-label="Add to nutrition tracker">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    generateRecipeCardList(recipe) {
        const favoriteRecipes = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFavorited = favoriteRecipes.includes(recipe.identifier);
        const ratingValue = recipe.userRating || 0;
        const reviewCount = recipe.totalReviews || 0;

        return `
            <article class="recipe-card group" data-recipe-id="${recipe.identifier}">
                <div class="relative overflow-hidden flex-shrink-0" style="width: 200px;">
                    <img src="${recipe.imageUrl}" 
                         alt="${recipe.name}"
                         class="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                         loading="lazy">
                    <div class="absolute top-2 right-2 flex gap-1">
                        <button class="favorite-btn action-btn ${isFavorited ? 'favorite active' : ''} w-6 h-6 bg-white/90 backdrop-blur rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                                data-recipe-id="${recipe.identifier}"
                                aria-label="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                            <i data-lucide="heart" class="w-3 h-3 ${isFavorited ? 'fill-current' : ''}"></i>
                        </button>
                    </div>
                    <div class="absolute top-2 left-2">
                        <span class="complexity-${recipe.complexity.toLowerCase()} px-2 py-1 rounded-full text-xs font-semibold text-white">
                            ${recipe.complexity}
                        </span>
                    </div>
                </div>
                
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between mb-2">
                        <h3 class="font-semibold text-lg line-clamp-1 flex-1 mr-2">${recipe.name}</h3>
                        <button class="recipe-more-btn text-gray-500 hover:text-gray-700 transition-colors"
                                data-recipe-id="${recipe.identifier}"
                                aria-label="More options">
                            <i data-lucide="more-vertical" class="w-5 h-5"></i>
                        </button>
                    </div>
                    
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">${recipe.summary}</p>
                    
                    <!-- Rating Section -->
                    <div class="flex items-center gap-4 mb-3">
                        <div class="flex items-center gap-2">
                            <div class="star-rating" data-recipe-id="${recipe.identifier}">
                                ${this.generateStarRating(ratingValue)}
                            </div>
                            <span class="text-xs text-gray-500">(${reviewCount})</span>
                        </div>
                        <button class="rate-recipe-btn text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                                data-recipe-id="${recipe.identifier}">
                            Rate Recipe
                        </button>
                    </div>
                    
                    <div class="flex items-center gap-6 text-sm text-gray-500 mb-3">
                        <span class="flex items-center gap-1">
                            <i data-lucide="clock" class="w-4 h-4"></i>
                            ${recipe.preparationTime + (recipe.cookingTime || 0)} mins
                        </span>
                        <span class="flex items-center gap-1">
                            <i data-lucide="users" class="w-4 h-4"></i>
                            ${recipe.servingSize} servings
                        </span>
                        <span class="flex items-center gap-1">
                            <i data-lucide="flame" class="w-4 h-4"></i>
                            ${recipe.nutritionalInfo.energy} cal
                        </span>
                    </div>
                    
                    <div class="nutrition-preview grid grid-cols-4 gap-2 text-xs mb-3 max-w-md">
                        <div class="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                            <div class="font-semibold">${recipe.nutritionalInfo.protein}g</div>
                            <div class="text-gray-500">Protein</div>
                        </div>
                        <div class="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                            <div class="font-semibold">${recipe.nutritionalInfo.carbohydrates}g</div>
                            <div class="text-gray-500">Carbs</div>
                        </div>
                        <div class="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                            <div class="font-semibold">${recipe.nutritionalInfo.fats}g</div>
                            <div class="text-gray-500">Fats</div>
                        </div>
                        <div class="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                            <div class="font-semibold">${recipe.nutritionalInfo.energy}</div>
                            <div class="text-gray-500">Calories</div>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        <button class="view-recipe-btn inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm"
                                data-recipe-id="${recipe.identifier}">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                            View Recipe
                        </button>
                        <button class="add-to-tracker-btn inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                                data-recipe-id="${recipe.identifier}"
                                aria-label="Add to nutrition tracker">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                            Track
                        </button>
                        <button class="add-to-plan-btn inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-sm"
                                data-recipe-id="${recipe.identifier}">
                            <i data-lucide="calendar" class="w-4 h-4"></i>
                            Plan
                        </button>
                    </div>
                </div>
            </article>
        `;
    }

    attachCardInteractions() {
        // View recipe buttons
        document.querySelectorAll('.view-recipe-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const recipeId = e.currentTarget.dataset.recipeId;
                this.showRecipeDetails(recipeId);
            });
        });

        // Favorite buttons
        document.querySelectorAll('.favorite-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = e.currentTarget.dataset.recipeId;
                this.toggleFavoriteStatus(recipeId);
            });
        });

        // Add to tracker buttons
        document.querySelectorAll('.add-to-tracker-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = e.currentTarget.dataset.recipeId;
                this.addToNutritionLog(recipeId);
            });
        });

        // Add to plan buttons
        document.querySelectorAll('.add-to-plan-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = e.currentTarget.dataset.recipeId;
                const recipe = this.recipeCollection.find(r => r.identifier === recipeId);
                if (recipe) {
                    this.openMealPlanModal(recipe);
                }
            });
        });

        // Rate recipe buttons
        document.querySelectorAll('.rate-recipe-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = e.currentTarget.dataset.recipeId;
                this.displayRatingInterface(recipeId);
            });
        });

        // Star rating click to rate
        document.querySelectorAll('.star-rating').forEach(ratingElement => {
            ratingElement.addEventListener('click', (e) => {
                if (e.target.closest('.star')) {
                    const recipeId = ratingElement.dataset.recipeId;
                    const stars = ratingElement.querySelectorAll('.star');
                    const clickedStarIndex = Array.from(stars).indexOf(e.target.closest('.star'));
                    const rating = clickedStarIndex + 1;
                    this.saveUserRating(recipeId, rating);
                }
            });
        });
    }

    showRecipeDetails(recipeIdentifier) {
        const recipe = this.recipeCollection.find(r => r.identifier === recipeIdentifier);
        if (!recipe) return;

        const modal = document.getElementById('recipeModal');
        const modalContent = document.getElementById('modalBody');
        const modalHeader = document.getElementById('modalTitle');

        if (!modal || !modalContent || !modalHeader) return;

        modalHeader.textContent = recipe.name;
        modalContent.innerHTML = this.generateModalContent(recipe);
        
        this.openModalWindow(modal);
        this.attachModalInteractions(recipe);
        
        if (window.lucide) {
            lucide.createIcons();
        }

        // Add to recently viewed
        this.addToRecentlyViewed(recipe);
    }

    generateModalContent(recipe) {
        const favoriteRecipes = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFavorited = favoriteRecipes.includes(recipe.identifier);
        const ratingValue = recipe.userRating || 0;
        const reviewCount = recipe.totalReviews || 0;

        return `
            <div class="space-y-6">
                <!-- Recipe Header -->
                <div class="flex flex-col lg:flex-row gap-6">
                    <div class="lg:w-1/2">
                        <img src="${recipe.imageUrl}" 
                             alt="${recipe.name}"
                             class="w-full h-64 lg:h-80 object-cover rounded-2xl shadow-lg">
                    </div>
                    <div class="lg:w-1/2 space-y-4">
                        <div class="flex items-start justify-between">
                            <h2 class="text-2xl font-bold">${recipe.name}</h2>
                            <button class="favorite-btn action-btn ${isFavorited ? 'favorite active' : ''} p-2 rounded-lg transition-colors"
                                    data-recipe-id="${recipe.identifier}">
                                <i data-lucide="heart" class="w-6 h-6 ${isFavorited ? 'fill-current' : ''}"></i>
                            </button>
                        </div>
                        
                        <p class="text-gray-600 dark:text-gray-400">${recipe.summary}</p>
                        
                        <!-- Rating Section in Modal -->
                        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <div class="star-rating text-2xl" data-recipe-id="${recipe.identifier}">
                                        ${this.generateStarRating(ratingValue)}
                                    </div>
                                    <div>
                                        <div class="font-semibold text-lg">${ratingValue.toFixed(1)}</div>
                                        <div class="text-sm text-gray-500">${reviewCount} ratings</div>
                                    </div>
                                </div>
                                <button class="rate-recipe-modal-btn inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                        data-recipe-id="${recipe.identifier}">
                                    <i data-lucide="star" class="w-4 h-4"></i>
                                    Rate Recipe
                                </button>
                            </div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">
                                Share your experience with this recipe
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <i data-lucide="clock" class="w-6 h-6 mx-auto mb-2 text-emerald-600"></i>
                                <div class="font-semibold">${recipe.preparationTime + (recipe.cookingTime || 0)} min</div>
                                <div class="text-sm text-gray-500">Total Time</div>
                            </div>
                            <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <i data-lucide="users" class="w-6 h-6 mx-auto mb-2 text-emerald-600"></i>
                                <div class="font-semibold">${recipe.servingSize}</div>
                                <div class="text-sm text-gray-500">Servings</div>
                            </div>
                            <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <i data-lucide="flame" class="w-6 h-6 mx-auto mb-2 text-emerald-600"></i>
                                <div class="font-semibold">${recipe.nutritionalInfo.energy}</div>
                                <div class="text-sm text-gray-500">Calories</div>
                            </div>
                            <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <i data-lucide="chef-hat" class="w-6 h-6 mx-auto mb-2 text-emerald-600"></i>
                                <div class="font-semibold">${recipe.complexity}</div>
                                <div class="text-sm text-gray-500">Level</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-wrap gap-3">
                    <button class="add-to-plan-btn inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            data-recipe-id="${recipe.identifier}">
                        <i data-lucide="calendar" class="w-4 h-4"></i>
                        Add to Meal Plan
                    </button>
                    <button class="add-to-tracker-modal-btn inline-flex items-center gap-2 px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            data-recipe-id="${recipe.identifier}">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        Add to Nutrition Tracker
                    </button>
                    <button class="share-recipe-btn inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            data-recipe-id="${recipe.identifier}">
                        <i data-lucide="share-2" class="w-4 h-4"></i>
                        Share
                    </button>
                    <button class="print-recipe-btn inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            data-recipe-id="${recipe.identifier}">
                        <i data-lucide="printer" class="w-4 h-4"></i>
                        Print
                    </button>
                </div>

                <!-- Nutrition Information -->
                <div class="nutrition-tracker-section">
                    <div class="nutrition-tracker-header">
                        <h3 class="text-lg font-semibold">Nutrition Information</h3>
                        <span class="text-sm text-emerald-600 font-medium">Per Serving</span>
                    </div>
                    
                    <div class="nutrition-summary">
                        <div class="nutrition-summary-item">
                            <span class="nutrition-summary-value">${recipe.nutritionalInfo.energy}</span>
                            <span class="nutrition-summary-label">Calories</span>
                        </div>
                        <div class="nutrition-summary-item">
                            <span class="nutrition-summary-value">${recipe.nutritionalInfo.protein}g</span>
                            <span class="nutrition-summary-label">Protein</span>
                        </div>
                        <div class="nutrition-summary-item">
                            <span class="nutrition-summary-value">${recipe.nutritionalInfo.carbohydrates}g</span>
                            <span class="nutrition-summary-label">Carbs</span>
                        </div>
                        <div class="nutrition-summary-item">
                            <span class="nutrition-summary-value">${recipe.nutritionalInfo.fats}g</span>
                            <span class="nutrition-summary-label">Fats</span>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <button class="add-to-tracker-full-btn w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                                data-recipe-id="${recipe.identifier}">
                            <i data-lucide="activity" class="w-5 h-5"></i>
                            Add to Daily Nutrition Tracker
                        </button>
                    </div>
                </div>

                <!-- Ingredients & Instructions -->
                <div class="ingredients-instructions-grid">
                    <div class="ingredients-column">
                        <div class="ingredients-header">
                            <h3 class="text-lg font-semibold mb-3">Ingredients</h3>
                            <p class="text-sm text-gray-500">Serves ${recipe.servingSize}</p>
                            <button class="copy-ingredients-btn mt-2 inline-flex items-center gap-2 px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                <i data-lucide="copy" class="w-3 h-3"></i>
                                Copy Ingredients
                            </button>
                        </div>
                        <div class="ingredients-list">
                            ${recipe.components.map((component, index) => `
                                <div class="ingredient-item">
                                    <label class="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" class="ingredient-checkbox">
                                        <span>${component}</span>
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="instructions-column">
                        <div class="instructions-header">
                            <h3 class="text-lg font-semibold mb-3">Instructions</h3>
                            <p class="text-sm text-gray-500">Step by step guide</p>
                            <button class="copy-instructions-btn mt-2 inline-flex items-center gap-2 px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                <i data-lucide="copy" class="w-3 h-3"></i>
                                Copy Instructions
                            </button>
                        </div>
                        <div class="instructions-list">
                            ${recipe.steps.map((step, index) => `
                                <div class="instruction-item">
                                    <div class="flex items-start gap-3">
                                        <div class="instruction-number">${index + 1}</div>
                                        <p>${step}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachModalInteractions(recipe) {
        // Favorite button in modal
        const favoriteButton = document.querySelector('#recipeModal .favorite-btn');
        if (favoriteButton) {
            favoriteButton.addEventListener('click', () => {
                this.toggleFavoriteStatus(recipe.identifier);
                const isFavorited = localStorage.getItem('favorites')?.includes(recipe.identifier);
                favoriteButton.classList.toggle('active', isFavorited);
                favoriteButton.querySelector('i').classList.toggle('fill-current', isFavorited);
            });
        }

        // Add to plan button
        const planButton = document.querySelector('#recipeModal .add-to-plan-btn');
        if (planButton) {
            planButton.addEventListener('click', () => {
                this.openMealPlanModal(recipe);
            });
        }

        // Add to tracker buttons
        document.querySelectorAll('#recipeModal .add-to-tracker-modal-btn, #recipeModal .add-to-tracker-full-btn').forEach(button => {
            button.addEventListener('click', () => {
                this.addToNutritionLog(recipe.identifier);
            });
        });

        // Rate recipe button in modal
        const rateButton = document.querySelector('#recipeModal .rate-recipe-modal-btn');
        if (rateButton) {
            rateButton.addEventListener('click', () => {
                this.displayRatingInterface(recipe.identifier);
            });
        }

        // Share recipe button
        const shareButton = document.querySelector('#recipeModal .share-recipe-btn');
        if (shareButton) {
            shareButton.addEventListener('click', () => {
                this.shareRecipe(recipe);
            });
        }

        // Print recipe button
        const printButton = document.querySelector('#recipeModal .print-recipe-btn');
        if (printButton) {
            printButton.addEventListener('click', () => {
                this.printRecipe(recipe);
            });
        }

        // Copy ingredients button
        const copyIngredientsButton = document.querySelector('#recipeModal .copy-ingredients-btn');
        if (copyIngredientsButton) {
            copyIngredientsButton.addEventListener('click', () => {
                this.copyIngredientsToClipboard(recipe);
            });
        }

        // Copy instructions button
        const copyInstructionsButton = document.querySelector('#recipeModal .copy-instructions-btn');
        if (copyInstructionsButton) {
            copyInstructionsButton.addEventListener('click', () => {
                this.copyInstructionsToClipboard(recipe);
            });
        }

        // Star rating in modal
        const starRating = document.querySelector('#recipeModal .star-rating');
        if (starRating) {
            starRating.addEventListener('click', (e) => {
                if (e.target.closest('.star')) {
                    const stars = starRating.querySelectorAll('.star');
                    const clickedIndex = Array.from(stars).indexOf(e.target.closest('.star'));
                    const rating = clickedIndex + 1;
                    this.saveUserRating(recipe.identifier, rating);
                }
            });
        }

        // Ingredient checkboxes
        document.querySelectorAll('#recipeModal .ingredient-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const ingredientItem = e.target.closest('.ingredient-item');
                if (e.target.checked) {
                    ingredientItem.style.opacity = '0.6';
                    ingredientItem.style.textDecoration = 'line-through';
                } else {
                    ingredientItem.style.opacity = '1';
                    ingredientItem.style.textDecoration = 'none';
                }
            });
        });
    }

    // NEW FEATURE: Copy ingredients to clipboard
    copyIngredientsToClipboard(recipe) {
        const ingredientsText = recipe.components.map(ingredient => `• ${ingredient}`).join('\n');
        navigator.clipboard.writeText(`Ingredients for ${recipe.name}:\n\n${ingredientsText}`)
            .then(() => {
                this.showMessage('Ingredients copied to clipboard!', 'success');
            })
            .catch(() => {
                this.showMessage('Failed to copy ingredients', 'error');
            });
    }

    // NEW FEATURE: Copy instructions to clipboard
    copyInstructionsToClipboard(recipe) {
        const instructionsText = recipe.steps.map((step, index) => `${index + 1}. ${step}`).join('\n\n');
        navigator.clipboard.writeText(`Instructions for ${recipe.name}:\n\n${instructionsText}`)
            .then(() => {
                this.showMessage('Instructions copied to clipboard!', 'success');
            })
            .catch(() => {
                this.showMessage('Failed to copy instructions', 'error');
            });
    }

    // NEW FEATURE: Print recipe
    printRecipe(recipe) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${recipe.name} - Spoonfull</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 2rem; }
                    .recipe-header { text-align: center; margin-bottom: 2rem; }
                    .recipe-image { max-width: 300px; height: auto; margin: 1rem auto; }
                    .nutrition-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 2rem 0; }
                    .nutrition-item { text-align: center; padding: 1rem; border: 1px solid #ddd; border-radius: 0.5rem; }
                    .ingredients-list, .instructions-list { margin: 2rem 0; }
                    .ingredient-item, .instruction-item { margin: 0.5rem 0; }
                    .instruction-number { font-weight: bold; margin-right: 0.5rem; }
                    @media print { body { margin: 1rem; } }
                </style>
            </head>
            <body>
                <div class="recipe-header">
                    <h1>${recipe.name}</h1>
                    <p>${recipe.summary}</p>
                    <img src="${recipe.imageUrl}" alt="${recipe.name}" class="recipe-image">
                </div>
                
                <div class="nutrition-grid">
                    <div class="nutrition-item">
                        <strong>${recipe.preparationTime + (recipe.cookingTime || 0)} min</strong>
                        <div>Total Time</div>
                    </div>
                    <div class="nutrition-item">
                        <strong>${recipe.servingSize}</strong>
                        <div>Servings</div>
                    </div>
                    <div class="nutrition-item">
                        <strong>${recipe.nutritionalInfo.energy}</strong>
                        <div>Calories</div>
                    </div>
                    <div class="nutrition-item">
                        <strong>${recipe.complexity}</strong>
                        <div>Level</div>
                    </div>
                </div>

                <div class="ingredients-list">
                    <h2>Ingredients</h2>
                    <p><em>Serves ${recipe.servingSize}</em></p>
                    ${recipe.components.map(ingredient => `<div class="ingredient-item">• ${ingredient}</div>`).join('')}
                </div>

                <div class="instructions-list">
                    <h2>Instructions</h2>
                    ${recipe.steps.map((step, index) => `
                        <div class="instruction-item">
                            <span class="instruction-number">${index + 1}.</span>
                            ${step}
                        </div>
                    `).join('')}
                </div>

                <div class="nutrition-info">
                    <h2>Nutrition Information</h2>
                    <p><em>Per serving</em></p>
                    <p>Calories: ${recipe.nutritionalInfo.energy} | Protein: ${recipe.nutritionalInfo.protein}g | Carbs: ${recipe.nutritionalInfo.carbohydrates}g | Fats: ${recipe.nutritionalInfo.fats}g</p>
                </div>

                <footer style="margin-top: 3rem; text-align: center; color: #666;">
                    <p>Printed from Spoonfull Recipe App</p>
                    <p>${new Date().toLocaleDateString()}</p>
                </footer>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }

    // NEW FEATURE: Share recipe
    shareRecipe(recipe) {
        if (navigator.share) {
            navigator.share({
                title: recipe.name,
                text: recipe.summary,
                url: window.location.href + '#recipe-' + recipe.identifier,
            })
            .then(() => this.showMessage('Recipe shared successfully!', 'success'))
            .catch(() => this.showMessage('Sharing cancelled', 'info'));
        } else {
            // Fallback: copy to clipboard
            const shareText = `${recipe.name}\n\n${recipe.summary}\n\nIngredients:\n${recipe.components.map(ing => '• ' + ing).join('\n')}\n\nInstructions:\n${recipe.steps.map((step, i) => `${i + 1}. ${step}`).join('\n\n')}`;
            
            navigator.clipboard.writeText(shareText)
                .then(() => {
                    this.showMessage('Recipe details copied to clipboard!', 'success');
                })
                .catch(() => {
                    this.showMessage('Sharing not supported', 'error');
                });
        }
    }

    toggleFavoriteStatus(recipeIdentifier) {
        const favoriteRecipes = JSON.parse(localStorage.getItem('favorites')) || [];
        const recipe = this.recipeCollection.find(r => r.identifier === recipeIdentifier);
        const index = favoriteRecipes.indexOf(recipeIdentifier);
        
        if (index > -1) {
            favoriteRecipes.splice(index, 1);
            this.toastManager.favoriteRemoved(recipe.name);
        } else {
            favoriteRecipes.push(recipeIdentifier);
            this.toastManager.favoriteAdded(recipe.name);
        }
        
        localStorage.setItem('favorites', JSON.stringify(favoriteRecipes));
        this.refreshFavoriteButtons(recipeIdentifier);
        this.profileManager.updateRecipeStats();
        
        // Trigger event for other components
        window.dispatchEvent(new CustomEvent('favoritesUpdated'));
    }

    refreshFavoriteButtons(recipeIdentifier) {
        const favoriteRecipes = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFavorited = favoriteRecipes.includes(recipeIdentifier);
        
        document.querySelectorAll(`[data-recipe-id="${recipeIdentifier}"] .favorite-btn`).forEach(button => {
            button.classList.toggle('active', isFavorited);
            button.querySelector('i').classList.toggle('fill-current', isFavorited);
            button.setAttribute('aria-label', isFavorited ? 'Remove from favorites' : 'Add to favorites');
        });
    }

    applyRecipeFilters() {
        if (this.uiState.showFavorites) {
            const favoriteRecipes = JSON.parse(localStorage.getItem('favorites')) || [];
            this.displayedRecipes = this.recipeCollection.filter(recipe => 
                favoriteRecipes.includes(recipe.identifier)
            );
        } else {
            this.displayedRecipes = [...this.recipeCollection];
        }
    }

    performSearch(searchTerm) {
        this.pagination.currentPage = 1;
        this.uiState.searchTerm = searchTerm;
        this.fetchRecipes(searchTerm);
    }

    switchFavoritesView() {
        this.uiState.showFavorites = !this.uiState.showFavorites;
        this.applyRecipeFilters();
        this.displayRecipes();
        this.updateResultsCounter();
        
        const favoritesSwitch = document.getElementById('favoritesToggle');
        if (favoritesSwitch) {
            if (this.uiState.showFavorites) {
                favoritesSwitch.classList.add('active');
                favoritesSwitch.innerHTML = '<i data-lucide="heart" class="w-4 h-4 fill-current"></i> All Recipes';
            } else {
                favoritesSwitch.classList.remove('active');
                favoritesSwitch.innerHTML = '<i data-lucide="heart" class="w-4 h-4"></i> Favorites';
            }
            if (window.lucide) lucide.createIcons();
        }
    }

    selectRandomRecipe() {
        if (this.recipeCollection.length === 0) {
            this.showMessage('Please wait while recipes are loading...', 'info');
            return;
        }
        
        const randomRecipe = this.recipeCollection[Math.floor(Math.random() * this.recipeCollection.length)];
        this.showRecipeDetails(randomRecipe.identifier);
    }

    changeDisplayMode(viewMode) {
        this.uiState.displayMode = viewMode;
        const recipeContainer = document.getElementById('recipeList');
        
        if (recipeContainer) {
            recipeContainer.className = viewMode === 'grid' ? 'recipe-grid' : 'recipe-list';
            this.displayRecipes();
        }

        // Update active state of view buttons
        document.querySelectorAll('.view-btn').forEach(button => {
            button.classList.toggle('active', button.dataset.view === viewMode);
        });
    }

    applyFilter(button) {
        const filterCategory = button.dataset.filterType;
        const filterValue = button.dataset.filterValue;
        
        if (!filterCategory) return;

        // Toggle active state
        document.querySelectorAll(`[data-filter-type="${filterCategory}"]`).forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // Apply filter
        this.applyRecipeFilters();
    }

    openModalWindow(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModalWindow() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    openMealPlanModal(recipe) {
        const modal = document.getElementById('planModal');
        const modalHeader = document.getElementById('planModalTitle');
        
        if (modal && modalHeader) {
            modalHeader.textContent = `Add "${recipe.name}" to Meal Plan`;
            this.selectedRecipe = recipe;
            this.openModalWindow(modal);
        }
    }

    launchTimer() {
        const modal = document.getElementById('timerModal');
        if (modal) {
            this.openModalWindow(modal);
        }
    }

    updateResultsCounter() {
        const counter = document.getElementById('resultCount');
        if (counter) {
            counter.textContent = this.displayedRecipes.length;
        }
    }

    displayLoading() {
        const recipeContainer = document.getElementById('recipeList');
        if (recipeContainer) {
            recipeContainer.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <div class="loading-spinner mx-auto mb-4 w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <p class="text-gray-500">Loading delicious recipes...</p>
                </div>
            `;
        }
    }

    hideLoading() {
        // Loading state is removed when recipes are rendered
    }

    displayError(message) {
        const recipeContainer = document.getElementById('recipeList');
        if (recipeContainer) {
            recipeContainer.innerHTML = `
                <div class="col-span-3 text-center py-12">
                    <i data-lucide="alert-circle" class="w-12 h-12 text-red-500 mx-auto mb-4"></i>
                    <div class="text-red-500 mb-4">${message}</div>
                    <button onclick="window.recipeManager.fetchRecipes()" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                        Try Again
                    </button>
                </div>
            `;
            if (window.lucide) {
                lucide.createIcons();
            }
        }
    }

    loadBackupRecipes() {
        this.recipeCollection = this.getBackupRecipes();
        this.displayedRecipes = [...this.recipeCollection];
        this.displayRecipes();
        this.updateResultsCounter();
        this.refreshDailyRecipe();
    }

    createDelayedHandler(func, delay) {
        let timeoutId;
        return function executedFunction(...args) {
            const executeLater = () => {
                clearTimeout(timeoutId);
                func(...args);
            };
            clearTimeout(timeoutId);
            timeoutId = setTimeout(executeLater, delay);
        };
    }

    showMessage(message, type = 'info') {
        this.toastManager.show(message, type);
    }

    refreshDailyRecipe() {
        if (this.recipeCollection.length === 0) return;

        const today = new Date().toDateString();
        const dailyIndex = this.generateHash(today) % this.recipeCollection.length;
        const dailyRecipe = this.recipeCollection[dailyIndex];

        const titleElement = document.getElementById('recipeOfDayTitle');
        const descElement = document.getElementById('recipeOfDayDesc');
        const timeElement = document.getElementById('recipeOfDayTime');
        const servingsElement = document.getElementById('recipeOfDayServings');
        const caloriesElement = document.getElementById('recipeOfDayCalories');

        if (titleElement) titleElement.textContent = dailyRecipe.name;
        if (descElement) descElement.textContent = dailyRecipe.summary;
        if (timeElement) timeElement.textContent = `${dailyRecipe.preparationTime + (dailyRecipe.cookingTime || 0)} mins`;
        if (servingsElement) servingsElement.textContent = `${dailyRecipe.servingSize} servings`;
        if (caloriesElement) caloriesElement.textContent = `${dailyRecipe.nutritionalInfo.energy} cal`;

        this.dailyRecipe = dailyRecipe;
        this.startDailyRecipeTimer();
    }

    generateHash(inputString) {
        let hashValue = 0;
        for (let i = 0; i < inputString.length; i++) {
            hashValue = ((hashValue << 5) - hashValue) + inputString.charCodeAt(i);
            hashValue |= 0;
        }
        return Math.abs(hashValue);
    }

    startDailyRecipeTimer() {
        const updateCountdown = () => {
            const currentTime = new Date();
            const nextDay = new Date(currentTime);
            nextDay.setDate(nextDay.getDate() + 1);
            nextDay.setHours(0, 0, 0, 0);
            
            const timeDifference = nextDay - currentTime;
            const hours = Math.floor(timeDifference / (1000 * 60 * 60));
            const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
            
            const timerElement = document.getElementById('nextRecipeTimer');
            if (timerElement) {
                timerElement.textContent = 
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        };

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    displayDailyRecipe() {
        if (this.dailyRecipe) {
            this.showRecipeDetails(this.dailyRecipe.identifier);
        } else {
            this.showMessage('Recipe of the day is not available yet. Please wait for recipes to load.', 'info');
        }
    }

    addToNutritionLog(recipeIdentifier) {
        const recipe = this.recipeCollection.find(r => r.identifier === recipeIdentifier);
        if (!recipe) return;

        const nutritionData = JSON.parse(localStorage.getItem('nutritionData')) || {
            dailyTargets: { energy: 2000, protein: 50, carbohydrates: 300, fats: 70 },
            today: { energy: 0, protein: 0, carbohydrates: 0, fats: 0 },
            history: []
        };

        nutritionData.today.energy += recipe.nutritionalInfo.energy;
        nutritionData.today.protein += recipe.nutritionalInfo.protein;
        nutritionData.today.carbohydrates += recipe.nutritionalInfo.carbohydrates;
        nutritionData.today.fats += recipe.nutritionalInfo.fats;

        nutritionData.history.unshift({
            recipeId: recipe.identifier,
            recipeName: recipe.name,
            energy: recipe.nutritionalInfo.energy,
            protein: recipe.nutritionalInfo.protein,
            carbohydrates: recipe.nutritionalInfo.carbohydrates,
            fats: recipe.nutritionalInfo.fats,
            timestamp: new Date().toISOString()
        });

        nutritionData.history = nutritionData.history.slice(0, 10);

        localStorage.setItem('nutritionData', JSON.stringify(nutritionData));
        this.updateNutritionDisplay();
        this.showMessage(`Added "${recipe.name}" to nutrition tracker`, 'success');
    }

    updateNutritionDisplay() {
        const nutritionData = JSON.parse(localStorage.getItem('nutritionData'));
        if (!nutritionData) return;

        // Update summary numbers
        document.querySelectorAll('.nutrition-summary-value').forEach(element => {
            const field = element.dataset.field;
            if (field && nutritionData.today[field] !== undefined) {
                element.textContent = nutritionData.today[field];
            }
        });

        // Update progress bars
        document.querySelectorAll('.nutrition-progress-fill').forEach(element => {
            const field = element.dataset.field;
            if (field && nutritionData.dailyTargets[field] > 0) {
                const percentage = Math.min((nutritionData.today[field] / nutritionData.dailyTargets[field]) * 100, 100);
                element.style.width = `${percentage}%`;
                
                const statsElement = element.closest('.nutrition-progress-item').querySelector('.nutrition-progress-stats');
                if (statsElement) {
                    statsElement.textContent = `${nutritionData.today[field]}/${nutritionData.dailyTargets[field]}g`;
                }
            }
        });

        // Update history
        this.updateNutritionHistory();
    }

    updateNutritionHistory() {
        const nutritionData = JSON.parse(localStorage.getItem('nutritionData'));
        if (!nutritionData) return;

        const historyContainer = document.querySelector('.nutrition-history-list');
        if (!historyContainer) return;

        historyContainer.innerHTML = nutritionData.history.map(item => `
            <div class="nutrition-history-item">
                <span class="nutrition-history-item-name">${item.recipeName}</span>
                <div class="nutrition-history-item-stats">
                    <span>${item.energy} cal</span>
                    <span>${item.protein}g protein</span>
                </div>
            </div>
        `).join('');
    }

    displayRatingInterface(recipeIdentifier) {
        const recipe = this.recipeCollection.find(r => r.identifier === recipeIdentifier);
        if (!recipe) return;

        const modal = document.getElementById('recipeModal');
        const modalContent = document.getElementById('modalBody');
        const modalHeader = document.getElementById('modalTitle');

        if (!modal || !modalContent || !modalHeader) return;

        modalHeader.textContent = `Rate: ${recipe.name}`;
        modalContent.innerHTML = this.generateRatingModalContent(recipe);
        
        this.openModalWindow(modal);
        this.attachRatingModalInteractions(recipe);
    }

    generateStarRating(ratingValue) {
        let starHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(ratingValue)) {
                starHTML += '<i data-lucide="star" class="star filled w-4 h-4 fill-current text-yellow-400"></i>';
            } else if (i === Math.ceil(ratingValue) && ratingValue % 1 !== 0) {
                starHTML += '<i data-lucide="star" class="star filled w-4 h-4 fill-current text-yellow-400" style="clip-path: inset(0 ' + (100 - (ratingValue % 1) * 100) + '% 0 0)"></i>';
            } else {
                starHTML += '<i data-lucide="star" class="star w-4 h-4 text-gray-300"></i>';
            }
        }
        return starHTML;
    }

    saveUserRating(recipeIdentifier, ratingValue, commentText = '') {
        const recipe = this.recipeCollection.find(r => r.identifier === recipeIdentifier);
        if (!recipe) return;

        const allRatings = JSON.parse(localStorage.getItem('recipeRatings')) || {};
        
        if (!allRatings[recipeIdentifier]) {
            allRatings[recipeIdentifier] = {
                totalScore: 0,
                ratingCount: 0,
                userScore: 0,
                userComments: []
            };
        }

        const ratingInfo = allRatings[recipeIdentifier];
        const previousUserScore = ratingInfo.userScore;

        if (previousUserScore > 0) {
            ratingInfo.totalScore = ratingInfo.totalScore - previousUserScore + ratingValue;
        } else {
            ratingInfo.totalScore += ratingValue;
            ratingInfo.ratingCount += 1;
        }

        ratingInfo.userScore = ratingValue;

        if (commentText.trim()) {
            ratingInfo.userComments.push({
                comment: commentText.trim(),
                date: new Date().toISOString(),
                rating: ratingValue
            });
        }

        recipe.userRating = ratingInfo.totalScore / ratingInfo.ratingCount;
        recipe.totalReviews = ratingInfo.ratingCount;

        localStorage.setItem('recipeRatings', JSON.stringify(allRatings));
        this.refreshRatingDisplay(recipeIdentifier);
        this.toastManager.recipeRated(recipe.name, ratingValue);
    }

    refreshRatingDisplay(recipeIdentifier) {
        const recipe = this.recipeCollection.find(r => r.identifier === recipeIdentifier);
        if (!recipe) return;

        const ratingElements = document.querySelectorAll(`[data-recipe-id="${recipeIdentifier}"] .star-rating`);
        ratingElements.forEach(element => {
            element.innerHTML = this.generateStarRating(recipe.userRating);
        });
    }

    generateRatingModalContent(recipe) {
        const allRatings = JSON.parse(localStorage.getItem('recipeRatings')) || {};
        const currentRating = allRatings[recipe.identifier]?.userScore || 0;
        
        return `
            <div class="text-center space-y-6">
                <div class="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                    <i data-lucide="star" class="w-8 h-8 text-emerald-600"></i>
                </div>
                
                <div>
                    <h3 class="text-xl font-semibold mb-2">Rate this Recipe</h3>
                    <p class="text-gray-600 dark:text-gray-400">How would you rate "${recipe.name}"?</p>
                </div>
                
                <div class="star-rating-large flex justify-center gap-1 text-4xl mb-4" data-recipe-id="${recipe.identifier}">
                    ${[1, 2, 3, 4, 5].map(i => `
                        <i data-lucide="star" 
                           class="star cursor-pointer transition-transform hover:scale-110 ${i <= currentRating ? 'filled text-yellow-400 fill-current' : 'text-gray-300'}"
                           data-rating="${i}"></i>
                    `).join('')}
                </div>
                
                <div class="rating-labels flex justify-between text-sm text-gray-500 max-w-md mx-auto">
                    <span>Poor</span>
                    <span>Fair</span>
                    <span>Good</span>
                    <span>Very Good</span>
                    <span>Excellent</span>
                </div>
                
                <div class="space-y-4 pt-4">
                    <textarea id="ratingComment" 
                              placeholder="Share your experience with this recipe (optional)..."
                              class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors resize-none"
                              rows="4"></textarea>
                    
                    <div class="flex gap-3">
                        <button id="submitRating" 
                                class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold">
                            <i data-lucide="check" class="w-5 h-5"></i>
                            Submit Rating
                        </button>
                        <button id="cancelRating" 
                                class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachRatingModalInteractions(recipe) {
        const stars = document.querySelectorAll('.star-rating-large .star');
        let selectedRating = 0;
        const allRatings = JSON.parse(localStorage.getItem('recipeRatings')) || {};
        const currentUserRating = allRatings[recipe.identifier]?.userScore || 0;
        selectedRating = currentUserRating;

        stars.forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.rating);
                this.updateStarDisplay(stars, selectedRating);
            });

            star.addEventListener('mouseenter', () => {
                const hoverRating = parseInt(star.dataset.rating);
                this.updateStarDisplay(stars, hoverRating, false);
            });
        });

        document.querySelector('.star-rating-large').addEventListener('mouseleave', () => {
            this.updateStarDisplay(stars, selectedRating);
        });

        const submitButton = document.getElementById('submitRating');
        if (submitButton) {
            submitButton.addEventListener('click', () => {
                if (selectedRating > 0) {
                    const comment = document.getElementById('ratingComment').value;
                    this.saveUserRating(recipe.identifier, selectedRating, comment);
                    this.closeModalWindow();
                } else {
                    this.showMessage('Please select a rating', 'error');
                }
            });
        }

        const cancelButton = document.getElementById('cancelRating');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                this.closeModalWindow();
            });
        }
    }

    updateStarDisplay(stars, rating, permanent = true) {
        stars.forEach((star, index) => {
            const starRating = index + 1;
            if (starRating <= rating) {
                star.classList.add('filled', 'text-yellow-400', 'fill-current');
                star.classList.remove('text-gray-300');
            } else {
                star.classList.remove('filled', 'text-yellow-400', 'fill-current');
                star.classList.add('text-gray-300');
            }
            
            if (permanent) {
                star.classList.remove('hover:scale-110');
            } else {
                star.classList.add('hover:scale-110');
            }
        });
    }

    addToRecentlyViewed(recipe) {
        const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
        
        // Remove if already exists
        const existingIndex = recentlyViewed.findIndex(r => r.identifier === recipe.identifier);
        if (existingIndex > -1) {
            recentlyViewed.splice(existingIndex, 1);
        }
        
        // Add to end
        recentlyViewed.push({
            identifier: recipe.identifier,
            name: recipe.name,
            imageUrl: recipe.imageUrl,
            preparationTime: recipe.preparationTime
        });
        
        // Keep only last 10
        if (recentlyViewed.length > 10) {
            recentlyViewed.shift();
        }
        
        localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
        this.updateRecentlyViewed();
    }

    updateRecentlyViewed() {
        const recentContainer = document.getElementById('recentRecipes');
        if (!recentContainer) return;

        const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
        
        if (recentlyViewed.length === 0) {
            recentContainer.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    <i data-lucide="eye-off" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
                    <p>No recently viewed recipes</p>
                </div>
            `;
            return;
        }

        // Show last 4 recently viewed recipes
        const recentToShow = recentlyViewed.slice(-4).reverse();
        
        recentContainer.innerHTML = recentToShow.map(recipe => `
            <div class="recipe-card">
                <div class="relative">
                    <img src="${recipe.imageUrl}" alt="${recipe.name}" class="w-full h-32 object-cover">
                </div>
                <div class="p-3">
                    <h3 class="font-semibold text-sm mb-1 line-clamp-2">${recipe.name}</h3>
                    <div class="flex items-center justify-between text-xs text-gray-500">
                        <span>${recipe.preparationTime} min</span>
                        <button onclick="window.recipeManager.showRecipeDetails('${recipe.identifier}')" class="text-emerald-600 hover:text-emerald-700">
                            View Again
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        if (window.lucide) {
            lucide.createIcons();
        }
    }
}

// Profile Synchronization for Recipes Page
class RecipeProfileManager {
    constructor() {
        this.profile = this.loadProfile();
        this.init();
    }

    init() {
        this.updateSidebarProfile();
        this.setupProfileSync();
        this.updateRecipeStats();
    }

    loadProfile() {
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

    updateSidebarProfile() {
        const sidebarName = document.getElementById('sidebarName');
        const sidebarEmail = document.getElementById('sidebarEmail');
        
        if (sidebarName) sidebarName.textContent = this.profile.name;
        if (sidebarEmail) sidebarEmail.textContent = this.profile.email;

        // Update welcome name if exists
        const welcomeName = document.getElementById('welcomeName');
        if (welcomeName) welcomeName.textContent = this.profile.name;
    }

    updateRecipeStats() {
        // Update favorites count
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const favoritesCount = document.getElementById('favorites');
        if (favoritesCount) {
            favoritesCount.textContent = favorites.length;
        }

        // Update sidebar favorites if exists
        const sidebarFavorites = document.getElementById('sidebarFavorites');
        if (sidebarFavorites) {
            sidebarFavorites.textContent = favorites.length;
        }

        // Update progress
        const progress = document.getElementById('progress');
        if (progress) {
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
            
            const progressValue = Math.min(Math.floor((totalMeals + favorites.length) * 5), 100);
            progress.textContent = `${progressValue}%`;
        }
    }

    setupProfileSync() {
        // Listen for profile updates from other pages
        window.addEventListener('storage', (e) => {
            if (e.key === 'spoonfull_profile') {
                this.profile = JSON.parse(e.newValue || '{}');
                this.updateSidebarProfile();
            }
        });

        // Also listen for custom events (for same-page updates)
        window.addEventListener('profileUpdated', () => {
            this.profile = this.loadProfile();
            this.updateSidebarProfile();
        });

        // Update stats when favorites change
        window.addEventListener('favoritesUpdated', () => {
            this.updateRecipeStats();
        });

        // Update stats when meal plan changes
        window.addEventListener('mealPlanUpdated', () => {
            this.updateRecipeStats();
        });
    }

    refreshProfile() {
        this.profile = this.loadProfile();
        this.updateSidebarProfile();
        this.updateRecipeStats();
    }
}

// Enhanced Toast System for Recipes Page
class RecipeToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        this.createContainer();
        this.setupGlobalAccess();
    }

    createContainer() {
        // Remove existing container if present
        const existingContainer = document.getElementById('recipe-toast-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        this.container = document.createElement('div');
        this.container.id = 'recipe-toast-container';
        this.container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-sm';
        document.body.appendChild(this.container);

        this.injectStyles();
    }

    injectStyles() {
        const styles = `
            .recipe-toast {
                padding: 1rem 1.25rem;
                border-radius: 0.75rem;
                background: white;
                border: 1px solid #e5e7eb;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(8px);
                max-width: 100%;
            }

            .recipe-toast.enter {
                transform: translateX(0);
                opacity: 1;
            }

            .recipe-toast.exit {
                transform: translateX(100%);
                opacity: 0;
            }

            .recipe-toast.success {
                border-left: 4px solid #10b981;
                background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
            }

            .recipe-toast.error {
                border-left: 4px solid #ef4444;
                background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
            }

            .recipe-toast.warning {
                border-left: 4px solid #f59e0b;
                background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
            }

            .recipe-toast.info {
                border-left: 4px solid #3b82f6;
                background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
            }

            .dark .recipe-toast {
                background: #1f2937;
                border-color: #374151;
            }

            .dark .recipe-toast.success {
                background: linear-gradient(135deg, #052e16 0%, #1f2937 100%);
            }

            .dark .recipe-toast.error {
                background: linear-gradient(135deg, #450a0a 0%, #1f2937 100%);
            }

            .dark .recipe-toast.warning {
                background: linear-gradient(135deg, #451a03 0%, #1f2937 100%);
            }

            .dark .recipe-toast.info {
                background: linear-gradient(135deg, #172554 0%, #1f2937 100%);
            }

            @media (max-width: 640px) {
                .recipe-toast {
                    padding: 0.875rem 1rem;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    setupGlobalAccess() {
        window.showRecipeToast = (message, type = 'info', duration = 4000) => {
            this.show(message, type, duration);
        };
    }

    show(message, type = 'info', duration = 4000) {
        const toast = this.createToastElement(message, type);
        this.container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('enter');
        });

        // Auto remove
        const timer = setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        // Allow manual dismiss
        toast.addEventListener('click', () => {
            clearTimeout(timer);
            this.removeToast(toast);
        });

        return toast;
    }

    createToastElement(message, type) {
        const toast = document.createElement('div');
        toast.className = `recipe-toast ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        const iconName = icons[type] || 'info';

        toast.innerHTML = `
            <i data-lucide="${iconName}" class="w-5 h-5 mt-0.5 flex-shrink-0"></i>
            <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900 dark:text-gray-100">${message}</div>
            </div>
        `;

        return toast;
    }

    removeToast(toast) {
        toast.classList.remove('enter');
        toast.classList.add('exit');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Recipe-specific convenience methods
    favoriteAdded(recipeName) {
        return this.show(`"${recipeName}" added to favorites!`, 'success', 3000);
    }

    favoriteRemoved(recipeName) {
        return this.show(`"${recipeName}" removed from favorites`, 'info', 3000);
    }

    addedToPlan(recipeName, day, mealType) {
        return this.show(`"${recipeName}" added to ${day} ${mealType}`, 'success', 4000);
    }

    recipeRated(recipeName, rating) {
        return this.show(`Rated "${recipeName}" ${rating} stars`, 'success', 3000);
    }
}

// Non-Recipe Functions for Recipes Page

// Dark Mode Toggle
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedDark = localStorage.getItem('spoonfull_darkMode');
    
    // Set initial state
    if (storedDark === 'true' || (!storedDark && prefersDark)) {
        document.documentElement.classList.add('dark');
        updateDarkModeIcon(true);
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('spoonfull_darkMode', isDark);
            updateDarkModeIcon(isDark);
        });
    }
}

function updateDarkModeIcon(isDark) {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        const icon = darkModeToggle.querySelector('i');
        if (icon) {
            if (isDark) {
                icon.setAttribute('data-lucide', 'sun');
            } else {
                icon.setAttribute('data-lucide', 'moon');
            }
            if (window.lucide) {
                lucide.createIcons();
            }
        }
    }
}

// Sidebar Management
function initSidebar() {
    const menuBtn = document.getElementById('menuBtn');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('backdrop');

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
}

// Scroll to Top Functionality
function initScrollToTop() {
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    
    if (scrollTopBtn) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollTopBtn.style.display = 'flex';
            } else {
                scrollTopBtn.style.display = 'none';
            }
        });

        // Scroll to top when clicked
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Modal Management (non-recipe modals)
function initModals() {
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // Timer modal functionality
    const timerBtn = document.getElementById('timerBtn');
    const timerModal = document.getElementById('timerModal');
    const timerModalClose = document.getElementById('timerModalClose');
    
    if (timerBtn && timerModal) {
        timerBtn.addEventListener('click', () => {
            timerModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (timerModalClose && timerModal) {
        timerModalClose.addEventListener('click', () => {
            timerModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Shopping modal functionality
    const shoppingModal = document.getElementById('shoppingModal');
    const shoppingModalClose = document.getElementById('shoppingModalClose');
    
    if (shoppingModalClose && shoppingModal) {
        shoppingModalClose.addEventListener('click', () => {
            shoppingModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

// Nutrition Tracker Functions
function initNutritionTracker() {
    const resetNutritionBtn = document.getElementById('resetNutritionBtn');
    
    if (resetNutritionBtn) {
        resetNutritionBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset today\'s nutrition data?')) {
                resetNutritionData();
                showToast('Nutrition data reset successfully', 'success');
            }
        });
    }

    // Update goal inputs
    const goalInputs = ['caloriesGoal', 'proteinGoal', 'carbsGoal', 'fatsGoal'];
    goalInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', updateNutritionGoals);
        }
    });
}

function resetNutritionData() {
    const nutritionData = {
        dailyTargets: {
            energy: parseInt(document.getElementById('caloriesGoal').value) || 2000,
            protein: parseInt(document.getElementById('proteinGoal').value) || 50,
            carbohydrates: parseInt(document.getElementById('carbsGoal').value) || 250,
            fats: parseInt(document.getElementById('fatsGoal').value) || 70
        },
        today: { energy: 0, protein: 0, carbohydrates: 0, fats: 0 },
        history: []
    };
    
    localStorage.setItem('nutritionData', JSON.stringify(nutritionData));
    updateNutritionDisplay();
}

function updateNutritionGoals() {
    const nutritionData = JSON.parse(localStorage.getItem('nutritionData')) || {
        dailyTargets: { energy: 2000, protein: 50, carbohydrates: 250, fats: 70 },
        today: { energy: 0, protein: 0, carbohydrates: 0, fats: 0 },
        history: []
    };

    nutritionData.dailyTargets.energy = parseInt(document.getElementById('caloriesGoal').value) || 2000;
    nutritionData.dailyTargets.protein = parseInt(document.getElementById('proteinGoal').value) || 50;
    nutritionData.dailyTargets.carbohydrates = parseInt(document.getElementById('carbsGoal').value) || 250;
    nutritionData.dailyTargets.fats = parseInt(document.getElementById('fatsGoal').value) || 70;

    localStorage.setItem('nutritionData', JSON.stringify(nutritionData));
    updateNutritionDisplay();
    showToast('Nutrition goals updated', 'success');
}

function updateNutritionDisplay() {
    const nutritionData = JSON.parse(localStorage.getItem('nutritionData'));
    if (!nutritionData) return;

    // Update summary numbers
    const totalCalories = document.getElementById('totalCalories');
    const totalProtein = document.getElementById('totalProtein');
    const totalCarbs = document.getElementById('totalCarbs');
    const totalFats = document.getElementById('totalFats');

    if (totalCalories) totalCalories.textContent = nutritionData.today.energy;
    if (totalProtein) totalProtein.textContent = nutritionData.today.protein + 'g';
    if (totalCarbs) totalCarbs.textContent = nutritionData.today.carbohydrates + 'g';
    if (totalFats) totalFats.textContent = nutritionData.today.fats + 'g';

    // Update progress bars and stats
    updateProgressBar('calories', nutritionData.today.energy, nutritionData.dailyTargets.energy);
    updateProgressBar('protein', nutritionData.today.protein, nutritionData.dailyTargets.protein);
    updateProgressBar('carbs', nutritionData.today.carbohydrates, nutritionData.dailyTargets.carbohydrates);
    updateProgressBar('fats', nutritionData.today.fats, nutritionData.dailyTargets.fats);

    // Update history
    updateNutritionHistory(nutritionData.history);
}

function updateProgressBar(type, current, target) {
    const progressFill = document.querySelector(`.nutrition-progress-fill.${type}`);
    const progressStats = document.querySelector(`.nutrition-progress-stats.${type}`);
    
    if (progressFill) {
        const percentage = Math.min((current / target) * 100, 100);
        progressFill.style.width = `${percentage}%`;
    }
    
    if (progressStats) {
        progressStats.textContent = `${current}/${target}${type === 'calories' ? '' : 'g'} (${target - current}${type === 'calories' ? '' : 'g'} left)`;
    }
}

function updateNutritionHistory(history) {
    const historyContainer = document.getElementById('nutritionHistoryList');
    if (!historyContainer) return;

    if (history.length === 0) {
        historyContainer.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                <i data-lucide="utensils" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                <p>No meals tracked today</p>
            </div>
        `;
        return;
    }

    historyContainer.innerHTML = history.map(item => `
        <div class="nutrition-history-item">
            <span class="nutrition-history-item-name">${item.recipeName}</span>
            <div class="nutrition-history-item-stats">
                <span>${item.energy} cal</span>
                <span>${item.protein}g protein</span>
            </div>
        </div>
    `).join('');

    if (window.lucide) {
        lucide.createIcons();
    }
}

// Toast Notification System
function showToast(message, type = 'info') {
    if (window.recipeToastManager) {
        window.recipeToastManager.show(message, type);
    } else {
        // Fallback simple toast
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Advanced Filters Toggle
function initAdvancedFilters() {
    const advancedFiltersBtn = document.getElementById('advancedFiltersBtn');
    const advancedFilters = document.getElementById('advancedFilters');
    
    if (advancedFiltersBtn && advancedFilters) {
        advancedFiltersBtn.addEventListener('click', () => {
            advancedFilters.classList.toggle('hidden');
            const icon = advancedFiltersBtn.querySelector('i');
            if (icon) {
                if (advancedFilters.classList.contains('hidden')) {
                    icon.setAttribute('data-lucide', 'filter');
                } else {
                    icon.setAttribute('data-lucide', 'filter-x');
                }
                if (window.lucide) {
                    lucide.createIcons();
                }
            }
        });
    }
}

// Recently Viewed Recipes
function initRecentlyViewed() {
    const clearRecentBtn = document.getElementById('clearRecent');
    
    if (clearRecentBtn) {
        clearRecentBtn.addEventListener('click', () => {
            if (confirm('Clear your recently viewed recipes?')) {
                localStorage.removeItem('recentlyViewed');
                if (window.recipeManager) {
                    window.recipeManager.updateRecentlyViewed();
                }
                showToast('Recently viewed cleared', 'success');
            }
        });
    }
    
    if (window.recipeManager) {
        window.recipeManager.updateRecentlyViewed();
    }
}

// Global functions for HTML onclick handlers
function toggleFavorite(recipeId) {
    if (window.recipeManager) {
        window.recipeManager.toggleFavoriteStatus(recipeId);
    }
}

function showRecipeDetails(recipeId) {
    if (window.recipeManager) {
        window.recipeManager.showRecipeDetails(recipeId);
    }
}

function addToPlan(recipeId) {
    if (window.recipeManager) {
        const recipe = window.recipeManager.recipeCollection.find(r => r.identifier === recipeId);
        if (recipe) {
            window.recipeManager.openMealPlanModal(recipe);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Recipe Page...');
    
    // Initialize Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
    
    // Update current year in footer
    const currentYear = document.getElementById('currentYear');
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    // Initialize all non-recipe functions
    initDarkMode();
    initSidebar();
    initScrollToTop();
    initModals();
    initNutritionTracker();
    initAdvancedFilters();
    initRecentlyViewed();

    // Sidebar version animation
    const sidebarVersion = document.getElementById('sidebarVersion');
    if (sidebarVersion) {
        setTimeout(() => {
            sidebarVersion.classList.add('sv-animate', 'sv-stagger');
        }, 300);
    }

    // Initialize Recipe Manager
    window.recipeManager = new RecipeManager();
    window.recipeProfileManager = new RecipeProfileManager();
    window.recipeToastManager = new RecipeToastManager();
    
    console.log('Recipe Manager initialized, starting recipe load...');
    window.recipeManager.fetchRecipes();
    
    // Initialize nutrition display with current data
    updateNutritionDisplay();

    // Create observer for dynamically added icons
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (window.lucide) {
                        lucide.createIcons();
                    }
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Make functions available globally
window.toggleFavorite = toggleFavorite;
window.showRecipeDetails = showRecipeDetails;
window.addToPlan = addToPlan;
window.showToast = showToast;