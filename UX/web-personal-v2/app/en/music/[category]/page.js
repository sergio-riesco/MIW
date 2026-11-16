import MusicCategory, { metadata as meta, staticParams } from "../../../_views/MusicCategory";

// Una página estática por género, generada al compilar.
export function generateStaticParams() {
  return staticParams();
}

export function generateMetadata({ params }) {
  return meta("en", params);
}

export default function Page({ params }) {
  return <MusicCategory lang="en" params={params} />;
}
