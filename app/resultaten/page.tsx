import { permanentRedirect } from "next/navigation";

// Keep existing bookmarks working; client stories remain on the homepage.
export default function ResultsPage() {
  permanentRedirect("/#reviews-title");
}
