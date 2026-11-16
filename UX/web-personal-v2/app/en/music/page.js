import Music, { metadata as meta } from "../../_views/Music";

export const metadata = meta("en");

export default function Page() {
  return <Music lang="en" />;
}
