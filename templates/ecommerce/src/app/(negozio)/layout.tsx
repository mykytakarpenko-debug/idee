import { getCatalog } from "@/lib/catalog-server";
import { CatalogProvider } from "@/components/layout/catalog-provider";
import { DataBootstrap } from "@/components/layout/data-bootstrap";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { DemoStrip } from "@/components/site/demo-strip";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Toaster } from "@/components/ui/toast";
import { copy } from "@/content/it";

/** Negozio pubblico: catalogo prerenderizzato + dati demo dal browser. */
export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const catalog = await getCatalog();
  return (
    <CatalogProvider value={catalog}>
      <div className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="fixed top-2 left-2 z-[100] -translate-y-20 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-md transition-transform focus:translate-y-0"
        >
          {copy.a11y.skipToContent}
        </a>
        <DataBootstrap />
        <DemoStrip />
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <SiteFooter />
        <CartDrawer />
        <Toaster />
      </div>
    </CatalogProvider>
  );
}
