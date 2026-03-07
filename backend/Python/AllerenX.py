# allergen_detector.py

import re
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.model_selection import train_test_split

ALLERGEN_MAP = {
    "milk":      ["milk","whole milk","skim milk","milk powder","dairy","lactose","casein","whey","cheddar","mozzarella","butter","cream","cheese","yogurt"],
    "egg":       ["egg","eggs","egg white","egg yolk","albumin","mayonnaise","meringue"],
    "wheat":     ["wheat","wheat flour","whole wheat","flour","semolina","barley","rye","gluten","bread"],
    "soy":       ["soy","soybean","soy lecithin","soy sauce","tofu","edamame","miso","tempeh"],
    "peanut":    ["peanut","peanuts","peanut butter","peanut oil","groundnut"],
    "tree_nut":  ["almond","almonds","cashew","walnut","pecan","pistachio","hazelnut","macadamia","brazil nut"],
    "shellfish": ["shrimp","prawn","crab","crabs","lobster","crayfish","oyster","scallop","clam","mussel"],
    "fish":      ["salmon","tuna","cod","tilapia","anchovy","sardine","trout","halibut"],
    "sesame":    ["sesame","tahini","sesame oil","sesame seed"],
}

SYNONYM_MAP = {phrase: allergen for allergen, terms in ALLERGEN_MAP.items() for phrase in terms}


def preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    for phrase, allergen in sorted(SYNONYM_MAP.items(), key=lambda x: -len(x[0])):
        text = text.replace(phrase, allergen)
    return text.strip()


def load_data(csv_path: str):
    df = pd.read_csv(csv_path)
    # Standardize column names
    df.columns = df.columns.str.strip().str.lower()
    
    # Check for correct column names
    if "ingredient" in df.columns:
        df = df.rename(columns={"ingredient": "ingredients"})
    
    df["processed"] = df["ingredients"].fillna("").apply(preprocess)
    
    # If the CSV has a single 'allergen' column, pivot it or handle label extraction
    if "allergen" in df.columns:
        # Normalize allergen names to match ALLERGEN_MAP keys
        def normalize_allergen(a):
            if not isinstance(a, str): return []
            a = a.lower().strip()
            if a == "peanuts": a = "peanut"
            if a == "eggs": a = "egg"
            if a == "tree nuts" or a == "tree nut": a = "tree_nut"
            return [a] if a in ALLERGEN_MAP else []
            
        df["labels"] = df["allergen"].apply(normalize_allergen)
        allergen_cols = list(ALLERGEN_MAP.keys())
    else:
        allergen_cols = [c for c in ALLERGEN_MAP if c in df.columns]
        df["labels"] = df.apply(lambda row: [c for c in allergen_cols if row[c] == 1], axis=1)
        
    return df, allergen_cols


def train(csv_path: str, model_path: str = "allergen_model.pkl"):
    df, allergen_cols = load_data(csv_path)
    mlb = MultiLabelBinarizer(classes=allergen_cols)
    y = mlb.fit_transform(df["labels"])
    vectorizer = TfidfVectorizer(ngram_range=(1, 3), max_features=8000, sublinear_tf=True)
    X = vectorizer.fit_transform(df["processed"])
    X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2, random_state=42)
    model = OneVsRestClassifier(LogisticRegression(max_iter=1000, C=1.5, solver="lbfgs"))
    model.fit(X_train, y_train)
    joblib.dump({"model": model, "vectorizer": vectorizer, "mlb": mlb}, model_path)


def detect(ingredients: str, model_path: str = "allergen_model.pkl") -> list:
    """
    Returns: [{ "allergen": "milk", "detected_ingredients": ["cheese", "butter"] }, ...]
    """
    bundle = joblib.load(model_path)
    model, vectorizer, mlb = bundle["model"], bundle["vectorizer"], bundle["mlb"]

    text = ingredients.lower()
    X = vectorizer.transform([preprocess(ingredients)])
    proba = np.array([e.predict_proba(X)[0][1] for e in model.estimators_])

    results = []
    for i, allergen in enumerate(mlb.classes_):
        found = [term for term in ALLERGEN_MAP.get(allergen, []) if term in text]
        if found or proba[i] >= 0.50:
            results.append({
                "allergen": allergen,
                "detected_ingredients": found
            })

    return results


if __name__ == "__main__":
    import sys, json
    cmd = sys.argv[1]
    if cmd == "train":
        train(sys.argv[2] if len(sys.argv) > 2 else "allergen_ingredients_5000.csv")
    elif cmd == "detect":
        model_path = sys.argv[3] if len(sys.argv) > 3 else "allergen_model.pkl"
        print(json.dumps(detect(sys.argv[2], model_path), indent=2))