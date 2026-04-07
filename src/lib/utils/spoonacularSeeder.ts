// src/lib/utils/spoonacularSeeder.ts
import { createClient } from '../db/queries/client';

const supabase = createClient();

// Replace this with the actual UUID from your 'profiles' table
const OFFICIAL_AUTHOR_ID = process.env.NEXT_PUBLIC_OFFICIAL_AUTHOR_ID;
const SPOONACULAR_API_KEY = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY;

export async function seedSpoonacularRecipes() {
  try {
    if (!SPOONACULAR_API_KEY) throw new Error("API Key missing");

    const response = await fetch(
      `https://api.spoonacular.com/recipes/random?number=5&tags=main course&apiKey=${SPOONACULAR_API_KEY}`
    );
    const data = await response.json();

    if (!data.recipes) {
      console.error("Spoonacular Error:", data.message);
      return { success: false };
    }

    for (const recipe of data.recipes) {
      // 1. Insert Recipe (matching your specific schema columns)
      const { data: newRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          author_id: OFFICIAL_AUTHOR_ID,
          title: recipe.title,
          emoji: '🍳',
          time_estimate: recipe.readyInMinutes,
          cost_estimate: `$${(recipe.pricePerServing / 100).toFixed(2)}`,
          difficulty: recipe.readyInMinutes < 30 ? 'Beginner' : 'Intermediate',
          is_official: true,
          steps: recipe.analyzedInstructions[0]?.steps.map((s: any) => s.step) || [],
          image_url: recipe.image,
          author_name: 'Easy Eats Recipes', // Matches your 'author_name' column
          skill_level: recipe.readyInMinutes < 30 ? 'Beginner' : 'Intermediate'
        })
        .select()
        .single();

      if (recipeError) {
        console.error("Recipe Insert Error:", recipeError.message);
        continue;
      }

      // 2. Insert Ingredients
      if (recipe.extendedIngredients) {
        const ingredientRows = recipe.extendedIngredients.map((ing: any) => ({
          recipe_id: newRecipe.id,
          name: ing.name,
          unit: ing.unit || 'unit',
          // YOUR SCHEMA FIX: 
          // You have both columns, but 'amount' is currently the one failing.
          // We'll set both to the same numeric value to be safe.
          amount: ing.amount.toString(), // Convert to string if your 'amount' column is text
          quantity: ing.amount,          // For your numeric 'quantity' column
        }));

        const { error: ingError } = await supabase
          .from('ingredients')
          .insert(ingredientRows);
          

        if (ingError) console.error("Ingredient Insert Error:", ingError.message);
      }
    }

    console.log("✅ Seeding complete!");
    return { success: true };
  } catch (error) {
    console.error("Seeder crashed:", error);
    return { success: false };
  }
}