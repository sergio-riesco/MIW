import Search, { metadata as meta } from "../../_views/Search";

export const metadata = meta("es");

export default function Page({ searchParams }) {
  return <Search lang="es" searchParams={searchParams} />;
}
