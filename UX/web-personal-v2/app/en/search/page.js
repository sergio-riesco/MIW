import Search, { metadata as meta } from "../../_views/Search";

export const metadata = meta("en");

export default function Page({ searchParams }) {
  return <Search lang="en" searchParams={searchParams} />;
}
