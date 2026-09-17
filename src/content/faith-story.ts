export type FaithPhoto = { image_url: string; image_alt: string };
export type FaithStoryStep = FaithPhoto & {
  title: string;
  text: string;
  additional_images?: FaithPhoto[];
};

// A chapter retains its copy/stepper position while its photographs advance.
export function getFaithStoryPhotos(steps: FaithStoryStep[]) {
  return steps.flatMap((step, stepIndex) => [step, ...(step.additional_images ?? [])]
    .map(({ image_url, image_alt }) => ({ image_url, image_alt, stepIndex, title: step.title })));
}
