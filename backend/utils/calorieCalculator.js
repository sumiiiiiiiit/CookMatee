const fs = require('fs');
const path = require('path');

// Cooking method adjustments
const cookingMethodMultipliers = {
    'deep_frying': 1.30,
    'frying': 1.15,
    'pan_frying': 1.15,
    'stir_frying': 1.10,
    'sauteing': 1.10,
    'baking': 1.05,
    'roasting': 1.05,
    'grilling': 1.00,
    'pressure_cooking': 1.00,
    'simmering': 1.00,
    'braising': 1.00,
    'stewing': 1.00,
    'slow_cooking': 1.00,
    'boiling': 0.95,
    'steaming': 0.95,
    'raw': 0.90,
    'marinating': 1.00
};

let nutritionData = null;

const loadNutritionData = () => {
    if (nutritionData) return nutritionData;
    
    try {
        const csvPath = path.join(__dirname, '../Python/ingredients_dataset.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.split('\n');
        
        nutritionData = {};
        
        // Skip header
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split(',');
            if (parts.length < 6) continue;
            
            const name = parts[1].toLowerCase().trim();
            const nutrition = {
                calories: parseFloat(parts[2]) || 0,
                protein: parseFloat(parts[3]) || 0,
                carbs: parseFloat(parts[4]) || 0,
                fat: parseFloat(parts[5]) || 0
            };
            
            nutritionData[name] = nutrition;
        }
        return nutritionData;
    } catch (err) {
        console.error('Error loading nutrition data:', err);
        return {};
    }
};

const extractGrams = (quantityStr) => {
    if (!quantityStr) return 100; // Default if empty
    
    // Clean string and handle fractions if any (e.g. 1/2)
    let cleanStr = quantityStr.replace(',', '.');
    
    // Find number
    const numMatch = cleanStr.match(/([\d./]+)/);
    if (!numMatch) return 100;

    let num;
    if (numMatch[1].includes('/')) {
        const parts = numMatch[1].split('/');
        num = parseFloat(parts[0]) / parseFloat(parts[1]);
    } else {
        num = parseFloat(numMatch[1]);
    }

    if (isNaN(num)) return 100;

    // Unit conversions to grams (approximate)
    if (cleanStr.match(/kg|kilogram|kilograms/i)) return num * 1000;
    if (cleanStr.match(/ml|millilitre|millilitres/i)) return num; // 1ml ≈ 1g
    if (cleanStr.match(/l|litre|litres/i)) return num * 1000;
    if (cleanStr.match(/tsp|teaspoon|teaspoons/i)) return num * 5;
    if (cleanStr.match(/tbsp|tablespoon|tablespoons/i)) return num * 15;
    if (cleanStr.match(/cup|cups/i)) return num * 240;
    if (cleanStr.match(/g|gram|grams/i)) return num;
    
    // If no unit, check if it's a small number (count-like)
    if (num < 10) return num * 100; 

    return num; // Default fallback assumes g if large number
};

const calculateRecipeCalories = (ingredients, cookingMethod) => {
    const data = loadNutritionData();
    let total = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    };
    
    if (!Array.isArray(ingredients)) return total;
    
    ingredients.forEach(ing => {
        if (!ing || !ing.name) return;
        
        const ingName = ing.name.toLowerCase().trim();
        const grams = extractGrams(ing.quantity);
        
        // Find best match in dataset
        let matchedNutrition = null;
        
        // Exact match
        if (data[ingName]) {
            matchedNutrition = data[ingName];
        } else {
            // Partial match
            for (const [dbName, dbNutr] of Object.entries(data)) {
                if (ingName.includes(dbName) || dbName.includes(ingName)) {
                    matchedNutrition = dbNutr;
                    break;
                }
            }
        }
        
        // If no match found, default to zero (e.g. for water or unknown items)
        if (!matchedNutrition) {
            matchedNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }
        
        total.calories += (matchedNutrition.calories * grams) / 100;
        total.protein += (matchedNutrition.protein * grams) / 100;
        total.carbs += (matchedNutrition.carbs * grams) / 100;
        total.fat += (matchedNutrition.fat * grams) / 100;
    });
    
    // Apply cooking method multiplier
    const rawMethod = (cookingMethod || '').toLowerCase().replace(' ', '_');
    const multiplier = cookingMethodMultipliers[rawMethod] || 1.0;
    
    return {
        calories: Math.round(total.calories * multiplier),
        protein: Math.round(total.protein * multiplier),
        carbs: Math.round(total.carbs * multiplier),
        fat: Math.round(total.fat * multiplier)
    };
};

module.exports = {
    calculateRecipeCalories
};
