// Original client photographs. Focal points affect the card crop only;
// identities, bodies, colours, and source pixels are never retouched.
const previousCommunityPhotos = [
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

export const previousCommunityImageDefaults = [
  ...previousCommunityPhotos.slice(0, 7).map((photo) => photo.src),
  "/images/omar-deadlift.jpg",
  ...previousCommunityPhotos.slice(7).map((photo) => photo.src),
];

// Preserve the previous row-major order, excluding row 2 columns 2 and 3.
const faithDescriptions = [
  "Samen rekken tijdens een Kratos-training in het park.",
  "Een deelnemer traint met een medicinebal.",
  "De coach begeleidt een rekoefening buiten.",
  "Deelnemers doen samen lunges op het gras.",
  "Een deelnemer glimlacht tijdens een rekoefening.",
  "Een deelnemer warmt op tijdens de buitentraining.",
  "De coach en een deelnemer nemen een rustmoment.",
  "Een deelnemer voert een lunge uit in het park.",
  "Een deelnemer rekt de armen boven het hoofd.",
  "Een deelnemer beweegt langs de trainingskegels.",
  "De coach concentreert zich tijdens de groepstraining.",
  "Samen werken aan mobiliteit tijdens de buitentraining.",
  "De coach begeleidt een dumbbelloefening in de gym.",
];
export const faithCommunityPhotos = previousCommunityImageDefaults
  .filter((_, index) => index !== 6 && index !== 7)
  .map((image_url, index) => ({ image_url, image_alt: faithDescriptions[index] }));

const communityPhotos = [
  { src: "/images/community/gym/coached-incline-press.jpg", position: "50% 43%" },
  { src: "/images/community/gym/kneeling-cable.jpg", position: "50% 47%" },
  { src: "/images/community/gym/assisted-leg-raise.jpg", position: "50% 50%" },
  { src: "/images/community/gym/battle-ropes.jpg", position: "50% 20%" },
  { src: "/images/community/gym/alternating-press.jpg", position: "50% 48%" },
  { src: "/images/community/gym/weighted-pushup-close.jpg", position: "45% 43%" },
  { src: "/images/community/gym/coached-cable-row.jpg", position: "50% 18%" },
  { src: "/images/community/gym/overhead-press-monochrome.jpg", position: "50% 20%" },
  { src: "/images/community/gym/training-focus.jpg", position: "50% 18%" },
  { src: "/images/community/gym/seated-dumbbells.jpg", position: "50% 48%" },
  { src: "/images/community/gym/weighted-pushup-wide.jpg", position: "50% 59%" },
  { src: "/images/community/gym/dumbbell-curl.jpg", position: "50% 38%" },
  { src: "/images/community/gym/standing-deadlift.jpg", position: "50% 45%" },
  { src: "/images/community/gym/incline-press.jpg", position: "58% 44%" },
] as const;

// Keep the CMS's 15-position contract; the renderer substitutes mission_image_url
// at position 8, so changing a surrounding photo never changes the centre.
export const communityImageDefaults = [
  ...communityPhotos.slice(0, 7).map((photo) => photo.src),
  "/images/omar-deadlift.jpg",
  ...communityPhotos.slice(7).map((photo) => photo.src),
];

export function getCommunityImagePosition(src: string): string {
  return [...communityPhotos, ...previousCommunityPhotos].find((photo) => photo.src === src)?.position ?? "50% 50%";
}
