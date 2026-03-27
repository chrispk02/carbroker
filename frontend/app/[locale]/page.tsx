"use client";

import { ArrowLeft, Shield, MessageCircle, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CarImageGallery } from "@/components/car-image-gallery";
import { CarSpecs } from "@/components/car-specs";
import { CarFeatures } from "@/components/car-features";
import { SellerInfo } from "@/components/seller-info";
import { TrustBox } from "@/components/trust-box";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLocale } from "@/lib/i18n/locale-context";
import { useAuth } from "@/lib/auth/context";

// Mock data for the car listing
const carData = {
  id: "1",
  name: "2023 BMW M4 Competition",
  price: 84995,
  year: 2023,
  mileage: "12,450 mi",
  fuel: "Gasoline",
  transmission: "Automatic",
  images: [
    {
      src: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=1200&q=80",
      alt: "BMW M4 Front View",
    },
    {
      src: "https://images.unsplash.com/photo-1607853554499-e056b7e69fa8?w=1200&q=80",
      alt: "BMW M4 Side View",
    },
    {
      src: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80",
      alt: "BMW M4 Interior",
    },
    {
      src: "https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?w=1200&q=80",
      alt: "BMW M4 Rear View",
    },
  ],
  description:
    "Experience the pinnacle of driving performance with this stunning 2023 BMW M4 Competition. This vehicle combines aggressive styling with breathtaking power, featuring BMW's legendary inline-6 twin-turbo engine producing 503 horsepower. The M4 Competition delivers an exhilarating driving experience with its adaptive M suspension, precise steering, and race-inspired cockpit. One owner, always garaged, and meticulously maintained with full BMW service history.",
  features: [
    "M Carbon Ceramic Brakes",
    "M Driver's Package",
    "Executive Package",
    "Premium Harman Kardon Audio",
    "Adaptive LED Headlights",
    "Head-Up Display",
    "Wireless Charging",
    "Heated & Ventilated Seats",
    "360° Parking Camera",
    "Apple CarPlay",
    "M Carbon Exterior Package",
    "19/20\" M Forged Wheels",
  ],
  seller: {
    name: "Premium Auto Group",
    location: "Los Angeles, CA",
    memberSince: "2019",
    isVerified: true,
  },
};

export default function CarDetailPage() {
  const { locale, dictionary: t } = useLocale();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(carData.price);

  const handleRequestPurchase = () => {
    if (!isAuthenticated) {
      router.push(`/${locale}/auth?returnUrl=/${locale}`);
      return;
    }
    // Handle purchase request
  };

  const handleTalkToBroker = () => {
    if (!isAuthenticated) {
      router.push(`/${locale}/auth?returnUrl=/${locale}`);
      return;
    }
    // Handle talk to broker
  };

  const buyPath = locale === "vi" ? `/${locale}/mua-xe` : `/${locale}/buy-cars`;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      {/* Back Link */}
      <Link
        href={buyPath}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t.carDetail.backToListings}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr,420px] lg:gap-12">
        {/* Left Column - Image Gallery */}
        <div className="space-y-6">
          <CarImageGallery images={carData.images} />

          {/* Description Section */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {t.carDetail.description}
            </h2>
            {isAuthenticated ? (
              <p className="leading-relaxed text-muted-foreground">
                {carData.description}
              </p>
            ) : (
              <div className="relative">
                <p className="line-clamp-3 leading-relaxed text-muted-foreground blur-sm select-none">
                  {carData.description}
                </p>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/${locale}/auth?returnUrl=/${locale}`)}
                    className="gap-2"
                  >
                    <Lock className="size-4" />
                    {t.carDetail.signInToView}
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Features Section */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {t.carDetail.featuresEquipment}
            </h2>
            {isAuthenticated ? (
              <CarFeatures features={carData.features} />
            ) : (
              <div className="relative">
                <div className="blur-sm select-none">
                  <CarFeatures features={carData.features.slice(0, 6)} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/${locale}/auth?returnUrl=/${locale}`)}
                    className="gap-2"
                  >
                    <Lock className="size-4" />
                    {t.carDetail.signInToView}
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Seller Info Section */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {t.carDetail.sellerInfo}
            </h2>
            <SellerInfo {...carData.seller} />
          </section>
        </div>

        {/* Right Column - Purchase Info */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
            {/* Badge */}
            <Badge className="gap-1.5 bg-accent text-accent-foreground py-1.5 px-3 text-sm">
              <Shield className="size-3.5" />
              {t.carDetail.brokerProtectedDeal}
            </Badge>

            {/* Car Name & Price */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
                {carData.name}
              </h1>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {formattedPrice}
              </p>
            </div>

            <Separator />

            {/* Specs */}
            <CarSpecs
              year={carData.year}
              mileage={carData.mileage}
              fuel={carData.fuel}
              transmission={carData.transmission}
            />

            <Separator />

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full text-base"
                onClick={handleRequestPurchase}
              >
                {!isAuthenticated && <Lock className="mr-2 size-4" />}
                {t.carDetail.requestPurchase}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full gap-2 text-base"
                onClick={handleTalkToBroker}
              >
                <MessageCircle className="size-4" />
                {t.carDetail.talkToBroker}
              </Button>
            </div>

            {/* Auth Notice for non-authenticated users */}
            {!isAuthenticated && (
              <p className="text-center text-xs text-muted-foreground">
                {t.carDetail.signInRequired}
              </p>
            )}

            {/* Trust Box */}
            <TrustBox />
          </div>
        </div>
      </div>
    </main>
      <SiteFooter />
    </>
  );
}
