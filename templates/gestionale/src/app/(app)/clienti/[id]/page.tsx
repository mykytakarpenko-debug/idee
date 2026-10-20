import type { Metadata } from "next";
import { Suspense } from "react";
import { ClientDetailSkeleton, ClientDetailView } from "@/features/clients/client-detail-view";

export const metadata: Metadata = { title: "Scheda cliente" };

/**
 * Il parametro della rotta è un dato di richiesta: con Cache Components va letto
 * dentro un confine <Suspense>, così il guscio statico della pagina resta istantaneo.
 */
export default function ClientPage({ params }: PageProps<"/clienti/[id]">) {
  return (
    <Suspense fallback={<ClientDetailSkeleton />}>
      <ClientDetail params={params} />
    </Suspense>
  );
}

async function ClientDetail({ params }: Pick<PageProps<"/clienti/[id]">, "params">) {
  const { id } = await params;
  return <ClientDetailView id={decodeURIComponent(id)} />;
}
