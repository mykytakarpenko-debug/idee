import type { Metadata } from "next";
import { Suspense } from "react";
import { ReceiptView } from "@/features/payments/receipt-view";

export const metadata: Metadata = { title: "Ricevuta" };

export default function ReceiptPage({ params }: PageProps<"/ricevuta/[id]">) {
  return (
    <Suspense fallback={null}>
      <Receipt params={params} />
    </Suspense>
  );
}

async function Receipt({ params }: Pick<PageProps<"/ricevuta/[id]">, "params">) {
  const { id } = await params;
  return <ReceiptView id={decodeURIComponent(id)} />;
}
