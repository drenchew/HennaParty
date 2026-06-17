import { redirect } from "next/navigation";

/** Legacy route — guest journey lives at /experience. */
export default function Page() {
  redirect("/experience");
}
