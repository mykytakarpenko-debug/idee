import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackingView } from "@/features/site/tracking-view";

export const metadata: Metadata = { title: "Stato dell'ordine", robots: { index: false } };

export default function TrackingPage({ params }: PageProps<"/ordine/[numero]">) {
  return (
    <Suspense fallback={null}>
      <Tracking params={params} />
    </Suspense>
  );
}

async function Tracking({ params }: Pick<PageProps<"/ordine/[numero]">, "params">) {
  const { numero } = await params;
  return <TrackingView number={decodeURIComponent(numero)} />;
}
