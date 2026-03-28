"""
🍳 Recipe Search AI Engine
Main Python script for AI-powered recipe suggestions (YouTube-style autocomplete)
For: Cookmate MERN Project

Features:
- TF-IDF vectorization for text matching
- Cosine similarity ranking
- Popularity & trending score weighting
- Real-time suggestions via command line or API

Usage:
    python recipe_search_main.py generate 800          # Generate 800 recipes
    python recipe_search_main.py train                 # Train model
    python recipe_search_main.py suggest "pasta"       # Test suggestions
    python recipe_search_main.py trending              # Get trending recipes
"""

import re
import json
import sys
import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Tuple
import random

# ============================================================================
# CONFIGURATION
# ============================================================================

BASE_DIR = Path(__file__).parent
DATASET_PATH = BASE_DIR / "recipe_search_dataset.csv"
MODEL_PATH = BASE_DIR / "recipe_search_model.pkl"

# Cuisines and categories for dataset generation
CUISINES = ["Italian", "Mexican", "Asian", "Indian", "Thai", "Chinese", "Japanese", 
            "Vietnamese", "Lebanese", "Turkish", "Greek", "Spanish", "Portuguese", 
            "French", "German", "American", "Caribbean", "Brazilian"]
CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Dessert", "Appetizer", "Snack", "Beverage", "Salad", "Soup", "Pasta"]
DIETARY = ["Vegetarian", "Vegan", "Gluten-Free", "Keto", "Low-Carb", "High-Protein", "Dairy-Free", "Nut-Free"]

INGREDIENTS_POOL = {
    "Protein": ["chicken", "beef", "pork", "fish", "shrimp", "tofu", "turkey", "lamb", "salmon", "tuna"],
    "Vegetables": ["broccoli", "spinach", "tomato", "bell pepper", "carrot", "onion", "garlic", "zucchini", "mushroom"],
    "Spices": ["cumin", "cinnamon", "turmeric", "paprika", "oregano", "basil", "thyme", "ginger"]
}

RECIPE_PATTERNS = [
    "{cuisine} {category}",
    "{protein} with {vegetable}",
    "{cuisine} {protein}",
    "Quick {category} {cuisine} {dish}",
    "Easy {protein} {dish}",
    "{vegetable} {category}",
    "{cuisine} {dish} {style}",
    "{style} {protein} {category}",
]

DISHES = ["curry", "stew", "stir-fry", "gratin", "risotto", "tacos", "kebab", "burger", 
          "salad", "soup", "pie", "cake", "cookies", "bread", "sandwich", "wrap", "bowl"]
STYLES = ["Authentic", "Quick", "Easy", "Traditional", "Modern", "Healthy", "Classic", "Fusion"]

# ============================================================================
# DATASET GENERATION
# ============================================================================

def generate_recipe_name() -> str:
    """Generate realistic recipe name"""
    pattern = random.choice(RECIPE_PATTERNS)
    
    cuisine = random.choice(CUISINES)
    category = random.choice(CATEGORIES)
    protein = random.choice(INGREDIENTS_POOL["Protein"])
    vegetable = random.choice(INGREDIENTS_POOL["Vegetables"])
    dish = random.choice(DISHES)
    style = random.choice(STYLES)
    
    name = pattern.format(
        cuisine=cuisine, category=category, protein=protein,
        vegetable=vegetable, dish=dish, style=style
    )
    
    return " ".join(word.capitalize() for word in name.split())


def calculate_popularity_score(recipe_name: str) -> int:
    """Calculate popularity based on trending keywords"""
    score = np.random.normal(500, 150)
    
    trending_keywords = ["pasta", "chicken", "easy", "healthy", "quick", "thai", "asian", "bread", "soup"]
    recipe_lower = recipe_name.lower()
    
    for keyword in trending_keywords:
        if keyword in recipe_lower:
            score += 100
    
    return int(max(10, min(1000, score)))


def generate_dataset(num_recipes: int = 800) -> pd.DataFrame:
    """Generate complete recipe dataset"""
    print(f"Generating {num_recipes} unique recipes...")
    
    random.seed(42)
    np.random.seed(42)
    
    recipes = []
    seen_names = set()
    attempts = 0
    max_attempts = num_recipes * 3
    
    while len(recipes) < num_recipes and attempts < max_attempts:
        attempts += 1
        name = generate_recipe_name()
        
        if name in seen_names:
            continue
        seen_names.add(name)
        
        cuisine = random.choice(CUISINES)
        category = random.choice(CATEGORIES)
        dietary = random.choice([None, None, random.choice(DIETARY)])
        
        ingredients = []
        ingredients.extend(random.sample(INGREDIENTS_POOL["Vegetables"], random.randint(2, 3)))
        ingredients.extend(random.sample(INGREDIENTS_POOL["Protein"], random.randint(1, 2)))
        ingredients.extend(random.sample(INGREDIENTS_POOL["Spices"], random.randint(1, 2)))
        
        popularity = calculate_popularity_score(name)
        is_trending = np.random.random() < 0.3
        trending_score = popularity * (1 + np.random.uniform(0, 0.5)) if is_trending else popularity
        
        days_ago = int(np.random.exponential(scale=30))
        last_searched = (datetime.now() - timedelta(days=days_ago)).isoformat()
        
        recipes.append({
            "recipe_id": len(recipes) + 1,
            "recipe_name": name,
            "cuisine": cuisine,
            "category": category,
            "dietary_type": dietary if dietary else "Regular",
            "ingredients": ", ".join(ingredients),
            "popularity_score": popularity,
            "trending_score": int(trending_score),
            "is_trending": is_trending,
            "last_searched": last_searched,
            "rating": round(np.random.uniform(3.5, 5.0), 1),
            "prep_time_minutes": random.choice([10, 15, 20, 25, 30, 45, 60, 90]),
            "difficulty": random.choice(["Easy", "Medium", "Hard"]),
        })
    
    df = pd.DataFrame(recipes)
    df.to_csv(DATASET_PATH, index=False)
 
    return df


# ============================================================================
# MODEL TRAINING
# ============================================================================

class RecipeSearchModel:
    """AI-powered recipe search suggestion model"""
    
    def __init__(self, model_path: Path = MODEL_PATH):
        self.model_path = model_path
        self.vectorizer = None
        self.recipe_vectors = None
        self.recipe_df = None
        self.is_trained = False
    
    def train(self, dataset_path: Path = DATASET_PATH) -> None:
        """Train the search suggestion model"""
        print(" Loading dataset...")
        self.recipe_df = pd.read_csv(dataset_path)
        self.recipe_df.columns = self.recipe_df.columns.str.strip().str.lower()
        print(f" Loaded {len(self.recipe_df)} recipes")
        
        # Create searchable text
        print(" Creating search index...")
        self.recipe_df["searchable_text"] = (
            self.recipe_df["recipe_name"].str.lower() + " " +
            self.recipe_df["cuisine"].str.lower() + " " +
            self.recipe_df["category"].str.lower() +
            " " + self.recipe_df["dietary_type"].fillna("").str.lower()
        )
        
        # Train vectorizer
        print(" Training TF-IDF vectorizer...")
        self.vectorizer = TfidfVectorizer(
            analyzer="char",
            ngram_range=(2, 3),
            max_features=5000,
            lowercase=True
        )
        self.recipe_vectors = self.vectorizer.fit_transform(self.recipe_df["searchable_text"])
        
        # Save model
        print(" Saving model...")
        joblib.dump({
            "vectorizer": self.vectorizer,
            "recipe_vectors": self.recipe_vectors,
            "recipe_df": self.recipe_df.reset_index(drop=True)
        }, self.model_path)
        
        self.is_trained = True
        print(f"Model trained: {self.model_path}\n")
    
    def load_model(self) -> None:
        """Load pre-trained model"""
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model not found: {self.model_path}")
        
        print(" Loading model...")
        bundle = joblib.load(self.model_path)
        self.vectorizer = bundle["vectorizer"]
        self.recipe_vectors = bundle["recipe_vectors"]
        self.recipe_df = bundle["recipe_df"]
        self.is_trained = True
        print("Model loaded\n")
    
    def suggest(self, query: str, num_suggestions: int = 8, min_similarity: float = 0.2) -> List[Dict]:
        """Get search suggestions"""
        if not self.is_trained:
            self.load_model()
        
        query_lower = query.lower().strip()
        
        # Return trending if empty query
        if not query_lower:
            trending = self.recipe_df[self.recipe_df["is_trending"] == True].nlargest(
                num_suggestions, "trending_score"
            )
            return self._format_suggestions(trending.index.tolist())
        
        # Exact prefix matches (highest priority)
        exact_matches = self.recipe_df[
            self.recipe_df["recipe_name"].str.lower().str.startswith(query_lower)
        ].nlargest(min(num_suggestions, 3), "popularity_score")
        
        if len(exact_matches) > 0:
            matched_indices = exact_matches.index.tolist()
            if len(matched_indices) >= num_suggestions:
                return self._format_suggestions(matched_indices[:num_suggestions])
        
        # TF-IDF similarity matching
        query_vector = self.vectorizer.transform([query_lower])
        similarities = cosine_similarity(query_vector, self.recipe_vectors)[0]
        similar_indices = np.where(similarities >= min_similarity)[0]
        
        if len(similar_indices) == 0:
            trending = self.recipe_df.nlargest(num_suggestions, "trending_score")
            return self._format_suggestions(trending.index.tolist())
        
        # Score by similarity + popularity + trending
        scored_matches = []
        for idx in similar_indices:
            similarity = similarities[idx]
            popularity = self.recipe_df.iloc[idx]["popularity_score"] / 1000.0
            trending_boost = 1.3 if self.recipe_df.iloc[idx]["is_trending"] else 1.0
            
            composite_score = (similarity * 0.6 + popularity * 0.4) * trending_boost
            scored_matches.append((idx, composite_score))
        
        scored_matches.sort(key=lambda x: x[1], reverse=True)
        top_indices = [idx for idx, _ in scored_matches[:num_suggestions]]
        
        return self._format_suggestions(top_indices)
    
    def _format_suggestions(self, indices: List[int]) -> List[Dict]:
        """Format suggestion data"""
        suggestions = []
        for rank, idx in enumerate(indices, 1):
            row = self.recipe_df.iloc[idx]
            suggestions.append({
                "rank": rank,
                "recipe_id": int(row["recipe_id"]),
                "recipe_name": row["recipe_name"],
                "cuisine": row["cuisine"],
                "category": row["category"],
                "dietary_type": row["dietary_type"],
                "popularity_score": int(row["popularity_score"]),
                "is_trending": bool(row["is_trending"]),
                "rating": float(row["rating"]),
                "prep_time": int(row["prep_time_minutes"]),
                "difficulty": row["difficulty"],
            })
        return suggestions
    
    def get_trending(self, num_recipes: int = 10) -> List[Dict]:
        """Get trending recipes"""
        if not self.is_trained:
            self.load_model()
        
        trending = self.recipe_df[self.recipe_df["is_trending"] == True].nlargest(
            num_recipes, "trending_score"
        )
        return self._format_suggestions(trending.index.tolist())


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """Command line interface"""
    if len(sys.argv) < 2:
        print("🍳 Recipe Search AI Engine\n")
        print("Usage:")
        print("  python recipe_search_main.py generate [count]      # Generate recipes (default: 800)")
        print("  python recipe_search_main.py train                # Train model")
        print("  python recipe_search_main.py suggest <query>      # Test suggestions")
        print("  python recipe_search_main.py trending             # Get trending recipes")
        print("  python recipe_search_main.py full-run             # Generate + Train")
        return
    
    command = sys.argv[1].lower()
    
    if command == "generate":
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 800
        generate_dataset(count)
    
    elif command == "train":
        model = RecipeSearchModel()
        model.train()
    
    elif command == "suggest":
        query = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "pasta"
        model = RecipeSearchModel()
        suggestions = model.suggest(query, num_suggestions=10)
        print(json.dumps(suggestions, indent=2))
    
    elif command == "trending":
        model = RecipeSearchModel()
        trending = model.get_trending(10)
        print(json.dumps(trending, indent=2))
    
    elif command == "full-run":
        print(" Running full pipeline...\n")
        generate_dataset(800)
        model = RecipeSearchModel()
        model.train()
        print("Setup complete!\n")
        
        # Test it
        print(" Testing suggestions...")
        suggestions = model.suggest("pasta", num_suggestions=5)
        print(json.dumps(suggestions[:3], indent=2))
    
    else:
        print(f" Unknown command: {command}")


if __name__ == "__main__":
    main()