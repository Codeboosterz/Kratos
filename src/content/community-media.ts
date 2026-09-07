// Original client photographs. Focal points affect the card crop only;
// identities, bodies, colours, and source pixels are never retouched.
const communityPhotos = [
  { src: "/images/community/partner-stretch.jpg", position: "50% 24%" },
  { src: "/images/community/medicine-ball.jpg", position: "50% 26%" },
  { src: "/images/community/coach-guidance.jpg", position: "50% 36%" },
  { src: "/images/community/team-lunges.jpg", position: "50% 34%" },
  { src: "/images/community/stretch-smile.jpg", position: "50% 40%" },
  { src: "/images/community/outdoor-warmup.jpg", position: "50% 24%" },
  { src: "/images/community/coached-row.jpg", position: "50% 18%" },
  { src: "/images/community/team-recovery.jpg", position: "50% 26%" },
  { src: "/images/community/outdoor-lunge.jpg", position: "50% 32%" },
  { src: "/images/community/overhead-stretch.jpg", position: "50% 28%" },
  { src: "/images/community/agility-drill.jpg", position: "50% 34%" },
  { src: "/images/community/coach-focus.jpg", position: "50% 34%" },
  { src: "/images/community/partner-mobility.jpg", position: "50% 26%" },
  { src: "/images/community/coached-press.jpg", position: "50% 30%" },
] as const;

// Keep the CMS's 15-position contract; the renderer substitutes mission_image_url
// at position 8, so changing a surrounding photo never changes the centre.
export const communityImageDefaults = [
  ...communityPhotos.slice(0, 7).map((photo) => photo.src),
  "/images/omar-deadlift.jpg",
  ...communityPhotos.slice(7).map((photo) => photo.src),
];

export function getCommunityImagePosition(src: string): string {
  return communityPhotos.find((photo) => photo.src === src)?.position ?? "50% 50%";
}
