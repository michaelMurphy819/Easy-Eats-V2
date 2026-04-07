'use client';
import { Plus, Trash2 } from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';

interface StepBuilderProps {
  steps: string[];
  setSteps: (steps: string[]) => void;
}

export function StepBuilder({ steps, setSteps }: StepBuilderProps) {
  
  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
    
    // Auto-resize textarea logic (Optional but great for UX)
    const target = event?.target as HTMLTextAreaElement;
    if (target) {
      target.style.height = 'inherit';
      target.style.height = `${target.scrollHeight}px`;
    }
  };

  const addStep = () => setSteps([...steps, '']);
  
  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    } else {
      // If it's the last one, just clear it instead of deleting the row
      setSteps(['']);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/40">
          Instructions
        </h3>
        <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">
          {steps.length} {steps.length === 1 ? 'Step' : 'Steps'}
        </span>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {steps.map((step, index) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={`step-${index}`} // While UUID is better, stable strings are safer than raw numbers
              className="flex gap-4 items-start group"
            >
              {/* Step Number */}
              <div className="flex flex-col items-center pt-4">
                <span className="text-primary font-mono text-xs font-black opacity-40 group-hover:opacity-100 transition-opacity">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <div className="w-px h-full bg-border/50 mt-2 flex-1" />
              </div>

              <div className="flex-1 relative">
                <textarea
                  value={step}
                  onChange={(e) => updateStep(index, e.target.value)}
                  placeholder="Describe this step (e.g., Preheat oven to 350°F...)"
                  className="
                    w-full bg-foreground/[0.02] rounded-2xl p-5 
                    text-foreground border border-border/60 
                    focus:border-primary focus:bg-background focus:shadow-sm
                    outline-none min-h-[100px] transition-all 
                    placeholder:text-foreground/10 text-sm leading-relaxed
                    resize-none
                  "
                />
              </div>

              <button 
                type="button"
                onClick={() => removeStep(index)}
                className="mt-3 p-2 text-foreground/10 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Remove step"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={addStep}
        className="
          w-full py-5 border-2 border-dashed border-border/60
          rounded-3xl text-foreground/40 font-black uppercase text-[10px] tracking-[0.2em]
          hover:text-primary hover:border-primary/40 hover:bg-primary/[0.02] 
          active:scale-[0.99] transition-all flex items-center justify-center gap-2
        "
      >
        <Plus size={14} strokeWidth={4} /> 
        Add Another Step
      </button>
    </div>
  );
}