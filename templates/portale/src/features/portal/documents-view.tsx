"use client";

import {
  Download,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { copy } from "@/content/it";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { useZodForm } from "@/hooks/use-zod-form";
import { fileSize } from "@/lib/domain/billing";
import { can } from "@/lib/domain/rbac";
import { uploadSchema } from "@/lib/domain/schemas";
import type { DocumentKind, Folder } from "@/lib/domain/types";
import { formatDate } from "@/lib/format";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Page, PageHeader, Toolbar } from "@/components/ui/page";
import { SearchInput } from "@/components/ui/search-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { toast } from "@/components/ui/toast";

const t = copy.documents;
const FOLDERS = Object.keys(copy.folders) as Folder[];
const ICONS: Record<DocumentKind, LucideIcon> = {
  pdf: FileText,
  doc: FileText,
  sheet: FileSpreadsheet,
  image: FileImage,
  zip: FileArchive,
};

export function DocumentsView() {
  const { user, org } = useAuth();
  const { documents, users } = useData((state) => ({
    documents: state.documents,
    users: state.users,
  }));
  const log = useDataStore((state) => state.log);
  const [folder, setFolder] = useState<Folder | "all">("all");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents
      .filter((d) => d.orgId === org?.id)
      .filter((d) => folder === "all" || d.folder === folder)
      .filter((d) => !q || d.name.toLowerCase().includes(q))
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }, [documents, org?.id, folder, query]);

  if (!user || !org) return null;
  const author = (id: string) => users.find((u) => u.id === id)?.name ?? "—";

  return (
    <Page>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          can(user.role, "documents.upload") ? (
            <Button onClick={() => setUploading(true)}>
              <Upload aria-hidden />
              {t.upload}
            </Button>
          ) : null
        }
      />
      <Toolbar>
        <SegmentedControl
          ariaLabel={t.allFolders}
          value={folder}
          onChange={setFolder}
          options={[
            { value: "all", label: copy.common.all },
            ...FOLDERS.map((f) => ({ value: f, label: copy.folders[f] })),
          ]}
          className="max-w-full overflow-x-auto"
        />
        <SearchInput
          label={t.search}
          placeholder={t.search}
          value={query}
          onValueChange={setQuery}
          className="sm:max-w-xs"
        />
      </Toolbar>
      <Card>
        {visible.length === 0 ? (
          <EmptyState icon={FileText} title={t.empty} />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((doc) => {
              const Icon = ICONS[doc.kind];
              return (
                <li key={doc.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                  <Icon aria-hidden className="size-5 shrink-0 text-fg-subtle" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">
                      {doc.name}
                      {doc.version > 1 ? (
                        <span className="ml-2 text-[13px] font-normal text-fg-muted">
                          {t.version(doc.version)}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[13px] text-fg-muted">
                      {copy.folders[doc.folder]} ·{" "}
                      {doc.sizeKb > 0 ? `${fileSize(doc.sizeKb)} · ` : ""}
                      {formatDate(doc.uploadedAt, "short")} · {author(doc.uploadedBy)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t.downloadLabel(doc.name)}
                    onClick={() => {
                      // TODO(integrazione): link firmato a scadenza dallo storage privato.
                      log(user.id, "document.download", doc.name, doc.orgId);
                      toast.success(t.downloaded(doc.name));
                    }}
                  >
                    <Download aria-hidden />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <Dialog open={uploading} onOpenChange={setUploading}>
        {uploading ? <UploadDialog onDone={() => setUploading(false)} /> : null}
      </Dialog>
    </Page>
  );
}

function UploadDialog({ onDone }: { onDone: () => void }) {
  const fileId = useId();
  const { user, org } = useAuth();
  const projects = useData((state) => state.projects);
  const upload = useDataStore((state) => state.uploadDocument);
  const form = useZodForm(uploadSchema, { name: "", folder: "consegne", projectId: "" });
  const { errors, text, setValue } = form;
  const own = projects.filter((p) => p.orgId === org?.id);

  return (
    <DialogContent title={t.uploadTitle} description={t.uploadNote}>
      <form
        noValidate
        onSubmit={form.handleSubmit((data) => {
          if (!user) return;
          upload(user.id, {
            name: data.name,
            folder: data.folder,
            projectId: data.projectId || null,
          });
          toast.success(t.uploaded, { description: data.name });
          onDone();
        })}
      >
        <DialogBody className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={fileId} className="text-[13px] font-medium text-fg">
              {t.file}
            </label>
            <input
              id={fileId}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setValue("name", file.name);
              }}
              className="text-sm text-fg file:mr-3 file:rounded-md file:border file:border-line file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-fg"
            />
          </div>
          <Field label={t.name} name="name" error={errors.name}>
            {(props) => <Input {...props} {...text("name")} />}
          </Field>
          <Field label={t.folder} name="folder">
            {(props) => (
              <Select {...props} {...text("folder")}>
                {FOLDERS.map((f) => (
                  <option key={f} value={f}>
                    {copy.folders[f]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t.project} name="projectId" optional>
            {(props) => (
              <Select {...props} {...text("projectId")}>
                <option value="">{t.noProject}</option>
                {own.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">{t.upload}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
