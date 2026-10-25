"use client";

import { useRouter } from "next/navigation";
import { copy } from "@/content/it";
import { routes } from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useZodForm } from "@/hooks/use-zod-form";
import { ticketSchema } from "@/lib/domain/schemas";
import type { TicketCategory, TicketPriority } from "@/lib/domain/types";
import { useDataStore } from "@/store/data-store";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

const t = copy.tickets;
const CATEGORIES = Object.keys(copy.ticketCategory) as TicketCategory[];
const PRIORITIES = Object.keys(copy.ticketPriority) as TicketPriority[];

export function NewTicketDialog({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const createTicket = useDataStore((state) => state.createTicket);
  const form = useZodForm(ticketSchema, {
    subject: "",
    category: "question",
    priority: "normal",
    body: "",
  });
  const { errors, text } = form;

  return (
    <DialogContent title={t.newTitle} size="lg">
      <form
        noValidate
        onSubmit={form.handleSubmit((data) => {
          if (!user) return;
          const ticket = createTicket(user.id, data);
          if (!ticket) {
            toast.error(copy.auth.forbiddenText);
            return;
          }
          toast.success(t.created(ticket.number));
          onDone();
          router.push(routes.ticket(ticket.id));
        })}
      >
        <DialogBody className="grid gap-4">
          <Field label={t.subject} name="subject" error={errors.subject}>
            {(props) => <Input {...props} {...text("subject")} maxLength={120} />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.category} name="category">
              {(props) => (
                <Select {...props} {...text("category")}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {copy.ticketCategory[c]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={t.priority} name="priority" hint={t.priorityHint}>
              {(props) => (
                <Select {...props} {...text("priority")}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {copy.ticketPriority[p]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <Field label={t.body} name="body" hint={t.bodyHint} error={errors.body}>
            {(props) => <Textarea {...props} {...text("body")} rows={6} maxLength={4000} />}
          </Field>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onDone}>
            {copy.common.cancel}
          </Button>
          <Button type="submit">{t.new}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
