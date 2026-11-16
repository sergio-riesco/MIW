import { notFound } from "next/navigation";

// Any English address that does not exist ends up here and shows the 404
// from en/not-found.js with the English template.
export default function Page() {
  notFound();
}
