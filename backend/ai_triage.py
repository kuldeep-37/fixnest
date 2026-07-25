import math
import os
import json
import joblib
from transformers import pipeline
from PIL import Image
import io
import base64
try:
    from sentence_transformers import SentenceTransformer
    from scipy.spatial.distance import cosine
except ImportError:
    SentenceTransformer = None
    cosine = None

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

try:
    if SentenceTransformer:
        sbert_model = SentenceTransformer("all-MiniLM-L6-v2")
    else:
        sbert_model = None
except Exception:
    sbert_model = None

try:
    genuineness_clf = joblib.load(os.path.join(MODELS_DIR, "genuineness_model.joblib"))
except Exception:
    genuineness_clf = None

try:
    with open(os.path.join(MODELS_DIR, "keyword_taxonomy.json"), "r") as f:
        keyword_taxonomy = json.load(f)
except Exception:
    keyword_taxonomy = {}

def get_embedding(text):
    if sbert_model:
        return sbert_model.encode(text).tolist()
    return []

def calculate_genuineness(text):
    if genuineness_clf:
        probs = genuineness_clf.predict_proba([text])[0]
        return round(float(probs[1]) * 100, 2) # prob of class 1 (Genuine)
    return 100.0

def calculate_category_match(category, text):
    if not keyword_taxonomy:
        return 0.0
    
    # Try to find a matching category in the taxonomy
    # (NYC categories might not exactly match our categories, so fallback to checking all keywords if needed)
    category_lower = category.lower()
    matched_key = None
    for k in keyword_taxonomy.keys():
        if category_lower in k.lower() or k.lower() in category_lower:
            matched_key = k
            break
            
    if not matched_key:
        return 0.0
        
    keywords = keyword_taxonomy[matched_key]
    text_lower = text.lower()
    matches = sum(1 for k in keywords if k in text_lower)
    
    if not keywords:
        return 0.0
    
    # Simple heuristic: 3 matches = 100%
    pct = (matches / 3.0) * 100
    return min(round(pct, 2), 100.0)

def compute_similarity(emb1, emb2):
    if not emb1 or not emb2 or not cosine:
        return 0.0
    try:
        return max(0.0, 100.0 * (1 - cosine(emb1, emb2)))
    except:
        return 0.0

# Haversine distance formula
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371e3 # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return distance

# Initialize a lightweight zero-shot image classification pipeline
# We use a very small model for fast demo purposes
try:
    classifier = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")
except Exception as e:
    print(f"Warning: Failed to load AI model. {e}")
    classifier = None

def classify_image(image_bytes, candidate_labels):
    if not classifier:
        # Fallback for environment where model fails to load
        return {"label": candidate_labels[0], "score": 0.9}
        
    image = Image.open(io.BytesIO(image_bytes))
    results = classifier(image, candidate_labels=candidate_labels)
    # results is a list of dicts: [{'score': 0.99, 'label': 'electrical fault'}, ...]
    best_match = results[0]
    return best_match

def calculate_severity(category, keywords_in_description, confidence):
    # Rule-based severity scoring
    description_lower = keywords_in_description.lower()
    
    critical_keywords = ['fire', 'spark', 'flood', 'burst', 'wire', 'short circuit']
    high_keywords = ['leak', 'broken', 'not working', 'smell', 'block']
    
    severity = "Routine"
    
    for kw in critical_keywords:
        if kw in description_lower:
            return "Critical"
            
    for kw in high_keywords:
        if kw in description_lower:
            severity = "High"
            
    # Category based bump
    if category == "Electrical" and severity == "Routine":
        severity = "High" # Electrical is inherently higher risk
        
    return severity

def verify_image_text_match(image_bytes, text):
    if not classifier or not text:
        return 0.0
    
    # We use zero-shot classification with the text description as the positive label,
    # and some generic negative labels to get a meaningful probability score for the text.
    candidate_labels = [text, "random object", "unrelated scene", "normal room"]
    
    try:
        image = Image.open(io.BytesIO(image_bytes))
        results = classifier(image, candidate_labels=candidate_labels)
        
        # results is a list of dicts, sorted by score descending
        # find the score for the user's text
        for res in results:
            if res['label'] == text:
                return round(res['score'] * 100, 2)
        return 0.0
    except Exception as e:
        print(f"Match error: {e}")
        return 0.0

def determine_classification(genuineness_pct, duplicate_match_pct):
    if duplicate_match_pct > 85.0:
        return "Duplicate", "High similarity with an existing ticket."
    elif genuineness_pct < 50.0:
        return "Invalid", "Issue does not appear to be a genuine maintenance request."
    else:
        return "Genuine", "This issue is unique and contains sufficient information."
