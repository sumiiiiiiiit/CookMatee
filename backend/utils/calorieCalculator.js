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
    
    // Clean string
    let cleanStr = quantityStr.toString().toLowerCase().trim().replace(',', '.');
    
    // Handle specific culinary terms where num isn't strictly present or means something small
    if (cleanStr.includes('to taste') || cleanStr.includes('pinch') || cleanStr.includes('dash')) return 2;
    if (cleanStr.includes('as needed')) return 15; // e.g. a tablespoon or so

    // Find number
    const numMatch = cleanStr.match(/([\d./]+)/);
    
    let num = 1; // Default to 1 if no number found but string has a recognized word
    if (numMatch) {
        if (numMatch[1].includes('/')) {
            const parts = numMatch[1].split('/');
            num = parseFloat(parts[0]) / parseFloat(parts[1]);
        } else {
            num = parseFloat(numMatch[1]);
        }
    } else {
        // If no number but we have Words like medium, small
        if (!cleanStr.match(/medium|small|large|clove|piece|slice/i)) {
            return 100; // Complete fallback
        }
    }

    if (isNaN(num)) return 100;

    // Unit conversions to grams (approximate)
    if (cleanStr.match(/\b(kg|kilogram|kilograms)\b/i)) return num * 1000;
    if (cleanStr.match(/\b(ml|millilitre|millilitres)\b/i)) return num; // 1ml ≈ 1g
    if (cleanStr.match(/\b(l|litre|litres)\b/i)) return num * 1000;
    if (cleanStr.match(/\b(tsp|teaspoon|teaspoons)\b/i)) return num * 5;
    if (cleanStr.match(/\b(tbsp|tablespoon|tablespoons)\b/i)) return num * 15;
    if (cleanStr.match(/\b(cup|cups)\b/i)) return num * 240;
    if (cleanStr.match(/\b(g|gram|grams)\b/i)) return num;
    if (cleanStr.match(/\b(clove|cloves)\b/i)) return num * 5;
    if (cleanStr.match(/\b(slice|slices)\b/i)) return num * 25;
    if (cleanStr.match(/\b(medium)\b/i)) return num * 130;
    if (cleanStr.match(/\b(small)\b/i)) return num * 80;
    if (cleanStr.match(/\b(large)\b/i)) return num * 180;
    if (cleanStr.match(/\b(piece|pieces)\b/i)) return num * 100;
    
    // If no unit, check if it's a small number (count-like) e.g. "2" onions
    if (num <= 10) return num * 100; 

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
        
        let ingName = ing.name.toLowerCase().trim();
        const grams = extractGrams(ing.quantity);
        
        let matchedNutrition = null;
        
        if (ingName === 'water' || ingName === 'ice') {
            matchedNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        } else if (data[ingName]) {
            matchedNutrition = data[ingName];
        } else {
            // Partial match - look for full word match to prevent "water" matching "watermelon"
            for (const [dbName, dbNutr] of Object.entries(data)) {
                const nameWords = ingName.split(/[\s-]+/);
                const dbWords = dbName.split(/[\s-]+/);
                
                // If any word exactly matches, prioritize that
                if (nameWords.some(w => dbWords.includes(w))) {
                    matchedNutrition = dbNutr;
                    break;
                }
            }
            // Fallback to substring match if no word matched
            if (!matchedNutrition) {
                for (const [dbName, dbNutr] of Object.entries(data)) {
                    if (ingName.includes(dbName) || dbName.includes(ingName)) {
                        matchedNutrition = dbNutr;
                        break;
                    }
                }
            }
        }
        
        // If no match found, default to zero
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
