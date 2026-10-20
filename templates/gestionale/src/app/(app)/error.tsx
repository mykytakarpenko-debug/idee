"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { copy } from "@/content/it";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Page } from "@/components/ui/page";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Collega qui il tuo servizio di monitoraggio errori (es. Sentry).
    console.error(error);
  }, [error]);

  return (
    <Page>
      <EmptyState
        icon={TriangleAlert}
        title={copy.errors.genericTitle}
        description={copy.errors.genericBody}
        action={
          <Button onClick={reset}>
            <RotateCcw aria-hidden />
            {copy.errors.retry}
          </Button>
        }
      />
    </Page>
  );
}
