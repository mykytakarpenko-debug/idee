import type { Metadata } from "next";
import { copy } from "@/content/it";
import { PricingView } from "@/features/site/pricing-view";

export const metadata: Metadata = {
  title: copy.pricing.title,
  description: copy.pricing.description,
};

export default function Page() {
  return <PricingView />;
}
