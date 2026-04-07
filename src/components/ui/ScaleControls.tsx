interface ScaleControlsProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  label?: string; // e.g., "Servings" or "Yield"
  step?: number;  // e.g., 0.5 or 1
}

export const ScaleControls = ({ value, onIncrement, onDecrement, label }: ScaleControlsProps) => {
  return (
    <div className="flex items-center space-x-3 border p-1 rounded-md">
      {label && <span className="text-sm font-medium">{label}</span>}
      <button 
        onClick={onIncrement} 
        className="hover:bg-gray-100 p-1 px-2"
        >
        {/* If step is 0.5, you might want to show that, 
            otherwise just show the + icon */}
        +
        </button>
      <span className="min-w-[20px] text-center font-bold">{value}</span>
      <button onClick={onDecrement} className="hover:bg-gray-100 p-1 px-2">-</button>
    </div>
  );
};