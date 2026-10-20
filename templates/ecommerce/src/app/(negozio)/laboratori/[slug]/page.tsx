import type { Metadata } from "next";
import { Suspense } from "react";
import { getCatalog } from "@/lib/catalog-server";
import { Container } from "@/components/site/section";
import { SellerView } from "@/features/shop/sellers-view";

export async function generateStaticParams() {
  const { sellers } = await getCatalog();
  return sellers.map((seller) => ({ slug: seller.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/laboratori/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { sellers } = await getCatalog();
  const seller = sellers.find((s) => s.slug === slug);
  if (!seller) return { robots: { index: false } };
  return { title: seller.name, description: `${seller.craft} a ${seller.city}. ${seller.bio}` };
}

async function SellerContent({ params }: { params: PageProps<"/laboratori/[slug]">["params"] }) {
  const { slug } = await params;
  return <SellerView slug={slug} />;
}

export default function SellerPage({ params }: PageProps<"/laboratori/[slug]">) {
  return (
    <Suspense fallback={<Container className="min-h-[60vh] py-10" aria-busy="true" />}>
      <SellerContent params={params} />
    </Suspense>
  );
}
