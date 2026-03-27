"use client";

import Link from "next/link";
import { Search, SlidersHorizontal, Car, ChevronRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Mock car listings data
const carListings = [
  {
    id: "1",
    name: "BMW X5 xDrive40i",
    price: 65000,
    year: 2023,
    mileage: "15,000 km",
    fuel: "Petrol",
    transmission: "Automatic",
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop",
    verified: true,
  },
  {
    id: "2",
    name: "Mercedes-Benz E-Class",
    price: 58000,
    year: 2022,
    mileage: "22,000 km",
    fuel: "Diesel",
    transmission: "Automatic",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop",
    verified: true,
  },
  {
    id: "3",
    name: "Audi Q7 Premium",
    price: 72000,
    year: 2023,
    mileage: "8,500 km",
    fuel: "Petrol",
    transmission: "Automatic",
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop",
    verified: true,
  },
  {
    id: "4",
    name: "Porsche Cayenne",
    price: 89000,
    year: 2023,
    mileage: "5,200 km",
    fuel: "Hybrid",
    transmission: "Automatic",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop",
    verified: true,
  },
];

export function BuyCarsContent() {
  const { locale, dictionary: t } = useLocale();

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
      <section className="border-b bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t.buyCars.title}
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              {t.buyCars.subtitle}
            </p>
          </div>

          {/* Search Bar */}
          <div className="mx-auto mt-8 flex max-w-2xl gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t.buyCars.searchPlaceholder}
                className="h-11 pl-10"
              />
            </div>
            <Button variant="outline" className="h-11 gap-2">
              <SlidersHorizontal className="size-4" />
              {t.buyCars.filters}
            </Button>
          </div>
        </div>
      </section>

      {/* Listings Section */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Results Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Car className="size-4" />
              <span>
                <strong className="text-foreground">{carListings.length}</strong>{" "}
                {t.buyCars.resultsFound}
              </span>
            </div>
            <Badge variant="secondary">{t.buyCars.allCars}</Badge>
          </div>

          {/* Car Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {carListings.map((car) => (
              <Link key={car.id} href={`/${locale}?car=${car.id}`}>
                <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={car.image}
                      alt={car.name}
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {car.verified && (
                      <Badge className="absolute left-3 top-3 bg-success text-success-foreground">
                        {t.buyCars.brokerProtected}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground">{car.name}</h3>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      ${car.price.toLocaleString()}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-secondary px-2 py-1">{car.year}</span>
                      <span className="rounded bg-secondary px-2 py-1">{car.mileage}</span>
                      <span className="rounded bg-secondary px-2 py-1">{car.fuel}</span>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-accent">
                      {t.buyCars.viewDetails}
                      <ChevronRight className="ml-1 size-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </div>
      <SiteFooter />
    </>
  );
}
