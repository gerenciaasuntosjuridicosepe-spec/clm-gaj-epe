import { redirect } from "next/navigation";

/** El calendario de Alquileres se unificó con el del CLM — ver /calendario. */
export default function AlquileresCalendarioPage() {
  redirect("/calendario");
}
