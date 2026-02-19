/**
 * SOFIYA Nutrition Service
 * Phase 6.4: Meal Planning & Nutrition Module
 * 
 * Suggests recipes based on available ingredients, dietary restrictions,
 * and generates shopping lists. Integrates with grocery delivery services.
 */

import 'dotenv/config';
import { createClient } from 'pg';

export class NutritionService {
    constructor(options = {}) {
        this.db = options.db || null;
        this.recipeDatabase = this.initializeRecipeDatabase();
        this.dietaryRestrictions = new Map();
    }

    /**
     * Initializes recipe database
     * @private
     */
    initializeRecipeDatabase() {
        return {
            'pasta_carbonara': {
                name: 'Pasta Carbonara',
                cuisine: 'Italian',
                prepTime: 20,
                cookTime: 15,
                servings: 4,
                ingredients: ['pasta', 'eggs', 'bacon', 'parmesan', 'black pepper'],
                dietary: ['gluten'], // Contains gluten
                calories: 520,
                protein: 25,
                carbs: 55,
                fat: 20
            },
            'chicken_stir_fry': {
                name: 'Chicken Stir Fry',
                cuisine: 'Asian',
                prepTime: 15,
                cookTime: 10,
                servings: 4,
                ingredients: ['chicken', 'broccoli', 'carrots', 'soy sauce', 'ginger', 'garlic', 'rice'],
                dietary: ['gluten'], // Soy sauce contains gluten
                calories: 380,
                protein: 35,
                carbs: 40,
                fat: 10
            },
            'salmon_salad': {
                name: 'Grilled Salmon Salad',
                cuisine: 'Mediterranean',
                prepTime: 10,
                cookTime: 15,
                servings: 2,
                ingredients: ['salmon', 'lettuce', 'tomatoes', 'cucumber', 'olive oil', 'lemon'],
                dietary: [],
                calories: 320,
                protein: 30,
                carbs: 15,
                fat: 18
            },
            'vegetable_curry': {
                name: 'Vegetable Curry',
                cuisine: 'Indian',
                prepTime: 20,
                cookTime: 30,
                servings: 4,
                ingredients: ['potatoes', 'cauliflower', 'onions', 'tomatoes', 'curry powder', 'coconut milk', 'rice'],
                dietary: [],
                calories: 280,
                protein: 8,
                carbs: 45,
                fat: 10
            },
            'quinoa_bowl': {
                name: 'Quinoa Power Bowl',
                cuisine: 'Healthy',
                prepTime: 15,
                cookTime: 20,
                servings: 2,
                ingredients: ['quinoa', 'black beans', 'avocado', 'corn', 'lime', 'cilantro'],
                dietary: [],
                calories: 420,
                protein: 18,
                carbs: 55,
                fat: 15
            },
            'chicken_teriyaki': {
                name: 'Chicken Teriyaki',
                cuisine: 'Japanese',
                prepTime: 10,
                cookTime: 20,
                servings: 4,
                ingredients: ['chicken', 'teriyaki sauce', 'broccoli', 'rice', 'sesame seeds'],
                dietary: ['gluten'], // Teriyaki sauce may contain gluten
                calories: 450,
                protein: 40,
                carbs: 50,
                fat: 12
            }
        };
    }

    /**
     * Scans fridge inventory (from camera or manual input)
     * @param {string} userId - User ID
     * @param {Array} items - List of items in fridge
     * @returns {Promise<Object>} Inventory record
     */
    async scanFridge(userId, items) {
        if (!this.db) {
            return { userId, items, scannedAt: new Date().toISOString() };
        }

        try {
            const query = `
                INSERT INTO fridge_inventory (user_id, items, scanned_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (user_id) DO UPDATE
                SET items = $2, scanned_at = NOW()
                RETURNING *
            `;

            const result = await this.db.query(query, [userId, JSON.stringify(items)]);
            return result.rows[0];
        } catch (error) {
            console.error('[NutritionService] Error scanning fridge:', error);
            return { userId, items, scannedAt: new Date().toISOString() };
        }
    }

    /**
     * Gets current fridge inventory
     * @param {string} userId - User ID
     * @returns {Promise<Array>} List of items
     */
    async getFridgeInventory(userId) {
        if (!this.db) {
            return [];
        }

        try {
            const query = `
                SELECT items FROM fridge_inventory
                WHERE user_id = $1
            `;

            const result = await this.db.query(query, [userId]);
            if (result.rows.length > 0) {
                return JSON.parse(result.rows[0].items || '[]');
            }
            return [];
        } catch (error) {
            console.error('[NutritionService] Error getting inventory:', error);
            return [];
        }
    }

    /**
     * Suggests recipes based on available ingredients
     * @param {string} userId - User ID
     * @param {Object} options - Options
     * @param {Array} options.availableIngredients - Available ingredients (optional, uses fridge if not provided)
     * @param {Array} options.dietaryRestrictions - Dietary restrictions
     * @param {string} options.cuisine - Preferred cuisine
     * @returns {Promise<Array>} Suggested recipes
     */
    async suggestRecipes(userId, options = {}) {
        const {
            availableIngredients = null,
            dietaryRestrictions = [],
            cuisine = null
        } = options;

        // Get available ingredients from fridge if not provided
        const ingredients = availableIngredients || await this.getFridgeInventory(userId);
        const userRestrictions = dietaryRestrictions.length > 0
            ? dietaryRestrictions
            : await this.getUserDietaryRestrictions(userId);

        // Find matching recipes
        const suggestions = [];

        Object.entries(this.recipeDatabase).forEach(([id, recipe]) => {
            // Check dietary restrictions
            const hasRestriction = recipe.dietary.some(r => userRestrictions.includes(r));
            if (hasRestriction) {
                return; // Skip recipes with restricted ingredients
            }

            // Check cuisine preference
            if (cuisine && recipe.cuisine.toLowerCase() !== cuisine.toLowerCase()) {
                return;
            }

            // Calculate match score based on available ingredients
            const matchScore = this.calculateMatchScore(recipe.ingredients, ingredients);

            if (matchScore > 0.3) { // At least 30% match
                suggestions.push({
                    ...recipe,
                    id,
                    matchScore,
                    missingIngredients: this.getMissingIngredients(recipe.ingredients, ingredients)
                });
            }
        });

        // Sort by match score (highest first)
        suggestions.sort((a, b) => b.matchScore - a.matchScore);

        return suggestions.slice(0, 5); // Top 5 suggestions
    }

    /**
     * Calculates match score between recipe and available ingredients
     * @private
     */
    calculateMatchScore(recipeIngredients, availableIngredients) {
        const availableLower = availableIngredients.map(i => i.toLowerCase());
        const recipeLower = recipeIngredients.map(i => i.toLowerCase());

        const matches = recipeLower.filter(ing =>
            availableLower.some(avail => avail.includes(ing) || ing.includes(avail))
        ).length;

        return matches / recipeIngredients.length;
    }

    /**
     * Gets missing ingredients for a recipe
     * @private
     */
    getMissingIngredients(recipeIngredients, availableIngredients) {
        const availableLower = availableIngredients.map(i => i.toLowerCase());

        return recipeIngredients.filter(ing => {
            const ingLower = ing.toLowerCase();
            return !availableLower.some(avail => avail.includes(ingLower) || ingLower.includes(avail));
        });
    }

    /**
     * Generates shopping list for missing ingredients
     * @param {string} userId - User ID
     * @param {string} recipeId - Recipe ID
     * @returns {Promise<Object>} Shopping list
     */
    async generateShoppingList(userId, recipeId) {
        const recipe = this.recipeDatabase[recipeId];
        if (!recipe) {
            throw new Error(`Recipe not found: ${recipeId}`);
        }

        const availableIngredients = await this.getFridgeInventory(userId);
        const missingIngredients = this.getMissingIngredients(recipe.ingredients, availableIngredients);

        const shoppingList = {
            userId,
            recipeId,
            recipeName: recipe.name,
            items: missingIngredients,
            generatedAt: new Date().toISOString()
        };

        // Save shopping list
        if (this.db) {
            await this.saveShoppingList(userId, shoppingList);
        }

        return shoppingList;
    }

    /**
     * Gets user's dietary restrictions
     * @private
     */
    async getUserDietaryRestrictions(userId) {
        if (!this.db) {
            return this.dietaryRestrictions.get(userId) || [];
        }

        try {
            const query = `
                SELECT dietary_restrictions FROM user_profiles
                WHERE user_id = $1
            `;

            const result = await this.db.query(query, [userId]);
            if (result.rows.length > 0 && result.rows[0].dietary_restrictions) {
                return JSON.parse(result.rows[0].dietary_restrictions || '[]');
            }
            return [];
        } catch (error) {
            console.error('[NutritionService] Error getting restrictions:', error);
            return [];
        }
    }

    /**
     * Sets user dietary restrictions
     * @param {string} userId - User ID
     * @param {Array} restrictions - Dietary restrictions (e.g., ['gluten', 'dairy', 'vegetarian'])
     */
    async setDietaryRestrictions(userId, restrictions) {
        this.dietaryRestrictions.set(userId, restrictions);

        if (this.db) {
            try {
                const query = `
                    UPDATE user_profiles
                    SET dietary_restrictions = $1
                    WHERE user_id = $2
                `;

                await this.db.query(query, [JSON.stringify(restrictions), userId]);
            } catch (error) {
                console.error('[NutritionService] Error saving restrictions:', error);
            }
        }
    }

    /**
     * Saves shopping list to database
     * @private
     */
    async saveShoppingList(userId, shoppingList) {
        if (!this.db) {
            return;
        }

        try {
            const query = `
                INSERT INTO shopping_lists (user_id, recipe_id, items, created_at)
                VALUES ($1, $2, $3, NOW())
            `;

            await this.db.query(query, [
                userId,
                shoppingList.recipeId,
                JSON.stringify(shoppingList.items)
            ]);
        } catch (error) {
            console.error('[NutritionService] Error saving shopping list:', error);
        }
    }

    /**
     * Gets user's shopping lists
     * @param {string} userId - User ID
     * @returns {Promise<Array>} Shopping lists
     */
    async getShoppingLists(userId) {
        if (!this.db) {
            return [];
        }

        try {
            const query = `
                SELECT * FROM shopping_lists
                WHERE user_id = $1
                ORDER BY created_at DESC
            `;

            const result = await this.db.query(query, [userId]);
            return result.rows.map(row => ({
                ...row,
                items: JSON.parse(row.items || '[]')
            }));
        } catch (error) {
            console.error('[NutritionService] Error getting shopping lists:', error);
            return [];
        }
    }

    /**
     * Integrates with grocery delivery service (placeholder)
     * @param {string} userId - User ID
     * @param {Array} items - Items to order
     * @param {string} service - Service name ('amazon_fresh', 'instacart')
     * @returns {Promise<Object>} Order result
     */
    async orderGroceryDelivery(userId, items, service = 'amazon_fresh') {
        // In production, integrate with actual grocery delivery APIs
        console.log(`[NutritionService] Ordering groceries via ${service}:`, items);

        return {
            success: true,
            service,
            items,
            estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
            orderId: `order_${Date.now()}`
        };
    }
}

// Example usage:
// const nutrition = new NutritionService({ db });
// await nutrition.scanFridge('user123', ['chicken', 'broccoli', 'rice', 'soy sauce']);
// const suggestions = await nutrition.suggestRecipes('user123', { cuisine: 'Asian' });
// const shoppingList = await nutrition.generateShoppingList('user123', 'chicken_stir_fry');
// await nutrition.orderGroceryDelivery('user123', shoppingList.items, 'amazon_fresh');
