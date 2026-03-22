import sys
import json
import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'recipe_search_dataset.csv')
MODEL_PATH = os.path.join(BASE_DIR, 'recipe_search_model.pkl')

def train_and_save():
    df = pd.read_csv(DATA_PATH)
    df['recipe_name'] = df['recipe_name'].fillna('')
    df['combined_features'] = df['recipe_name'].str.lower()
    
    # Using character N-grams to handle partial queries like "chic" for "chicken"
    vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 5))
    tfidf_matrix = vectorizer.fit_transform(df['combined_features'])
    
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump({'vectorizer': vectorizer, 'tfidf_matrix': tfidf_matrix, 'df': df}, f)
        
    return vectorizer, tfidf_matrix, df

def load_data():
    if not os.path.exists(MODEL_PATH):
        return train_and_save()
    else:
        with open(MODEL_PATH, 'rb') as f:
            data = pickle.load(f)
        return data['vectorizer'], data['tfidf_matrix'], data['df']

def search(query):
    vectorizer, tfidf_matrix, df = load_data()
    
    if not query.strip():
        # Trending recipes based on view_count
        if 'view_count' in df.columns:
            trending = df.sort_values(by='view_count', ascending=False)
        else:
            trending = df.head(50)
            
        results = []
        seen = set()
        for _, row in trending.iterrows():
            name = row.get('recipe_name', '')
            if name.lower() not in seen:
                seen.add(name.lower())
                raw_id = row.get('id', 0)
                safe_id = int(raw_id) if pd.notna(raw_id) else 0
                results.append({'id': safe_id, 'name': name})
                if len(results) >= 8:
                    break
        return results

    # Search with AI
    query_vec = vectorizer.transform([query.lower()])
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    
    top_indices = similarities.argsort()[::-1]
    
    results = []
    seen = set()
    for idx in top_indices:
        if similarities[idx] > 0:
            name = df.iloc[idx]['recipe_name']
            if name.lower() not in seen:
                seen.add(name.lower())
                raw_id = df.iloc[idx].get('id', 0)
                safe_id = int(raw_id) if pd.notna(raw_id) else 0
                results.append({'id': safe_id, 'name': name})
                if len(results) >= 8:
                    break
    
    return results

if __name__ == '__main__':
    # Initial train to speed up first query if needed
    if len(sys.argv) > 1 and sys.argv[1] == '--train':
        train_and_save()
        print(json.dumps({"status": "Model trained"}))
        sys.exit(0)
        
    query = sys.argv[1] if len(sys.argv) > 1 else ''
    try:
        res = search(query)
        print(json.dumps(res))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
