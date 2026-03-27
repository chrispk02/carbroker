import { Check } from "lucide-react";

interface CarFeaturesProps {
  features: string[];
}

export function CarFeatures({ features }: CarFeaturesProps) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3">
      {features.map((feature) => (
        <div key={feature} className="flex items-center gap-2">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/10">
            <Check className="size-3 text-accent" />
          </div>
          <span className="text-sm text-foreground">{feature}</span>
        </div>
      ))}
    </div>
  );
}
