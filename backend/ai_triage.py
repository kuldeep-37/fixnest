import math
from transformers import pipeline
from PIL import Image
import io
import base64

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
