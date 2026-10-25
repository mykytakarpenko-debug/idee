import type { Metadata } from "next";
import { RequirePermission } from "@/components/panel/panel-shell";
import { ProjectsView } from "@/features/portal/projects-view";

export const metadata: Metadata = { title: "Progetti" };

export default function PortaleProgettiPage() {
  return (
    <RequirePermission permission="projects.view">
      <ProjectsView />
    </RequirePermission>
  );
}
