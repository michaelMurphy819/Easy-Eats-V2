'use client';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // Recommended: npm install uuid

interface Ingredient {
  id: string; // Better than using index for React keys
  item: string;
  amount: string;
}

interface IngredientBuilderProps {
  ingredients: Ingredient[];
  setIngredients: (ingredients: Ingredient[]) => void;
}

export function IngredientBuilder({ ingredients, setIngredients }: IngredientBuilderProps) {
  
  const addIngredient = () => {
    setIngredients([...ingredients, { id: uuidv4(), item: '', amount: '' }]);
  };

  const updateIngredient = (index: number, field: keyof Omit<Ingredient, 'id'>, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40">
        Ingredients
      </h3>
      
      <div className="space-y-2">
        {ingredients.map((ing, i) => (
          <div key={ing.id} className="flex gap-2 group animate-in fade-in slide-in-from-top-1 duration-200">
            <input 
              placeholder="Qty (e.g. 2 cups)" 
              className="w-1/3 bg-foreground/[0.03] rounded-xl p-3 text-foreground border border-border outline-none focus:border-primary/50 transition-colors placeholder:text-foreground/20 text-sm"
              value={ing.amount}
              onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
            />
            <input 
              placeholder="Ingredient" 
              className="flex-1 bg-foreground/[0.03] rounded-xl p-3 text-foreground border border-border outline-none focus:border-primary/50 transition-colors placeholder:text-foreground/20 text-sm"
              value={ing.item}
              onChange={(e) => updateIngredient(i, 'item', e.target.value)}
            />
            <button 
              type="button" 
              className="px-2 hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              onClick={() => removeIngredient(ing.id)}
              aria-label="Remove ingredient"
            >
              <Trash2 size={18} className="text-foreground/20 hover:text-red-500 transition-colors" />
            </button>
          </div>
        ))}
      </div>

      <button 
        type="button" 
        onClick={addIngredient} 
        className="flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-widest hover:opacity-70 transition-opacity pt-2"
      >
        <Plus size={14} strokeWidth={3} />
        Add Ingredient
      </button>
    </div>
  );
}