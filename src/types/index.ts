// src/types/index.ts
export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  author_id: string;
  emoji: string;
  image_url?: string; // Add this line (the '?' means it's optional)
  time_estimate: number;
  cost_estimate: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  is_official: boolean;
  ingredients: Ingredient[];
  steps: string[];
  base_servings: number;
  nutrition?: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  likes?: number; // Add this line for like count
}