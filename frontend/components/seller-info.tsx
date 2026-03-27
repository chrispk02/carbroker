"use client";

import { User, MapPin, Clock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/locale-context";

interface SellerInfoProps {
  name: string;
  location: string;
  memberSince: string;
  isVerified: boolean;
}

export function SellerInfo({
  name,
  location,
  memberSince,
  isVerified,
}: SellerInfoProps) {
  const { dictionary: t } = useLocale();

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <User className="size-6 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground">{name}</h4>
              {isVerified && (
                <Badge className="bg-success text-success-foreground gap-1">
                  <ShieldCheck className="size-3" />
                  {t.seller.verified}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {t.seller.memberSince} {memberSince}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 rounded-lg bg-muted/50 p-3">
        <p className="text-sm text-muted-foreground">
          {t.seller.note}
        </p>
      </div>
    </div>
  );
}
