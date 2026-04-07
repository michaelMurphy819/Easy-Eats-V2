// src/components/ui/LoadingShimmer.tsx
import { cn } from "@/lib/utils/utils"; // Assuming you have a cn utility, otherwise use template literals

interface ShimmerProps {
  className?: string;
}

export default function LoadingShimmer({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
    />
  );
}