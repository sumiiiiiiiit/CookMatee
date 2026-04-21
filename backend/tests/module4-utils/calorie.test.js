/**
 * Nutrition & Calculation Utility Tests
 * Making sure our math for calorie counting is actually correct.
 * Uses a mocked CSV of ingredient data for consistent results.
 */
const { calculateRecipeCalories } = require('../../utils/calorieCalculator');
const fs = require('fs');

// We mock FS so we don't have to worry about the actual CSV file existence during tests
jest.mock('fs');

describe('Nutritional Math Utilities', () => {

    beforeAll(() => {
        // Mocking some basic nutritional data
        const mockCsvData = "id,name,calories,protein,carbs,fat\n1,banana,89,1.1,23,0.3\n2,egg,155,13,1.1,11";
        fs.readFileSync.mockReturnValue(mockCsvData);
    });

    // UT-21: Calculate calories for a mixed meal
    // Testing the core logic of the nutritional calculator with multiple ingredients.
    it('UT-21: Should calculate calories correctly for a mixed meal', () => {
        // Scenario: A breakfast with bananas and eggs
        const ingredients = [
            { name: 'banana', quantity: '2' }, // 2 servings
            { name: 'egg', quantity: '2' }      // 2 servings
        ];
        
        const result = calculateRecipeCalories(ingredients, 'raw');
        
        // Expected total: approx 439 kcal based on formulas
        expect(result.calories).toBeCloseTo(439, 0);
    });

    // UT-22: Handle weight-based measurements (Grams)
    // Verifying that the utility correctly scales nutrition based on weight (e.g., 500g).
    it('UT-22: Should handle weight-based measurements (like grams) properly', () => {
        // Scenario: Buying a specific weight of an ingredient
        const ingredients = [
            { name: 'banana', quantity: '500g' } // 5 portions of 100g
        ];
        const result = calculateRecipeCalories(ingredients, 'grilling');
        
        // 5 * 89 = 445 calories
        expect(result.calories).toBe(445);
    });

});

