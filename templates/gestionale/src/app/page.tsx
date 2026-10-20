import { redirect } from "next/navigation";
import { routes } from "@/config/navigation";

/** La radice porta alla dashboard. Con l'autenticazione attiva, il controllo va nel proxy. */
export default function Home() {
  redirect(routes.dashboard);
}
