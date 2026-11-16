import NotFound, { notFoundMetadata } from "../_views/NotFound";

// When an English page calls notFound() (e.g. a genre that does not exist).
export const metadata = notFoundMetadata("en");

export default function Page() {
  return <NotFound lang="en" />;
}
