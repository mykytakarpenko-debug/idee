"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { copy } from "@/content/it";
import { Container } from "@/components/site/section";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function SiteError({
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
    <Container className="py-20">
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
    </Container>
  );
}
