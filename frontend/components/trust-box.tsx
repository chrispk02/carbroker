"use client";

import { ShieldCheck, Lock, MessageSquareOff } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

export function TrustBox() {
  const { dictionary: t } = useLocale();

  const trustItems = [
    {
      icon: ShieldCheck,
      text: t.trust.communication,
    },
    {
      icon: MessageSquareOff,
      text: t.trust.noDirectContact,
    },
    {
      icon: Lock,
      text: t.trust.securePayment,
    },
  ];

  return (
    <div className="rounded-xl border border-success/20 bg-success/5 p-5">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
        <ShieldCheck className="size-5 text-success" />
        {t.trust.title}
      </h3>
      <div className="space-y-3">
        {trustItems.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success/10">
              <item.icon className="size-4 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
