import { DataBootstrap } from "@/components/layout/data-bootstrap";
import { Toaster } from "@/components/ui/toast";

/** Pagine pubbliche: accesso e informativa. */
export default function AccessLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <DataBootstrap />
      {children}
      <Toaster />
    </>
  );
}
