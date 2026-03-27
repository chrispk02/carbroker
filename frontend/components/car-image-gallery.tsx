"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";

interface CarImageGalleryProps {
  images: { src: string; alt: string }[];
}

export function CarImageGallery({ images }: CarImageGalleryProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="space-y-4">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 bg-card/90 backdrop-blur-sm border-0 shadow-lg hover:bg-card" />
        <CarouselNext className="right-4 bg-card/90 backdrop-blur-sm border-0 shadow-lg hover:bg-card" />
      </Carousel>

      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "relative size-16 shrink-0 overflow-hidden rounded-lg transition-all",
              current === index
                ? "ring-2 ring-accent ring-offset-2"
                : "opacity-60 hover:opacity-100"
            )}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Image counter */}
      <div className="flex justify-center">
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{current + 1}</span> / {images.length}
        </span>
      </div>
    </div>
  );
}
