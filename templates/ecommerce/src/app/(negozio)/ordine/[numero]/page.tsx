import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/site/section";
import { OrderView } from "@/features/shop/order-view";

export const metadata: Metadata = { title: "Ordine", robots: { index: false, follow: false } };

async function OrderContent({ params }: { params: PageProps<"/ordine/[numero]">["params"] }) {
  const { numero } = await params;
  return <OrderView number={decodeURIComponent(numero)} />;
}

export default function OrderPage({ params }: PageProps<"/ordine/[numero]">) {
  return (
    <Suspense fallback={<Container className="min-h-[60vh] py-14" aria-busy="true" />}>
      <OrderContent params={params} />
    </Suspense>
  );
}
