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
        this.recipesPerPage = 12;
        this.isLoading = false;
        this.favoritesOnly = false;
        this.currentCategory = 'all';
        this.currentView = 'grid';
        this.hasMoreRecipes = true;
        this.currentRecipeForPlan = null;
        
        this.initializeEventListeners();
    }

    shouldLoadRecipes() {
        const recipePages = ['index.html', 'recipes.html', '/', ''];
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || '/';
        
        return recipePages.includes(currentPage) || 
               recipePages.includes(currentPath) ||
               document.getElementById('recipeList') !== null;
    }

    initializeOnPage() {
        if (this.shouldLoadRecipes()) {
            this.loadRecipes();
        }
    }

    initializeEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchRecipes(e.target.value);
            }, 300));
        }

        const favoritesToggle = document.getElementById('favoritesToggle');
        if (favoritesToggle) {
            favoritesToggle.addEventListener('click', () => {
                this.toggleFavoritesView();
            });
        }

        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreRecipes();
            });
        }

        const randomBtn = document.getElementById('randomBtnToolbar');
        if (randomBtn) {
            randomBtn.addEventListener('click', () => {
                this.getRandomRecipe();
            });
        }

        const surpriseHero = document.getElementById('surpriseHero');
        if (surpriseHero) {
            surpriseHero.addEventListener('click', () => {
                this.getRandomRecipe();
            });
        }
    }

    async loadRecipes(query = '') {
        if (!this.shouldLoadRecipes()) {
            console.log('Recipe loading skipped - not needed on this page');
            return;
        }
        
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();

        try {
            let recipes = [];
            
            if (query) {
                recipes = await this.searchEdamamRecipes(query);
            } else {
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

            this.hasMoreRecipes = recipes.length === this.recipesPerPage;

        } catch (error) {
            console.error('Error loading recipes:', error);
            this.showErrorState('Failed to load recipes. Please try again.');
            this.loadSampleRecipes();
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

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
            return this.getSampleRecipes().slice(0, this.recipesPerPage);
        }
    }

    async getFeaturedRecipes() {
        try {
            const queries = ['chicken', 'pasta', 'salad', 'soup', 'vegetarian', 'healthy'];
            const randomQuery = queries[Math.floor(Math.random() * queries.length)];
            const recipes = await this.searchEdamamRecipes(randomQuery);
            
            if (recipes.length >= 12) {
                return recipes.slice(0, 12);
            } else {
                const sampleRecipes = this.getSampleRecipes();
                const needed = 12 - recipes.length;
                return [...recipes, ...sampleRecipes.slice(0, needed)];
            }
        } catch (error) {
            console.error('Failed to fetch from Edamam API:', error);
            return this.getSampleRecipes().slice(0, 12);
        }
    }

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
                ingredients: ['1 cup quinoa', '2 cups vegetable broth', '1 cucumber, diced', '1 cup cherry tomatoes, halved', '1/2 red onion, thinly sliced', '1/2 cup kalamata olives', '1/2 cup feta cheese, crumbled', '3 tbsp olive oil', '2 tbsp lemon juice', '1 tsp dried oregano', 'Salt and pepper to taste'],
                instructions: [
                    'Rinse quinoa thoroughly under cold water.',
                    'Cook quinoa in vegetable broth according to package instructions.',
                    'While quinoa cooks, prepare the vegetables and dressing.',
                    'Whisk together olive oil, lemon juice, oregano, salt, and pepper.',
                    'Fluff cooked quinoa with a fork and let cool slightly.',
                    'Combine quinoa with vegetables in a large bowl.',
                    'Drizzle with dressing and toss to combine.',
                    'Top with crumbled feta cheese and serve.'
                ],
                cuisineType: 'Mediterranean',
                mealType: 'Lunch',
                tags: ['healthy', 'vegetarian', 'gluten-free'],
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
                ingredients: ['1 lb ground beef (80/20)', '1 tsp Worcestershire sauce', '1 tsp garlic powder', '1 tsp onion powder', 'Salt and black pepper to taste', '4 burger buns', '4 slices cheese', 'Lettuce leaves', '1 tomato, sliced', '1/2 red onion, sliced', 'Ketchup and mustard'],
                instructions: [
                    'Preheat grill or skillet to medium-high heat.',
                    'In a bowl, gently mix ground beef with Worcestershire sauce and seasonings.',
                    'Form into 4 equal patties, about 1/2 inch thick.',
                    'Make a slight indentation in the center of each patty to prevent bulging.',
                    'Grill burgers for 4-5 minutes per side for medium.',
                    'Add cheese slices during the last minute of cooking.',
                    'Toast burger buns lightly.',
                    'Assemble burgers with your favorite toppings and condiments.'
                ],
                cuisineType: 'American',
                mealType: 'Dinner',
                tags: ['comfort-food', 'high-protein', 'family-friendly'],
                description: 'Juicy, flavorful beef burgers that are perfect for weekend cookouts or weeknight dinners.'
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
                ingredients: ['2 tbsp green curry paste', '1 can coconut milk', '1 lb chicken breast, sliced', '1 eggplant, cubed', '1 bell pepper, sliced', '1 onion, sliced', '2 tbsp fish sauce', '1 tbsp palm sugar', 'Thai basil leaves', '2 kaffir lime leaves', 'Jasmine rice for serving'],
                instructions: [
                    'Heat 2 tablespoons of coconut milk in a wok or large pan.',
                    'Add green curry paste and fry for 2-3 minutes until fragrant.',
                    'Add chicken and cook until no longer pink.',
                    'Pour in remaining coconut milk and bring to a simmer.',
                    'Add vegetables and simmer for 10-15 minutes until tender.',
                    'Season with fish sauce and palm sugar.',
                    'Add kaffir lime leaves and Thai basil just before serving.',
                    'Serve hot with jasmine rice.'
                ],
                cuisineType: 'Thai',
                mealType: 'Dinner',
                tags: ['spicy', 'asian', 'comfort-food'],
                description: 'Aromatic and creamy green curry with tender chicken and fresh vegetables.'
            },
            {
                id: '5',
                title: 'Avocado Toast with Poached Eggs',
                image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 15,
                servings: 2,
                calories: 280,
                difficulty: 'easy',
                nutritionScore: 'A',
                rating: 4.4,
                ingredients: ['2 slices sourdough bread', '1 ripe avocado', '2 eggs', '1 tbsp lemon juice', 'Red pepper flakes', 'Salt and pepper to taste', 'Microgreens for garnish', '1 tbsp white vinegar'],
                instructions: [
                    'Bring a pot of water to a gentle simmer and add vinegar.',
                    'Toast sourdough bread until golden and crisp.',
                    'Mash avocado with lemon juice, salt, and pepper.',
                    'Spread mashed avocado evenly on toast.',
                    'Poach eggs in simmering water for 3-4 minutes for runny yolks.',
                    'Remove eggs with a slotted spoon and drain on paper towels.',
                    'Place poached eggs on avocado toast.',
                    'Season with red pepper flakes and garnish with microgreens.'
                ],
                cuisineType: 'International',
                mealType: 'Breakfast',
                tags: ['healthy', 'quick', 'vegetarian'],
                description: 'Creamy avocado and perfectly poached eggs on crunchy sourdough - the ultimate breakfast treat.'
            },
            {
                id: '6',
                title: 'Chocolate Chip Cookies',
                image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 25,
                servings: 24,
                calories: 180,
                difficulty: 'easy',
                nutritionScore: 'C',
                rating: 4.9,
                ingredients: ['2 1/4 cups all-purpose flour', '1 tsp baking soda', '1 tsp salt', '1 cup butter, softened', '3/4 cup granulated sugar', '3/4 cup brown sugar', '2 large eggs', '2 tsp vanilla extract', '2 cups chocolate chips'],
                instructions: [
                    'Preheat oven to 375°F (190°C).',
                    'In a medium bowl, whisk together flour, baking soda, and salt.',
                    'In a large bowl, cream together butter and sugars until light and fluffy.',
                    'Beat in eggs one at a time, then add vanilla.',
                    'Gradually mix in dry ingredients until just combined.',
                    'Stir in chocolate chips.',
                    'Drop rounded tablespoons of dough onto ungreased baking sheets.',
                    'Bake for 9-11 minutes until golden brown.',
                    'Let cool on baking sheet for 5 minutes before transferring to wire rack.'
                ],
                cuisineType: 'American',
                mealType: 'Dessert',
                tags: ['dessert', 'baking', 'family-friendly'],
                description: 'Classic, chewy chocolate chip cookies that are perfect for any occasion.'
            },
            {
                id: '7',
                title: 'Vegetable Stir Fry',
                image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 20,
                servings: 4,
                calories: 220,
                difficulty: 'easy',
                nutritionScore: 'A+',
                rating: 4.3,
                ingredients: ['2 tbsp vegetable oil', '2 cloves garlic, minced', '1 tbsp ginger, grated', '1 bell pepper, sliced', '2 carrots, julienned', '1 cup broccoli florets', '1 cup snap peas', '2 tbsp soy sauce', '1 tbsp oyster sauce', '1 tsp sesame oil', 'Green onions for garnish', 'Sesame seeds'],
                instructions: [
                    'Heat oil in a wok or large skillet over high heat.',
                    'Add garlic and ginger, stir-fry for 30 seconds until fragrant.',
                    'Add harder vegetables (carrots, broccoli) and stir-fry for 2-3 minutes.',
                    'Add remaining vegetables and continue stir-frying for 2-3 minutes.',
                    'In a small bowl, mix soy sauce, oyster sauce, and sesame oil.',
                    'Pour sauce over vegetables and toss to coat.',
                    'Cook for another minute until vegetables are crisp-tender.',
                    'Garnish with green onions and sesame seeds.',
                    'Serve immediately with rice or noodles.'
                ],
                cuisineType: 'Asian',
                mealType: 'Dinner',
                tags: ['vegetarian', 'healthy', 'quick'],
                description: 'Quick and colorful vegetable stir fry that comes together in minutes. Perfect for busy weeknights.'
            },
            {
                id: '8',
                title: 'Classic Caesar Salad',
                image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 15,
                servings: 4,
                calories: 320,
                difficulty: 'easy',
                nutritionScore: 'B',
                rating: 4.2,
                ingredients: ['1 large head romaine lettuce', '1/2 cup Caesar dressing', '1/4 cup grated Parmesan cheese', '1 cup croutons', '2 anchovy fillets (optional)', '1 tbsp lemon juice', 'Black pepper to taste', 'Additional Parmesan for serving'],
                instructions: [
                    'Wash and dry romaine lettuce thoroughly.',
                    'Tear or chop lettuce into bite-sized pieces.',
                    'In a large bowl, combine lettuce with Caesar dressing.',
                    'Toss until evenly coated.',
                    'Add grated Parmesan and croutons.',
                    'If using, mash anchovy fillets and mix with lemon juice, then add to salad.',
                    'Season with black pepper to taste.',
                    'Serve immediately with extra Parmesan on top.'
                ],
                cuisineType: 'Italian',
                mealType: 'Lunch',
                tags: ['salad', 'quick', 'classic'],
                description: 'Crisp romaine lettuce with creamy Caesar dressing, Parmesan, and crunchy croutons.'
            },
            {
                id: '9',
                title: 'Beef Tacos',
                image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 25,
                servings: 6,
                calories: 280,
                difficulty: 'easy',
                nutritionScore: 'B',
                rating: 4.6,
                ingredients: ['1 lb ground beef', '1 packet taco seasoning', '12 taco shells', '2 cups shredded lettuce', '1 cup diced tomatoes', '1 cup shredded cheese', '1/2 cup sour cream', '1/2 cup salsa', '1 avocado, sliced', 'Lime wedges for serving'],
                instructions: [
                    'Brown ground beef in a skillet over medium heat, breaking it up as it cooks.',
                    'Drain excess fat and add taco seasoning with water as directed on package.',
                    'Simmer for 5 minutes until thickened.',
                    'Warm taco shells according to package directions.',
                    'Fill taco shells with seasoned beef.',
                    'Top with lettuce, tomatoes, cheese, and other desired toppings.',
                    'Serve with sour cream, salsa, avocado, and lime wedges.'
                ],
                cuisineType: 'Mexican',
                mealType: 'Dinner',
                tags: ['family-friendly', 'quick', 'comfort-food'],
                description: 'Classic beef tacos with all your favorite toppings - perfect for Taco Tuesday!'
            },
            {
                id: '10',
                title: 'Berry Smoothie Bowl',
                image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 10,
                servings: 1,
                calories: 240,
                difficulty: 'easy',
                nutritionScore: 'A+',
                rating: 4.4,
                ingredients: ['1 cup mixed frozen berries', '1/2 banana', '1/4 cup Greek yogurt', '2 tbsp almond milk', '1 tbsp honey', '2 tbsp granola', '1 tbsp chia seeds', 'Fresh berries for topping', 'Coconut flakes'],
                instructions: [
                    'Combine frozen berries, banana, Greek yogurt, almond milk, and honey in a blender.',
                    'Blend until smooth and creamy, adding more milk if needed.',
                    'Pour into a bowl.',
                    'Top with granola, chia seeds, fresh berries, and coconut flakes.',
                    'Serve immediately with a spoon.'
                ],
                cuisineType: 'International',
                mealType: 'Breakfast',
                tags: ['healthy', 'quick', 'vegetarian'],
                description: 'A thick and creamy smoothie bowl loaded with berries and superfood toppings.'
            },
            {
                id: '11',
                title: 'Chicken Noodle Soup',
                image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 45,
                servings: 6,
                calories: 180,
                difficulty: 'easy',
                nutritionScore: 'A',
                rating: 4.5,
                ingredients: ['1 tbsp olive oil', '1 onion, diced', '2 carrots, sliced', '2 celery stalks, sliced', '2 cloves garlic, minced', '8 cups chicken broth', '2 cups cooked chicken, shredded', '2 cups egg noodles', '1 tsp dried thyme', 'Salt and pepper to taste', 'Fresh parsley for garnish'],
                instructions: [
                    'Heat olive oil in a large pot over medium heat.',
                    'Add onion, carrots, and celery. Cook until softened, about 5 minutes.',
                    'Add garlic and cook for 1 minute until fragrant.',
                    'Pour in chicken broth and bring to a boil.',
                    'Add chicken, noodles, and thyme.',
                    'Simmer for 10-15 minutes until noodles are cooked.',
                    'Season with salt and pepper to taste.',
                    'Garnish with fresh parsley before serving.'
                ],
                cuisineType: 'American',
                mealType: 'Lunch',
                tags: ['comfort-food', 'healthy', 'soup'],
                description: 'Hearty and comforting chicken noodle soup that is perfect for chilly days or when you are feeling under the weather.'
            },
            {
                id: '12',
                title: 'Garlic Butter Shrimp',
                image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 15,
                servings: 4,
                calories: 220,
                difficulty: 'easy',
                nutritionScore: 'A',
                rating: 4.7,
                ingredients: ['1 lb large shrimp, peeled and deveined', '4 tbsp butter', '4 cloves garlic, minced', '1/4 cup white wine', '2 tbsp lemon juice', '2 tbsp fresh parsley, chopped', '1/4 tsp red pepper flakes', 'Salt and pepper to taste', 'Lemon wedges for serving'],
                instructions: [
                    'Pat shrimp dry and season with salt and pepper.',
                    'Melt butter in a large skillet over medium-high heat.',
                    'Add garlic and cook for 1 minute until fragrant.',
                    'Add shrimp and cook for 2-3 minutes per side until pink.',
                    'Add white wine and lemon juice, simmer for 1 minute.',
                    'Stir in parsley and red pepper flakes.',
                    'Serve immediately with lemon wedges and crusty bread or over pasta.'
                ],
                cuisineType: 'Mediterranean',
                mealType: 'Dinner',
                tags: ['seafood', 'quick', 'elegant'],
                description: 'Succulent shrimp cooked in a rich garlic butter sauce - ready in just 15 minutes!'
            }
        ];
    }

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
            rating: (Math.random() * 1 + 4).toFixed(1),
            ingredients: recipe.ingredientLines || [],
            instructions: recipe.ingredientLines || [],
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
        
        if (nutrients.FAT && nutrients.FAT.quantity > 50) score -= 20;
        if (nutrients.SUGAR && nutrients.SUGAR.quantity > 25) score -= 15;
        if (nutrients.PROCNT && nutrients.PROCNT.quantity > 20) score += 10;
        
        if (score >= 90) return 'A+';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        return 'D';
    }

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
                    <button onclick="window.spoonfullApp.recipeManager.initializeOnPage()" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
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

    toggleFavorite(recipeId) {
        const favorites = JSON.parse(localStorage.getItem('spoonfull_favorites') || '[]');
        const recipe = this.recipes.find(r => r.id === recipeId);
        
        if (!recipe) return;

        const existingIndex = favorites.findIndex(fav => fav.id === recipeId);
        
        if (existingIndex > -1) {
            favorites.splice(existingIndex, 1);
        } else {
            favorites.push(recipe);
        }
        
        localStorage.setItem('spoonfull_favorites', JSON.stringify(favorites));
        this.renderRecipes();
        
        if (window.spoonfullApp) {
            window.spoonfullApp.updateStats();
        }
    }

    loadMoreRecipes() {
        this.currentPage++;
        this.loadRecipes(this.searchQuery);
    }

    searchRecipes(query) {
        this.currentPage = 1;
        this.searchQuery = query;
        this.loadRecipes(query);
    }

    toggleFavoritesView() {
        this.favoritesOnly = !this.favoritesOnly;
        this.filterRecipes();
        this.renderRecipes();
        this.updateRecipeCount();
    }

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

    loadSampleRecipes() {
        this.recipes = this.getSampleRecipes();
        this.filterRecipes();
        this.renderRecipes();
        this.updateRecipeCount();
    }
}

// Dashboard Functionality with Seasonal Recipes, Recommendations, and Cooking Weather
const spoonfullDashboard = {
    isIndexPage: function() {
        return window.location.pathname.endsWith('index.html') || 
               window.location.pathname === '/' || 
               window.location.pathname.endsWith('/');
    },

    init: function() {
        if (!this.isIndexPage()) {
            console.log('Not on index page, skipping dashboard initialization');
            return;
        }

        this.initQuickActions();
        this.initGoals();
        this.initWeather();
        this.initSeasonal();
        this.initRecommendations();
        this.updateDashboardStats();
        this.setupEventListeners();
        this.initBackToTop();
        console.log('Dashboard initialized');
    },

    // Back to Top functionality
    initBackToTop: function() {
        const backToTopBtn = document.getElementById('backToTop');
        
        if (backToTopBtn) {
            // Show/hide button based on scroll position
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    backToTopBtn.classList.add('show');
                } else {
                    backToTopBtn.classList.remove('show');
                }
            });

            // Scroll to top when clicked
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    },

    // Quick Actions functionality
    initQuickActions: function() {
        const quickTips = [
            "Plan 3 meals ahead to save time!",
            "Prep ingredients on Sunday for easier weekdays",
            "Try batch cooking for busy weeks",
            "Use seasonal ingredients for better flavor",
            "Don't forget to hydrate while cooking!",
            "Clean as you go for a stress-free kitchen",
            "Invest in good knives - they make cooking easier",
            "Taste your food as you cook and adjust seasoning"
        ];
        
        const randomTip = quickTips[Math.floor(Math.random() * quickTips.length)];
        const quickTipElement = document.getElementById('quickTip');
        if (quickTipElement) {
            quickTipElement.textContent = randomTip;
        }
    },

    // Goals functionality
    initGoals: function() {
        this.setupGoalClickHandlers();
        this.updateGoalsProgress();
    },

    setupGoalClickHandlers: function() {
        const goalCheckboxes = document.querySelectorAll('.goal-checkbox');
        
        goalCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('click', function() {
                const goalItem = this.closest('.goal-item');
                if (goalItem) {
                    goalItem.classList.toggle('completed');
                    this.classList.toggle('completed');
                    
                    spoonfullDashboard.updateGoalsProgress();
                    spoonfullDashboard.updateUserActivity();
                    
                    const goalText = goalItem.querySelector('.goal-text').textContent;
                    if (!goalItem.classList.contains('completed')) {
                        spoonfullDashboard.showToast(`Completed: ${goalText}`, 'success');
                    }
                }
            });
        });
    },

    updateGoalsProgress: function() {
        const completedGoals = document.querySelectorAll('.goal-item.completed').length;
        const totalGoals = document.querySelectorAll('.goal-item').length;
        const progressElement = document.getElementById('goalsProgress');
        const progressBar = document.querySelector('.goals-progress-bar');
        
        if (progressElement) {
            progressElement.textContent = `${completedGoals}/${totalGoals} completed`;
        }
        
        if (progressBar) {
            const progressPercent = (completedGoals / totalGoals) * 100;
            progressBar.style.width = `${progressPercent}%`;
        }
    },

    // Enhanced Weather functionality with cooking recommendations
    initWeather: function() {
        this.getUserLocation()
            .then(location => {
                return this.fetchWeatherData(location);
            })
            .then(weatherData => {
                this.updateWeatherDisplay(weatherData);
                this.updateCookingRecommendations(weatherData);
                this.updateWeatherEffects(weatherData);
                this.updateWeatherCardStyle(weatherData.condition);
            })
            .catch(error => {
                console.log('Weather API failed, using enhanced mock data:', error);
                const mockWeather = this.getEnhancedMockWeatherData();
                this.updateWeatherDisplay(mockWeather);
                this.updateCookingRecommendations(mockWeather);
                this.updateWeatherEffects(mockWeather);
                this.updateWeatherCardStyle(mockWeather.condition);
            });
    },

    getUserLocation: function() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        resolve({
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        });
                    },
                    error => {
                        // Default to New York coordinates if location access denied
                        resolve({ lat: 40.7128, lon: -74.0060 });
                    }
                );
            } else {
                resolve({ lat: 40.7128, lon: -74.0060 });
            }
        });
    },

    async fetchWeatherData(location) {
        // Using OpenWeatherMap API with provided API key
        const API_KEY = 'd4cbb6feae5a4c9e927225239253010';
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=metric`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Weather API failed: ${response.status}`);
            
            const data = await response.json();
            console.log('Weather API response:', data);
            
            return {
                temp: Math.round(data.main.temp),
                description: data.weather[0].description,
                icon: this.getWeatherIcon(data.weather[0].id),
                humidity: data.main.humidity,
                windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
                city: data.name,
                condition: this.getWeatherCondition(data.weather[0].id),
                feelsLike: Math.round(data.main.feels_like),
                high: Math.round(data.main.temp_max),
                low: Math.round(data.main.temp_min),
                precipitation: data.rain ? (data.rain['1h'] || 0) : 0,
                uvIndex: this.estimateUVIndex(data),
                airQuality: this.estimateAirQuality(data)
            };
        } catch (error) {
            console.error('Error fetching weather data:', error);
            throw error;
        }
    },

    getWeatherCondition: function(weatherId) {
        if (weatherId >= 200 && weatherId < 300) return 'stormy';
        if (weatherId >= 300 && weatherId < 400) return 'rainy';
        if (weatherId >= 500 && weatherId < 600) return 'rainy';
        if (weatherId >= 600 && weatherId < 700) return 'snowy';
        if (weatherId >= 700 && weatherId < 800) return 'cloudy';
        if (weatherId === 800) return 'sunny';
        if (weatherId > 800 && weatherId < 803) return 'partly-cloudy';
        if (weatherId >= 803) return 'cloudy';
        return 'sunny';
    },

    estimateUVIndex: function(weatherData) {
        // Simple estimation based on time of day and cloud cover
        const now = new Date();
        const hour = now.getHours();
        const isDaytime = hour > 6 && hour < 20;
        
        if (!isDaytime) return 0;
        
        const cloudCover = weatherData.clouds ? weatherData.clouds.all : 0;
        
        if (cloudCover > 80) return Math.floor(Math.random() * 3) + 1; // 1-3
        if (cloudCover > 50) return Math.floor(Math.random() * 3) + 3; // 3-5
        if (cloudCover > 20) return Math.floor(Math.random() * 3) + 6; // 6-8
        return Math.floor(Math.random() * 3) + 8; // 8-10
    },

    estimateAirQuality: function(weatherData) {
        // Simple estimation based on humidity and pressure
        const humidity = weatherData.main.humidity;
        const pressure = weatherData.main.pressure;
        
        if (humidity < 40 && pressure > 1015) return "Excellent";
        if (humidity < 60 && pressure > 1010) return "Good";
        if (humidity < 80) return "Moderate";
        return "Fair";
    },

    getEnhancedMockWeatherData: function() {
        const conditions = [
            { 
                temp: 22, 
                description: "Sunny and clear", 
                icon: "☀️", 
                humidity: 45, 
                windSpeed: 12, 
                city: "Your Location",
                condition: "sunny",
                feelsLike: 24,
                high: 26,
                low: 18,
                precipitation: 0,
                uvIndex: 8,
                airQuality: "Good"
            },
            { 
                temp: 18, 
                description: "Partly cloudy", 
                icon: "⛅", 
                humidity: 60, 
                windSpeed: 8, 
                city: "Your Location",
                condition: "partly-cloudy",
                feelsLike: 17,
                high: 20,
                low: 15,
                precipitation: 10,
                uvIndex: 4,
                airQuality: "Moderate"
            },
            { 
                temp: 25, 
                description: "Warm and pleasant", 
                icon: "🌤️", 
                humidity: 50, 
                windSpeed: 10, 
                city: "Your Location",
                condition: "clear",
                feelsLike: 26,
                high: 28,
                low: 20,
                precipitation: 0,
                uvIndex: 7,
                airQuality: "Good"
            },
            { 
                temp: 15, 
                description: "Cool and breezy", 
                icon: "🌬️", 
                humidity: 70, 
                windSpeed: 15, 
                city: "Your Location",
                condition: "windy",
                feelsLike: 13,
                high: 17,
                low: 12,
                precipitation: 20,
                uvIndex: 3,
                airQuality: "Excellent"
            },
            { 
                temp: 8, 
                description: "Rainy day", 
                icon: "🌧️", 
                humidity: 85, 
                windSpeed: 5, 
                city: "Your Location",
                condition: "rainy",
                feelsLike: 6,
                high: 10,
                low: 7,
                precipitation: 80,
                uvIndex: 1,
                airQuality: "Good"
            },
            { 
                temp: -2, 
                description: "Snowy weather", 
                icon: "❄️", 
                humidity: 75, 
                windSpeed: 10, 
                city: "Your Location",
                condition: "snowy",
                feelsLike: -5,
                high: 1,
                low: -3,
                precipitation: 90,
                uvIndex: 2,
                airQuality: "Excellent"
            }
        ];
        
        return conditions[Math.floor(Math.random() * conditions.length)];
    },

    getWeatherIcon: function(weatherId) {
        if (weatherId >= 200 && weatherId < 300) return "⛈️";
        if (weatherId >= 300 && weatherId < 400) return "🌧️";
        if (weatherId >= 500 && weatherId < 600) return "🌧️";
        if (weatherId >= 600 && weatherId < 700) return "❄️";
        if (weatherId >= 700 && weatherId < 800) return "🌫️";
        if (weatherId === 800) return "☀️";
        if (weatherId === 801) return "🌤️";
        if (weatherId === 802) return "⛅";
        if (weatherId > 802) return "☁️";
        return "🌤️";
    },

    updateWeatherDisplay: function(weather) {
        const weatherTemp = document.getElementById('weatherTemp');
        const weatherDescription = document.getElementById('weatherDescription');
        const weatherIcon = document.getElementById('weatherIcon');
        const weatherCity = document.getElementById('weatherCity');
        const weatherHumidity = document.getElementById('weatherHumidity');
        const weatherWind = document.getElementById('weatherWind');
        const weatherFeelsLike = document.getElementById('weatherFeelsLike');
        const weatherHighLow = document.getElementById('weatherHighLow');
        const weatherPrecipitation = document.getElementById('weatherPrecipitation');
        const weatherUV = document.getElementById('weatherUV');
        const weatherAQI = document.getElementById('weatherAQI');
        
        // Update basic weather info
        if (weatherTemp) weatherTemp.textContent = `${weather.temp}°C`;
        if (weatherDescription) {
            // Capitalize first letter of description
            weatherDescription.textContent = weather.description.charAt(0).toUpperCase() + weather.description.slice(1);
        }
        if (weatherIcon) {
            weatherIcon.textContent = weather.icon;
            this.animateWeatherIcon(weather.condition);
        }
        if (weatherCity) weatherCity.textContent = weather.city;
        if (weatherHumidity) weatherHumidity.textContent = `${weather.humidity}%`;
        if (weatherWind) weatherWind.textContent = `${weather.windSpeed} km/h`;
        
        // Update enhanced weather info
        if (weatherFeelsLike) weatherFeelsLike.textContent = `${weather.feelsLike}°C`;
        if (weatherHighLow) weatherHighLow.textContent = `H:${weather.high}° L:${weather.low}°`;
        if (weatherPrecipitation) weatherPrecipitation.textContent = `${Math.round(weather.precipitation)}%`;
        if (weatherUV) weatherUV.textContent = this.getUVLevel(weather.uvIndex);
        if (weatherAQI) weatherAQI.textContent = weather.airQuality;
    },

    getUVLevel: function(uvIndex) {
        if (uvIndex <= 2) return 'Low';
        if (uvIndex <= 5) return 'Moderate';
        if (uvIndex <= 7) return 'High';
        if (uvIndex <= 10) return 'Very High';
        return 'Extreme';
    },

    updateWeatherCardStyle: function(condition) {
        const weatherCard = document.getElementById('weatherCard');
        if (!weatherCard) return;
        
        // Remove all weather condition classes
        const conditionClasses = [
            'weather-sunny', 'weather-cloudy', 'weather-rainy', 
            'weather-snowy', 'weather-windy', 'weather-stormy',
            'weather-partly-cloudy', 'weather-clear'
        ];
        weatherCard.classList.remove(...conditionClasses);
        
        // Add current condition class
        weatherCard.classList.add(`weather-${condition}`);
        
        // Update background gradient based on condition
        const gradients = {
            sunny: 'from-yellow-100 to-orange-50 border-yellow-200',
            cloudy: 'from-blue-50 to-gray-100 border-gray-300',
            rainy: 'from-blue-100 to-gray-200 border-blue-300',
            snowy: 'from-blue-50 to-indigo-100 border-indigo-200',
            windy: 'from-gray-100 to-blue-50 border-gray-400',
            stormy: 'from-gray-200 to-blue-200 border-gray-500',
            'partly-cloudy': 'from-blue-50 to-gray-100 border-blue-200',
            clear: 'from-yellow-100 to-orange-50 border-yellow-200'
        };
        
        // Remove existing gradient classes
        weatherCard.className = weatherCard.className.replace(/from-[\w-]+ to-[\w-]+/g, '');
        weatherCard.className = weatherCard.className.replace(/bg-gradient-to-br/g, '');
        weatherCard.className = weatherCard.className.replace(/border-[\w-]+/g, '');
        
        // Add new gradient and border
        weatherCard.classList.add('bg-gradient-to-br', gradients[condition] || gradients.sunny);
    },

    animateWeatherIcon: function(condition) {
        const weatherIcon = document.getElementById('weatherIcon');
        if (!weatherIcon) return;
        
        // Remove any existing animation classes
        const animationClasses = ['animate-sunny', 'animate-cloudy', 'animate-rainy', 'animate-snowy', 'animate-windy', 'animate-stormy'];
        weatherIcon.classList.remove(...animationClasses);
        
        // Add appropriate animation class
        weatherIcon.classList.add(`animate-${condition}`);
    },

    updateCookingRecommendations: function(weather) {
        const cookingTip = document.getElementById('cookingTip');
        const mealSuggestion = document.getElementById('mealSuggestion');
        const cookingMood = document.getElementById('cookingMood');
        const idealCooking = document.getElementById('idealCooking');
        const ingredientFocus = document.getElementById('ingredientFocus');
        
        let tip = "";
        let suggestion = "";
        let mood = "";
        let ideal = "";
        let ingredients = "";
        
        // Temperature-based recommendations
        if (weather.temp > 25) {
            tip = "Hot day! Perfect for no-cook meals and refreshing salads.";
            suggestion = "Try cold pasta salads, gazpacho, or fresh spring rolls.";
            mood = "🥵 Refreshing & Cool";
            ideal = "No-cook, salads, cold soups";
            ingredients = "Fresh herbs, citrus, cucumbers, tomatoes";
        } else if (weather.temp > 18) {
            tip = "Pleasant weather! Great for light cooking and outdoor dining.";
            suggestion = "Perfect for grilled vegetables, quinoa bowls, or fish tacos.";
            mood = "😊 Light & Fresh";
            ideal = "Grilling, light sautés, fresh bowls";
            ingredients = "Seasonal vegetables, lean proteins, fresh herbs";
        } else if (weather.temp > 10) {
            tip = "Cool weather calls for comforting, warm meals.";
            suggestion = "Ideal for soups, stews, roasted vegetables, or baked pasta.";
            mood = "🍂 Comforting & Warm";
            ideal = "Soups, stews, roasting, baking";
            ingredients = "Root vegetables, grains, warming spices";
        } else {
            tip = "Cold day! Time for hearty, warming comfort food.";
            suggestion = "Try chili, pot roast, creamy soups, or baked casseroles.";
            mood = "❄️ Hearty & Warming";
            ideal = "Slow cooking, braising, baking";
            ingredients = "Hearty meats, potatoes, cheese, warm spices";
        }
        
        // Weather condition adjustments
        if (weather.condition === 'rainy' || weather.condition === 'stormy') {
            tip = "Rainy day perfect for indoor cooking projects!";
            suggestion = "Great day for baking bread, making pasta from scratch, or slow-cooked meals.";
            mood = "🌧️ Cozy & Comforting";
            ideal = "Baking, slow cooking, comfort foods";
            ingredients = "Flour, yeast, comfort ingredients";
        } else if (weather.condition === 'snowy') {
            tip = "Snow day! Perfect for hearty, warming meals that simmer all day.";
            suggestion = "Try beef stew, homemade bread, or hot chocolate with cookies.";
            mood = "⛄ Warm & Nourishing";
            ideal = "Stews, baking, hot beverages";
            ingredients = "Hearty vegetables, chocolate, warm spices";
        } else if (weather.condition === 'windy') {
            tip = "Windy weather calls for sturdy, satisfying meals.";
            suggestion = "Perfect for grilled cheese, soups, or one-pot meals.";
            mood = "💨 Satisfying & Simple";
            ideal = "One-pot meals, quick cooking";
            ingredients = "Bread, cheese, canned goods";
        }
        
        // Update all recommendation elements
        if (cookingTip) cookingTip.textContent = tip;
        if (mealSuggestion) mealSuggestion.textContent = suggestion;
        if (cookingMood) cookingMood.textContent = mood;
        if (idealCooking) idealCooking.textContent = ideal;
        if (ingredientFocus) ingredientFocus.textContent = ingredients;
    },

    updateWeatherEffects: function(weather) {
        // Update cooking difficulty based on weather
        const cookingDifficulty = document.getElementById('cookingDifficulty');
        if (cookingDifficulty) {
            let difficulty = "Easy";
            let difficultyColor = "text-green-600";
            
            if (weather.condition === 'rainy' || weather.condition === 'snowy') {
                difficulty = "Moderate";
                difficultyColor = "text-yellow-600";
            } else if (weather.condition === 'stormy') {
                difficulty = "Challenging";
                difficultyColor = "text-red-600";
            }
            
            cookingDifficulty.textContent = difficulty;
            cookingDifficulty.className = `text-sm font-semibold ${difficultyColor}`;
        }
        
        // Update energy level recommendation
        const energyLevel = document.getElementById('energyLevel');
        if (energyLevel) {
            let energy = "High";
            let energyColor = "text-green-600";
            
            if (weather.temp > 28 || weather.temp < 5) {
                energy = "Moderate";
                energyColor = "text-yellow-600";
            }
            if (weather.condition === 'rainy' || weather.condition === 'snowy') {
                energy = "Low";
                energyColor = "text-blue-600";
            }
            
            energyLevel.textContent = energy;
            energyLevel.className = `text-sm font-semibold ${energyColor}`;
        }
    },

    // Seasonal functionality
    initSeasonal: function() {
        const currentSeason = this.getCurrentSeason();
        const seasonalRecipes = this.getSeasonalRecipes(currentSeason);
        
        this.updateSeasonalDisplay(currentSeason, seasonalRecipes);
        this.setupSeasonalClickHandlers(currentSeason);
    },

    getCurrentSeason: function() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    },

    getSeasonalRecipes: function(season) {
        const seasonalData = {
            spring: {
                name: "Spring Fresh Recipes",
                emoji: "🌸",
                description: "Light and fresh recipes with spring vegetables",
                ingredients: ["asparagus", "peas", "strawberries", "rhubarb", "radishes", "spring greens"],
                recipeTypes: ["salads", "light pasta", "grilled fish", "fruit desserts"],
                color: "bg-green-100 dark:bg-green-900/30",
                textColor: "text-green-800 dark:text-green-200"
            },
            summer: {
                name: "Summer BBQ & Salads",
                emoji: "☀️",
                description: "Refreshing meals perfect for warm weather",
                ingredients: ["tomatoes", "corn", "berries", "zucchini", "bell peppers", "fresh herbs"],
                recipeTypes: ["grilled meats", "cold soups", "fresh salads", "fruit smoothies"],
                color: "bg-yellow-100 dark:bg-yellow-900/30",
                textColor: "text-yellow-800 dark:text-yellow-200"
            },
            autumn: {
                name: "Autumn Comfort Food",
                emoji: "🍂",
                description: "Warm and cozy seasonal favorites",
                ingredients: ["pumpkin", "apples", "squash", "sweet potatoes", "mushrooms", "cranberries"],
                recipeTypes: ["soups", "roasts", "baked goods", "comforting stews"],
                color: "bg-orange-100 dark:bg-orange-900/30",
                textColor: "text-orange-800 dark:text-orange-200"
            },
            winter: {
                name: "Winter Warmers",
                emoji: "⛄",
                description: "Hearty meals to keep you warm",
                ingredients: ["root vegetables", "citrus", "cabbage", "potatoes", "onions", "winter squash"],
                recipeTypes: ["hearty stews", "casseroles", "baked pasta", "warming soups"],
                color: "bg-blue-100 dark:bg-blue-900/30",
                textColor: "text-blue-800 dark:text-blue-200"
            }
        };
        
        return seasonalData[season] || seasonalData.spring;
    },

    updateSeasonalDisplay: function(season, seasonalData) {
        const seasonalRecipeElement = document.getElementById('seasonalRecipe');
        const seasonalDescriptionElement = document.getElementById('seasonalDescription');
        const seasonalEmojiElement = document.getElementById('seasonalEmoji');
        const seasonalCard = document.getElementById('seasonalCard');
        
        if (seasonalRecipeElement) seasonalRecipeElement.textContent = seasonalData.name;
        if (seasonalDescriptionElement) seasonalDescriptionElement.textContent = seasonalData.description;
        if (seasonalEmojiElement) seasonalEmojiElement.textContent = seasonalData.emoji;
        
        if (seasonalCard) {
            seasonalCard.className = `rounded-xl p-6 ${seasonalData.color} ${seasonalData.textColor} border-2 border-transparent hover:border-current transition-all duration-300 cursor-pointer transform hover:scale-105`;
        }
        
        // Update seasonal ingredients list
        const seasonalIngredients = document.getElementById('seasonalIngredients');
        if (seasonalIngredients) {
            seasonalIngredients.innerHTML = seasonalData.ingredients.map(ingredient => 
                `<span class="px-2 py-1 bg-white/50 dark:bg-gray-800/50 rounded-full text-xs">${ingredient}</span>`
            ).join('');
        }
    },

    setupSeasonalClickHandlers: function(season) {
        const seasonalCard = document.getElementById('seasonalCard');
        if (seasonalCard) {
            seasonalCard.addEventListener('click', () => {
                this.fetchSeasonalRecipes(season);
            });
        }
    },

    async fetchSeasonalRecipes(season) {
        const seasonalData = this.getSeasonalRecipes(season);
        const randomIngredient = seasonalData.ingredients[Math.floor(Math.random() * seasonalData.ingredients.length)];
        
        this.showToast(`🍃 Loading ${season} recipes with ${randomIngredient}...`, 'info');
        
        try {
            const API_BASE = 'https://api.edamam.com/api/recipes/v2';
            const APP_ID = '1edd8316';
            const APP_KEY = 'fff5581f3438a5bcac6ab5e038dda7ae';
            
            const url = `${API_BASE}?type=public&q=${encodeURIComponent(randomIngredient)}&app_id=${APP_ID}&app_key=${APP_KEY}&from=0&to=12`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            
            if (data.hits && data.hits.length > 0) {
                const recipes = data.hits.map(hit => this.formatEdamamRecipe(hit.recipe));
                this.displaySeasonalResults(recipes, season);
                this.showToast(`🎉 ${season.charAt(0).toUpperCase() + season.slice(1)} recipes loaded!`, 'success');
            } else {
                throw new Error('No recipes found');
            }
            
        } catch (error) {
            console.error('Error fetching seasonal recipes:', error);
            this.showToast(`🍳 Cooking up some ${season} alternatives...`, 'warning');
            this.loadSeasonalSampleRecipes(season);
        }
    },

    formatEdamamRecipe: function(recipe) {
        return {
            id: recipe.uri?.split('#')[1] || Math.random().toString(36).substr(2, 9),
            title: recipe.label,
            image: recipe.image,
            readyInMinutes: Math.round(recipe.totalTime) || 30,
            servings: recipe.yield || 4,
            calories: Math.round(recipe.calories / (recipe.yield || 1)),
            difficulty: 'medium',
            nutritionScore: 'A',
            rating: (Math.random() * 1 + 4).toFixed(1),
            ingredients: recipe.ingredientLines || [],
            instructions: recipe.ingredientLines || [],
            cuisineType: recipe.cuisineType?.[0] || 'International',
            mealType: recipe.mealType?.[0] || 'Main course',
            tags: (recipe.dietLabels || []).concat(recipe.healthLabels || []).slice(0, 3),
            description: recipe.label || 'A delicious seasonal recipe.'
        };
    },

    displaySeasonalResults: function(recipes, season) {
        if (window.spoonfullApp && window.spoonfullApp.recipeManager) {
            window.spoonfullApp.recipeManager.recipes = recipes;
            window.spoonfullApp.recipeManager.filteredRecipes = recipes;
            window.spoonfullApp.recipeManager.currentPage = 1;
            window.spoonfullApp.recipeManager.favoritesOnly = false;
            
            window.spoonfullApp.recipeManager.renderRecipes();
            window.spoonfullApp.recipeManager.updateRecipeCount();
            
            const resultCount = document.getElementById('resultCount');
            if (resultCount) {
                resultCount.textContent = recipes.length;
            }
            
            const sectionTitle = document.querySelector('#featured-recipes h2');
            if (sectionTitle) {
                const seasonName = season.charAt(0).toUpperCase() + season.slice(1);
                sectionTitle.innerHTML = `${seasonName} Seasonal Recipes (<span id="resultCount">${recipes.length}</span>)`;
            }
            
            const sectionDescription = document.querySelector('#featured-recipes p');
            if (sectionDescription) {
                sectionDescription.textContent = `Fresh ${season} recipes perfect for the current season`;
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
        }
    },

    loadSeasonalSampleRecipes: function(season) {
        const seasonalRecipes = {
            spring: [
                {
                    id: 'spring-1',
                    title: 'Spring Vegetable Pasta',
                    image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    readyInMinutes: 25,
                    servings: 4,
                    calories: 380,
                    difficulty: 'easy',
                    nutritionScore: 'A',
                    rating: 4.5,
                    ingredients: ['asparagus', 'peas', 'pasta', 'lemon', 'parmesan'],
                    instructions: ['Cook pasta', 'Sauté vegetables', 'Combine and serve'],
                    tags: ['vegetarian', 'spring', 'fresh'],
                    description: 'Light and fresh pasta with spring vegetables'
                }
            ],
            summer: [
                {
                    id: 'summer-1', 
                    title: 'Summer Berry Salad',
                    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                    readyInMinutes: 15,
                    servings: 2,
                    calories: 220,
                    difficulty: 'easy',
                    nutritionScore: 'A+',
                    rating: 4.7,
                    ingredients: ['mixed greens', 'berries', 'feta', 'nuts', 'vinaigrette'],
                    instructions: ['Combine ingredients', 'Add dressing', 'Serve fresh'],
                    tags: ['summer', 'healthy', 'quick'],
                    description: 'Refreshing summer salad with fresh berries'
                }
            ]
            // Add autumn and winter sample recipes...
        };
        
        const recipes = seasonalRecipes[season] || seasonalRecipes.spring;
        this.displaySeasonalResults(recipes, season);
    },

    // Recommendations functionality
    initRecommendations: function() {
        if (!this.isIndexPage()) return;
        
        this.setupRecommendationClickHandlers();
        this.updatePersonalizedRecommendations();
    },

    setupRecommendationClickHandlers: function() {
        // Health Boost Card
        const healthBoostCard = document.getElementById('healthBoostCard');
        if (healthBoostCard) {
            healthBoostCard.addEventListener('click', () => {
                this.fetchHealthBoostRecipes();
            });
            
            healthBoostCard.style.cursor = 'pointer';
            healthBoostCard.classList.add('hover:scale-105', 'transition-transform');
        }

        // Time Saver Card
        const timeSaverCard = document.getElementById('timeSaverCard');
        if (timeSaverCard) {
            timeSaverCard.addEventListener('click', () => {
                this.fetchTimeSaverRecipes();
            });
            
            timeSaverCard.style.cursor = 'pointer';
            timeSaverCard.classList.add('hover:scale-105', 'transition-transform');
        }

        // Chef's Pick Card
        const chefsPickCard = document.getElementById('chefsPickCard');
        if (chefsPickCard) {
            chefsPickCard.addEventListener('click', () => {
                this.fetchChefsPickRecipes();
            });
            
            chefsPickCard.style.cursor = 'pointer';
            chefsPickCard.classList.add('hover:scale-105', 'transition-transform');
        }
    },

    updatePersonalizedRecommendations: function() {
        const userProfile = JSON.parse(localStorage.getItem('spoonfull_profile') || '{}');
        const favorites = JSON.parse(localStorage.getItem('spoonfull_favorites') || '[]');
        
        // Update recommendation text based on user activity
        if (favorites.length > 5) {
            const recommendationText = document.getElementById('personalizedRecommendation');
            if (recommendationText) {
                recommendationText.textContent = `Based on your ${favorites.length} saved recipes, we think you'll love these!`;
            }
        }
    },

    async fetchHealthBoostRecipes() {
        this.showToast('🥗 Loading protein-packed healthy recipes...', 'info');
        
        try {
            const API_BASE = 'https://api.edamam.com/api/recipes/v2';
            const APP_ID = '1edd8316';
            const APP_KEY = 'fff5581f3438a5bcac6ab5e038dda7ae';
            
            const healthQueries = ['high-protein', 'low-carb', 'healthy', 'nutritious', 'balanced'];
            const randomQuery = healthQueries[Math.floor(Math.random() * healthQueries.length)];
            
            const url = `${API_BASE}?type=public&q=${encodeURIComponent(randomQuery)}&app_id=${APP_ID}&app_key=${APP_KEY}&from=0&to=12`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            
            if (data.hits && data.hits.length > 0) {
                const recipes = data.hits.map(hit => this.formatEdamamRecipe(hit.recipe));
                this.displayRecommendationResults(recipes, 'Health Boost');
                this.showToast('💪 Healthy recipes served!', 'success');
            } else {
                throw new Error('No recipes found');
            }
            
        } catch (error) {
            console.error('Error fetching health boost recipes:', error);
            this.showToast('🥦 Preparing healthy alternatives...', 'warning');
            this.loadHealthBoostSampleRecipes();
        }
    },

    async fetchTimeSaverRecipes() {
        this.showToast('⚡ Loading quick & easy recipes...', 'info');
        
        try {
            const API_BASE = 'https://api.edamam.com/api/recipes/v2';
            const APP_ID = '1edd8316';
            const APP_KEY = 'fff5581f3438a5bcac6ab5e038dda7ae';
            
            const timeSaverQueries = ['15-minute', 'quick', 'easy', 'fast', 'simple'];
            const randomQuery = timeSaverQueries[Math.floor(Math.random() * timeSaverQueries.length)];
            
            const url = `${API_BASE}?type=public&q=${encodeURIComponent(randomQuery)}&app_id=${APP_ID}&app_key=${APP_KEY}&from=0&to=12`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            
            if (data.hits && data.hits.length > 0) {
                const recipes = data.hits.map(hit => this.formatEdamamRecipe(hit.recipe));
                this.displayRecommendationResults(recipes, 'Time Saver');
                this.showToast('🎯 Quick recipes ready!', 'success');
            } else {
                throw new Error('No recipes found');
            }
            
        } catch (error) {
            console.error('Error fetching time saver recipes:', error);
            this.showToast('⏰ Preparing quick alternatives...', 'warning');
            this.loadTimeSaverSampleRecipes();
        }
    },

    async fetchChefsPickRecipes() {
        this.showToast('👨‍🍳 Loading chef-curated specials...', 'info');
        
        try {
            const API_BASE = 'https://api.edamam.com/api/recipes/v2';
            const APP_ID = '1edd8316';
            const APP_KEY = 'fff5581f3438a5bcac6ab5e038dda7ae';
            
            const chefsQueries = ['gourmet', 'restaurant-style', 'chef', 'special', 'signature'];
            const randomQuery = chefsQueries[Math.floor(Math.random() * chefsQueries.length)];
            
            const url = `${API_BASE}?type=public&q=${encodeURIComponent(randomQuery)}&app_id=${APP_ID}&app_key=${APP_KEY}&from=0&to=12`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            
            if (data.hits && data.hits.length > 0) {
                const recipes = data.hits.map(hit => this.formatEdamamRecipe(hit.recipe));
                this.displayRecommendationResults(recipes, "Chef's Pick");
                this.showToast('🌟 Chef specials served!', 'success');
            } else {
                throw new Error('No recipes found');
            }
            
        } catch (error) {
            console.error('Error fetching chefs pick recipes:', error);
            this.showToast('🍳 Preparing chef alternatives...', 'warning');
            this.loadChefsPickSampleRecipes();
        }
    },

    displayRecommendationResults: function(recipes, type) {
        if (window.spoonfullApp && window.spoonfullApp.recipeManager) {
            window.spoonfullApp.recipeManager.recipes = recipes;
            window.spoonfullApp.recipeManager.filteredRecipes = recipes;
            window.spoonfullApp.recipeManager.currentPage = 1;
            window.spoonfullApp.recipeManager.favoritesOnly = false;
            
            window.spoonfullApp.recipeManager.renderRecipes();
            window.spoonfullApp.recipeManager.updateRecipeCount();
            
            const resultCount = document.getElementById('resultCount');
            if (resultCount) {
                resultCount.textContent = recipes.length;
            }
            
            const sectionTitle = document.querySelector('#featured-recipes h2');
            if (sectionTitle) {
                sectionTitle.innerHTML = `${type} Recipes (<span id="resultCount">${recipes.length}</span>)`;
            }
            
            const sectionDescription = document.querySelector('#featured-recipes p');
            if (sectionDescription) {
                const descriptions = {
                    'Health Boost': 'Protein-packed recipes to fuel your healthy lifestyle',
                    'Time Saver': 'Quick & easy meals for your busy schedule',
                    "Chef's Pick": 'Special recipes curated for amazing flavor experiences'
                };
                sectionDescription.textContent = descriptions[type] || `${type} recipes for your cooking inspiration`;
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
        }
    },

    loadHealthBoostSampleRecipes: function() {
        const sampleRecipes = [
            {
                id: 'health-1',
                title: 'Quinoa Power Bowl',
                image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 20,
                servings: 2,
                calories: 380,
                difficulty: 'easy',
                nutritionScore: 'A+',
                rating: 4.6,
                ingredients: ['quinoa', 'chickpeas', 'avocado', 'vegetables', 'tahini dressing'],
                instructions: ['Cook quinoa', 'Add toppings', 'Dress and serve'],
                tags: ['healthy', 'high-protein', 'vegetarian'],
                description: 'Nutrient-dense power bowl packed with protein'
            }
            // Add more sample recipes...
        ];
        
        this.displayRecommendationResults(sampleRecipes, 'Health Boost');
    },

    loadTimeSaverSampleRecipes: function() {
        const sampleRecipes = [
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
                ingredients: ['mixed vegetables', 'tofu', 'soy sauce', 'ginger', 'garlic'],
                instructions: ['Stir-fry vegetables', 'Add sauce', 'Serve with rice'],
                tags: ['quick', 'easy', 'vegetarian'],
                description: 'Quick and delicious stir fry ready in minutes'
            }
            // Add more sample recipes...
        ];
        
        this.displayRecommendationResults(sampleRecipes, 'Time Saver');
    },

    loadChefsPickSampleRecipes: function() {
        const sampleRecipes = [
            {
                id: 'chef-1',
                title: 'Gourmet Mushroom Risotto',
                image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
                readyInMinutes: 40,
                servings: 3,
                calories: 380,
                difficulty: 'medium',
                nutritionScore: 'A',
                rating: 4.8,
                ingredients: ['arborio rice', 'mixed mushrooms', 'white wine', 'parmesan', 'truffle oil'],
                instructions: ['Sauté mushrooms', 'Cook risotto', 'Finish with parmesan'],
                tags: ['gourmet', 'restaurant-style', 'comfort-food'],
                description: 'Creamy and luxurious mushroom risotto'
            }
            // Add more sample recipes...
        ];
        
        this.displayRecommendationResults(sampleRecipes, "Chef's Pick");
    },

    // Dashboard stats
    updateDashboardStats: function() {
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
    },

    updateUserActivity: function() {
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
        
        userActivity[today].lastActive = new Date().toISOString();
        localStorage.setItem('spoonfull_userActivity', JSON.stringify(userActivity));
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
        // Quick action buttons
        const quickAddButtons = document.querySelectorAll('.quick-add-btn');
        quickAddButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mealType = e.target.closest('.quick-add-btn').dataset.meal;
                this.quickAddToPlan(mealType);
            });
        });

        // Generate shopping list button
        const generateListBtn = document.getElementById('generateListBtn');
        if (generateListBtn) {
            generateListBtn.addEventListener('click', () => {
                this.generateShoppingList();
            });
        }
    },

    quickAddToPlan: function(mealType) {
        const suggestedRecipes = {
            breakfast: ["Overnight Oats", "Avocado Toast", "Smoothie Bowl", "Yogurt Parfait", "Egg Scramble"],
            lunch: ["Quinoa Salad", "Wrap", "Buddha Bowl", "Soup", "Sandwich"],
            dinner: ["Stir Fry", "Pasta", "Sheet Pan Dinner", "Roast", "Curry"],
            snack: ["Energy Balls", "Fruit Salad", "Hummus & Veggies", "Trail Mix", "Yogurt"]
        };

        const suggestions = suggestedRecipes[mealType];
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        
        this.showToast(`Quick add: ${randomSuggestion} for ${mealType}`, 'success');
        
        // In a real app, this would actually add to meal plan
        setTimeout(() => {
            if (window.spoonfullApp && window.spoonfullApp.recipeManager.recipes.length > 0) {
                const randomRecipe = window.spoonfullApp.recipeManager.recipes[Math.floor(Math.random() * window.spoonfullApp.recipeManager.recipes.length)];
                window.spoonfullApp.addQuickMealToPlan('monday', mealType, randomRecipe);
            }
        }, 1000);
    },

    generateShoppingList: function() {
        this.showToast('🛒 Generating your smart shopping list...', 'info');
        
        setTimeout(() => {
            const mealPlan = JSON.parse(localStorage.getItem('spoonfull_mealPlan') || '{}');
            let totalItems = 0;
            
            Object.values(mealPlan).forEach(day => {
                if (typeof day === 'object') {
                    Object.values(day).forEach(meals => {
                        if (Array.isArray(meals)) {
                            totalItems += meals.length;
                        }
                    });
                }
            });
            
            if (totalItems > 0) {
                this.showToast(`📋 Shopping list with ${totalItems * 5} items generated!`, 'success');
            } else {
                this.showToast('📝 Add some meals to your plan first!', 'warning');
            }
        }, 1500);
    }
};

// Main Application Class
class SpoonfullApp {
    constructor() {
        this.isIndexPage = this.checkIfIndexPage();
        this.recipeManager = new RecipeManager();
        this.userProfile = this.loadUserProfile();
        this.foodQuotes = this.initializeFoodQuotes();
        this.currentQuoteIndex = 0;
        this.currentRecipeForPlan = null;
        this.modalContentCache = new Map();
        
        this.init();
    }

    checkIfIndexPage() {
        return window.location.pathname.endsWith('index.html') || 
               window.location.pathname === '/' || 
               window.location.pathname.endsWith('/');
    }

    init() {
        this.initLucideIcons();
        this.initEventListeners();
        this.initDynamicContent();
        
        if (this.isIndexPage) {
            spoonfullDashboard.init();
            this.loadDashboardData();
            this.startQuoteRotation();
            this.initGoals();
        }
        
        this.recipeManager.initializeOnPage();
    }

    loadUserProfile() {
        const savedProfile = localStorage.getItem('spoonfull_profile');
        if (savedProfile) {
            return JSON.parse(savedProfile);
        }
        
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

    initializeFoodQuotes()  {
        const quotes = [
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

        return quotes;
    }

    startQuoteRotation() {
        if (!this.isIndexPage) return;
        
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
                
                setTimeout(() => {
                    foodTalk.classList.remove('animate-quote-slide');
                    tipTalk.classList.remove('animate-quote-slide');
                }, 1000);
                
            }, 300);
        }
        
        this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.foodQuotes.length;
    }

    loadDashboardData() {
        if (!this.isIndexPage) return;
        
        this.updateStats();
        this.updateMealPlanDisplay();
        this.updateDateAndGreeting();
        this.updateUserActivity();
    }

    updateStats() {
        spoonfullDashboard.updateDashboardStats();
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

    showRecipeModal(recipe) {
        const modal = document.getElementById('recipeModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalTitle || !modalBody) return;
        
        requestAnimationFrame(() => {
            modalTitle.textContent = recipe.title;
            
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
                            <button onclick="window.spoonfullApp.shareRecipe('${recipe.id}')" 
                                    class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
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
                    ${this.renderVideoSection(recipe)}
                </div>
            </div>
        `;
    }

    // Helper methods for modal content
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

    renderVideoSection(recipe) {
        // Enhanced YouTube search with recipe preparation focus
        const searchTerms = [
            recipe.title,
            'recipe',
            'cooking tutorial',
            'how to make',
            'step by step',
            'preparation'
        ].join(' ');
        
        const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerms)}`;
        
        return `
            <div>
                <h5 class="text-lg font-semibold mb-4 flex items-center gap-2">
                    <i data-lucide="play-circle" class="w-5 h-5 text-emerald-600"></i>
                    Video Tutorial
                </h5>
                <div class="video-container bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center p-6">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i data-lucide="play" class="w-8 h-8 text-red-600"></i>
                        </div>
                        <h6 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">Watch Cooking Tutorial</h6>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">See how to make "${recipe.title}" step-by-step</p>
                        <a href="${youtubeSearchUrl}" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           class="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 hover:scale-105 font-medium shadow-lg">
                            <i data-lucide="play" class="w-5 h-5"></i>
                            Watch on YouTube
                        </a>
                        <div class="mt-4 flex justify-center items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <i data-lucide="external-link" class="w-3 h-3"></i>
                            Opens in new tab
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    shareRecipe(recipeId) {
        const recipe = this.recipeManager.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        const shareData = {
            title: recipe.title,
            text: `Check out this delicious recipe: ${recipe.title} - ${recipe.description || 'Amazing recipe from Spoonfull'}`,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData)
                .then(() => console.log('Recipe shared successfully'))
                .catch((error) => {
                    this.showCustomShareModal(recipe);
                });
        } else {
            this.showCustomShareModal(recipe);
        }
    }

    showCustomShareModal(recipe) {
        const shareUrl = encodeURIComponent(window.location.href);
        const shareText = encodeURIComponent(`Check out this recipe: ${recipe.title} - ${recipe.description || 'Delicious recipe from Spoonfull'}`);
        
        const socialLinks = {
            twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
            pinterest: `https://pinterest.com/pin/create/button/?url=${shareUrl}&description=${shareText}`,
            whatsapp: `https://api.whatsapp.com/send?text=${shareText} ${shareUrl}`,
            email: `mailto:?subject=${shareText}&body=${shareText} ${shareUrl}`
        };

        const modalContent = `
            <div class="text-center p-6">
                <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="share-2" class="w-8 h-8 text-emerald-600"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Share Recipe</h3>
                <p class="text-gray-600 dark:text-gray-300 mb-6">
                    Share "${recipe.title}" with your friends
                </p>
                
                <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                    <a href="${socialLinks.twitter}" target="_blank" rel="noopener noreferrer" 
                       class="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                        <i data-lucide="twitter" class="w-6 h-6 text-blue-500 mb-1"></i>
                        <span class="text-xs font-medium">Twitter</span>
                    </a>
                    
                    <a href="${socialLinks.facebook}" target="_blank" rel="noopener noreferrer"
                       class="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                        <i data-lucide="facebook" class="w-6 h-6 text-blue-700 mb-1"></i>
                        <span class="text-xs font-medium">Facebook</span>
                    </a>
                    
                    <a href="${socialLinks.pinterest}" target="_blank" rel="noopener noreferrer"
                       class="flex flex-col items-center justify-center p-3 rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                        <i data-lucide="heart" class="w-6 h-6 text-red-500 mb-1"></i>
                        <span class="text-xs font-medium">Pinterest</span>
                    </a>
                    
                    <a href="${socialLinks.whatsapp}" target="_blank" rel="noopener noreferrer"
                       class="flex flex-col items-center justify-center p-3 rounded-lg bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                        <i data-lucide="message-circle" class="w-6 h-6 text-green-500 mb-1"></i>
                        <span class="text-xs font-medium">WhatsApp</span>
                    </a>
                    
                    <a href="${socialLinks.email}" 
                       class="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <i data-lucide="mail" class="w-6 h-6 text-gray-600 dark:text-gray-400 mb-1"></i>
                        <span class="text-xs font-medium">Email</span>
                    </a>
                </div>
                
                <div class="flex gap-3">
                    <button onclick="window.spoonfullApp.copyRecipeLink('${recipe.id}')" 
                            class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <i data-lucide="copy" class="w-4 h-4"></i>
                        Copy Link
                    </button>
                    <button onclick="window.spoonfullApp.closeModal('recipeModal')" 
                            class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        `;

        this.showCustomModal('Share Recipe', modalContent, () => {
            this.initLucideIcons();
        });
    }

    copyRecipeLink(recipeId) {
        const recipeUrl = window.location.href;
        
        navigator.clipboard.writeText(recipeUrl).then(() => {
            this.showNotification('Recipe link copied to clipboard!', 'success');
            this.closeModal('recipeModal');
        }).catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = recipeUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Recipe link copied to clipboard!', 'success');
            this.closeModal('recipeModal');
        });
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

    initGoals() {
        if (!this.isIndexPage) return;
        
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

    updateUserActivity() {
        spoonfullDashboard.updateUserActivity();
    }

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

    initDashboardEvents() {
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

        const resetPlannerLink = document.getElementById('resetPlannerLink');
        if (resetPlannerLink) {
            resetPlannerLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showResetConfirmation();
            });
        }

        const showFavoritesBtn = document.getElementById('showFavoritesBtn');
        if (showFavoritesBtn) {
            showFavoritesBtn.addEventListener('click', () => {
                this.recipeManager.toggleFavoritesView();
            });
        }

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
        const keysToRemove = [
            'spoonfull_mealPlan',
            'spoonfull_favorites', 
            'spoonfull_goals',
            'spoonfull_userActivity',
            'spoonfull_profile'
        ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        this.userProfile = {
            name: 'Guest',
            email: 'Not signed in',
            diet: '',
            allergies: '',
            stats: { recipesTried: 0, favorites: 0, mealsPlanned: 0, progress: 0 }
        };
        
        this.updateProfileDisplay();
        this.updateMealPlanDisplay();
        this.updateStats();
        this.initGoals();
        this.updateUserActivity();
        
        this.modalContentCache.clear();
        
        this.showNotification('All data has been reset successfully! Dashboard cleared.', 'success');
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

    quickAddToPlan(mealType) {
        spoonfullDashboard.quickAddToPlan(mealType);
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
        spoonfullDashboard.generateShoppingList();
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

// Back to Top functionality with Utensils icon
function initBackToTop() {
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    
    if (scrollTopBtn) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollTopBtn.classList.remove('opacity-0', 'translate-y-10', 'scale-50', 'pointer-events-none');
                scrollTopBtn.classList.add('opacity-100', 'translate-y-0', 'scale-100', 'pointer-events-auto');
            } else {
                scrollTopBtn.classList.remove('opacity-100', 'translate-y-0', 'scale-100', 'pointer-events-auto');
                scrollTopBtn.classList.add('opacity-0', 'translate-y-10', 'scale-50', 'pointer-events-none');
            }
        });

        // Scroll to top when clicked
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Initialize Lucide icon
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        console.log('Back to top button with utensils icon initialized');
    } else {
        console.log('Back to top button not found');
    }
}

// Call the function when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initBackToTop();
});



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

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(function(error) {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// Sidebar version animation
    const sidebarVersion = document.getElementById('sidebarVersion');
    if (sidebarVersion) {
        setTimeout(() => {
            sidebarVersion.classList.add('sv-animate', 'sv-stagger');
        }, 300);
    }

const CACHE_NAME = 'spoonfull-v1';