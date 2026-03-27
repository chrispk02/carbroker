"use client";

import { Calendar, Gauge, Fuel, Settings2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

interface CarSpecsProps {
  year: number;
  mileage: string;
  fuel: string;
  transmission: string;
}

export function CarSpecs({ year, mileage, fuel, transmission }: CarSpecsProps) {
  const { dictionary: t } = useLocale();

  const specs = [
    { icon: Calendar, label: t.carSpecs.year, value: year.toString() },
    { icon: Gauge, label: t.carSpecs.mileage, value: mileage },
    { icon: Fuel, label: t.carSpecs.fuel, value: fuel },
    { icon: Settings2, label: t.carSpecs.transmission, value: transmission },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {specs.map((spec) => (
        <div
          key={spec.label}
          className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-card">
            <spec.icon className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{spec.label}</p>
            <p className="font-medium text-foreground">{spec.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
