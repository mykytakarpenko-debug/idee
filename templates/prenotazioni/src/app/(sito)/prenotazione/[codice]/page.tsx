import type { Metadata } from "next";
import { Suspense } from "react";
import { copy } from "@/content/it";
import { ManageView } from "@/features/site/manage-view";

export const metadata: Metadata = { title: copy.manage.findTitle, robots: { index: false } };

export default function ManagePage({ params }: PageProps<"/prenotazione/[codice]">) {
  return (
    <Suspense fallback={null}>
      <Manage params={params} />
    </Suspense>
  );
}

async function Manage({ params }: Pick<PageProps<"/prenotazione/[codice]">, "params">) {
  const { codice } = await params;
  return <ManageView code={decodeURIComponent(codice).toUpperCase()} />;
}
