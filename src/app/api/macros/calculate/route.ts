import { NextResponse } from 'next/server';

const USDA_API_KEY = process.env.USDA_API_KEY;
const USDA_SEARCH = 'https://api.nal.usda.gov/fdc/v1/foods/search';

// ─── Density Mapping (Grams per 1 unit) ────────────────────────────────────
// This replaces the DENSITY_MAP from the Python script
const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1, gram: 1, grams: 1,
  kg: 1000, kilogram: 1000,
  oz: 28.35, ounce: 28.35,
  lb: 453.6, pound: 453.6,
  ml: 1, cup: 240, tbsp: 15, teaspoon: 5,
  unit: 100, serving: 100, piece: 100, whole: 150,
  clove: 5, slice: 30, handful: 30, pinch: 1,
};

// Map specific foods to weights if "unit" is used (e.g., 1 egg)
const FOOD_SPECIFIC_WEIGHTS: Record<string, number> = {
  egg: 50,
  eggs: 50,
  onion: 150,
  pork: 150,
  chicken: 172,
  garlic: 5,
};

interface Macros {
  calories: number; protein: number; fat: number; carbs: number;
}

async function getMacrosForIngredient(ing: { name: string, amount: string, unit: string }): Promise<Macros> {
  const zero = { calories: 0, protein: 0, fat: 0, carbs: 0 };
  if (!USDA_API_KEY) return zero;

  try {
    const url = new URL(USDA_SEARCH);
    url.searchParams.set('query', ing.name);
    url.searchParams.set('api_key', USDA_API_KEY);
    url.searchParams.set('pageSize', '1');
    // We use all data types to ensure we find "Big Onion" and "Pork"
    url.searchParams.set('dataType', 'Foundation,SR Legacy,Branded,Survey (FNDDS)');

    const res = await fetch(url.toString(), { 
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        next: { revalidate: 86400 } 
        });
    const data = await res.json();
    const food = data.foods?.[0];
    if (!food) return zero;

    const per100g = { calories: 0, protein: 0, fat: 0, carbs: 0 };
    food.foodNutrients.forEach((n: any) => {
      const name = n.nutrientName.toLowerCase();
      if (name.includes('energy') && n.unitName === 'KCAL') per100g.calories = n.value;
      if (name.includes('protein')) per100g.protein = n.value;
      if (name.includes('fat') || name.includes('total lipid')) per100g.fat = n.value;
      if (name.includes('carbohydrate')) per100g.carbs = n.value;
    });

    // Calculate Mass
    const qty = parseFloat(ing.amount) || 1;
    const unitKey = (ing.unit || 'unit').toLowerCase().trim();
    
    // Check food-specific weight first, then general density map
    const weightPerUnit = FOOD_SPECIFIC_WEIGHTS[ing.name.toLowerCase()] || UNIT_TO_GRAMS[unitKey] || 100;
    const totalGrams = qty * weightPerUnit;
    const factor = totalGrams / 100;

    return {
      calories: Math.round(per100g.calories * factor),
      protein: Math.round(per100g.protein * factor * 10) / 10,
      fat: Math.round(per100g.fat * factor * 10) / 10,
      carbs: Math.round(per100g.carbs * factor * 10) / 10,
    };
  } catch (err) {
    return zero;
  }
}

export async function POST(req: Request) {
  try {
    const { ingredients } = await req.json();
    const results = await Promise.all(ingredients.map(getMacrosForIngredient));

    const totals = results.reduce((acc, r) => ({
      calories: acc.calories + r.calories,
      protein: Math.round((acc.protein + r.protein) * 10) / 10,
      fat: Math.round((acc.fat + r.fat) * 10) / 10,
      carbs: Math.round((acc.carbs + r.carbs) * 10) / 10,
    }), { calories: 0, protein: 0, fat: 0, carbs: 0 });

    return NextResponse.json(totals);
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}