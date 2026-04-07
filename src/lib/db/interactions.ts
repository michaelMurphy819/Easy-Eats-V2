// src/lib/db/queries/client.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 1. The "Recipe" to make a client
export const createClient = () => 
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// 2. THE FIX: Actually create the active instance!
const supabase = createClient();

// 3. Now this function can see 'supabase'
export async function toggleLike(recipeId: string, userId: string, isCurrentlyLiked: boolean) {
  if (isCurrentlyLiked) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .match({ user_id: userId, recipe_id: recipeId });
    return { success: !error };
  } else {
    const { error } = await supabase
      .from('likes')
      .insert({ user_id: userId, recipe_id: recipeId });
    return { success: !error };
  }
}