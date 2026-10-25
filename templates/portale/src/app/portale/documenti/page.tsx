import type { Metadata } from "next";
import { RequirePermission } from "@/components/panel/panel-shell";
import { DocumentsView } from "@/features/portal/documents-view";

export const metadata: Metadata = { title: "Documenti" };

export default function PortaleDocumentiPage() {
  return (
    <RequirePermission permission="documents.view">
      <DocumentsView />
    </RequirePermission>
  );
}
