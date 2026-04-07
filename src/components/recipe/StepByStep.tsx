// src/components/recipe/StepByStep.tsx
import React from 'react';

interface StepByStepProps {
  steps: string[];
}

export const StepByStep = ({ steps }: StepByStepProps) => {
  return (
    <div className="space-y-6">
      {/* Header - Hardcoding #1A1A1A (foreground) to ensure visibility */}
      <h2 className="text-[10px] font-black text-[#1A1A1A]/40 uppercase tracking-[1.5px] mb-6">
        Instructions
      </h2>
      
      <div className="space-y-8">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-5 items-start group">
            {/* Step Number Badge */}
            <div className="
              w-8 h-8 rounded-full bg-[#3cadd2] text-white 
              text-[13px] font-black flex items-center justify-center 
              flex-shrink-0 shadow-lg shadow-[#3cadd2]/20 transition-transform 
              group-hover:scale-110
            ">
              {index + 1}
            </div>

            {/* Step Text - Fixed text color to force dark gray/black */}
            <div className="space-y-1 pt-1 flex-1">
              <p className="text-[15px] text-[#1A1A1A] leading-relaxed font-medium">
                {step}
              </p>
              
              {/* Divider - using a visible gray */}
              {index !== steps.length - 1 && (
                <div className="h-px w-full bg-black/5 mt-6" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};