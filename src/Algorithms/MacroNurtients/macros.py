import sys
import json
import requests
import os

# Get your key from .env (the bridge will pass this or you can use os.getenv)
USDA_API_KEY = "YOUR_FULL_KEY_HERE" 
USDA_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"

# 1. Density Mapping (Grams per 1 unit)
# We use this to convert volume (cups/tbsp) to mass (grams)
DENSITY_MAP = {
    "default": {"cup": 236, "tbsp": 15, "tsp": 5, "oz": 28.35, "lb": 453.6, "unit": 100},
    "flour": {"cup": 120},
    "sugar": {"cup": 200},
    "butter": {"cup": 227, "tbsp": 14.2},
    "kale": {"cup": 67, "unit": 40},
    "chicken": {"unit": 172}, # Avg breast weight
    "olive oil": {"tbsp": 13.5, "cup": 216}
}

def get_grams(food_name, qty, unit):
    food_key = food_name.lower()
    unit_key = unit.lower() if unit else "unit"
    
    # Check if we have a specific density for this food, else use water-weight defaults
    mapping = DENSITY_MAP.get(food_key, DENSITY_MAP["default"])
    grams_per_unit = mapping.get(unit_key, DENSITY_MAP["default"].get(unit_key, 1))
    
    return float(qty) * grams_per_unit

def fetch_usda_data(query, grams):
    if grams <= 0: return None
    
    params = {
        "api_key": USDA_API_KEY,
        "query": query,
        "pageSize": 1,
        "dataType": ["Survey (FNDDS)"] # Best for cooked ingredients
    }
    
    try:
        response = requests.get(USDA_URL, params=params, timeout=5)
        data = response.json()
        
        if not data.get('foods'): return None
        
        # USDA returns nutrients per 100g
        food = data['foods'][0]
        nutrients = food.get('foodNutrients', [])
        scale = grams / 100.0
        
        result = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
        for n in nutrients:
            name = n['nutrientName'].lower()
            val = n['value'] * scale
            if 'energy' in name and n['unitName'] == 'KCAL': result['calories'] += val
            elif 'protein' in name: result['protein'] += val
            elif 'carbohydrate' in name: result['carbs'] += val
            elif 'total lipid' in name: result['fat'] += val
        return result
    except:
        return None

def main():
    # Read ingredients from Node.js stdin
    try:
        input_data = json.load(sys.stdin)
        total_macros = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
        
        for ing in input_data:
            name = ing.get('name', '')
            qty = ing.get('quantity') or 0
            unit = ing.get('unit', 'unit')
            
            grams = get_grams(name, qty, unit)
            macros = fetch_usda_data(name, grams)
            
            if macros:
                for key in total_macros:
                    total_macros[key] += macros[key]
        
        # Return rounded results
        print(json.dumps({k: round(v, 2) for k, v in total_macros.items()}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()