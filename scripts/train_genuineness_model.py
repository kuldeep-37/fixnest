import os
import sys
import pandas as pd
import requests
import kagglehub
import json
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "backend", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def main():
    print("--- 1. Fetching Datasets ---")
    
    # 1. NYC 311 Data (Genuine = 1)
    print("Fetching NYC 311 dataset from API...")
    url = "https://data.cityofnewyork.us/resource/erm2-nwe9.json?$limit=20000"
    # Using resource endpoint instead of query.json for simpler parsing
    response = requests.get(url)
    nyc_data = response.json()
    
    nyc_texts = []
    taxonomy = {}
    for row in nyc_data:
        complaint_type = row.get("complaint_type", "")
        descriptor = row.get("descriptor", "")
        
        text = f"{complaint_type} {descriptor}".strip()
        if text:
            nyc_texts.append(text)
            
        # Build taxonomy
        if complaint_type and descriptor:
            if complaint_type not in taxonomy:
                taxonomy[complaint_type] = set()
            
            # Simple keyword extraction (split by space/comma)
            keywords = [k.strip().lower() for k in descriptor.replace(',', ' ').split() if len(k.strip()) > 2]
            taxonomy[complaint_type].update(keywords)
            
    df_genuine = pd.DataFrame({'text': nyc_texts, 'label': 1})
    print(f"Loaded {len(df_genuine)} genuine NYC 311 records.")
    
    # Save taxonomy
    clean_taxonomy = {k: list(v) for k, v in taxonomy.items()}
    with open(os.path.join(MODELS_DIR, "keyword_taxonomy.json"), "w") as f:
        json.dump(clean_taxonomy, f, indent=2)
    print("Saved keyword taxonomy.")

    # 2. SMS Spam (Non-Genuine = 0)
    print("Fetching SMS Spam dataset...")
    spam_path = kagglehub.dataset_download("uciml/sms-spam-collection-dataset")
    # File is typically 'spam.csv' inside
    spam_file = os.path.join(spam_path, "spam.csv")
    df_spam_raw = pd.read_csv(spam_file, encoding='latin-1')
    # Use only the spam ones to balance
    df_spam = df_spam_raw[df_spam_raw['v1'] == 'spam'][['v2']].rename(columns={'v2': 'text'})
    df_spam['label'] = 0
    print(f"Loaded {len(df_spam)} SMS spam records.")

    # 3. Fake Job Postings (Non-Genuine = 0)
    print("Fetching Fake Job Postings dataset...")
    fake_jobs_path = kagglehub.dataset_download("srisaisuhassanisetty/fake-job-postings")
    fake_jobs_file = os.path.join(fake_jobs_path, "Fake Postings.csv")
    df_jobs_raw = pd.read_csv(fake_jobs_file)
    # Use only fake jobs (fraudulent = 1)
    df_fake = df_jobs_raw[df_jobs_raw['fraudulent'] == 1][['description']].dropna().rename(columns={'description': 'text'})
    df_fake['label'] = 0
    print(f"Loaded {len(df_fake)} fake job records.")

    # Combine datasets
    df = pd.concat([df_genuine, df_spam, df_fake], ignore_index=True)
    
    # We will no longer aggressively downsample because RandomForest with class_weight='balanced'
    # handles class imbalances naturally and benefits from seeing all the genuine data!

    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    print(f"Total training dataset size: {len(df)}")
    
    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(df['text'], df['label'], test_size=0.2, random_state=42)

    print("--- 2. Training Classifier ---")
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=5000, stop_words='english', ngram_range=(1, 2))),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced', n_jobs=-1))
    ])
    
    pipeline.fit(X_train, y_train)
    
    # Evaluation
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {acc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Non-Genuine", "Genuine"]))
    
    # Save Model
    model_path = os.path.join(MODELS_DIR, "genuineness_model.joblib")
    joblib.dump(pipeline, model_path)
    print(f"--- 3. Model saved to {model_path} ---")
    
    print("\nSummary:")
    print("- Trained a RandomForest classifier on TF-IDF features (N-Grams 1-2).")
    print("- Positive (1) class: NYC 311 Requests.")
    print("- Negative (0) class: SMS Spam and Fake Job Postings.")
    print("- Output probabilities will be used as the 'Genuineness %'.")
    print("- Built keyword taxonomy from NYC 311 complaint types and descriptors.")

if __name__ == "__main__":
    main()
