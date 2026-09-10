import { permanentRedirect } from "next/navigation";

export default function LegacyToolsPage() {
  permanentRedirect("/community");
}
