// src/hooks/useScaleRecipe.ts
import { useState } from 'react';

export const useScaleRecipe = (baseServings: number) => {
  const [scale, setScale] = useState(baseServings);

  const adjustScale = (amount: number) => {
    setScale((prev) => Math.max(1, prev + amount));
  };

  const getScaledQuantity = (baseQty: number) => {
    return (baseQty / baseServings) * scale;
  };

  return { scale, adjustScale, getScaledQuantity };
};