# AI Workflow Rules

## Approach

Implement approved work in isolated feature units: data/security, public intake,
CMS operations, responsive refinement, and the scoped Faith story presentation.

## Scoping Rules

- Work from one feature spec at a time.
- Do not touch public animations outside the current Faith story feature spec,
  hero frames, product imagery, or pricing.
- Do not apply production migrations or configure provider credentials without a separate request.

## Missing Requirements

- Record missing provider credentials as a configuration gate, not a blocker.
- Use owner/super-admin-only PII access as the safe default.
- Keep any future native scheduler outside the current implementation.

## Protected Files

- User-owned files already dirty in Git.
- Public hero frames and `public/images`.
- Generated media inventory output unless the build script updates it.
- Lockfiles unless dependencies change.

## Documentation and Verification

- Update architecture/UI/progress context when decisions change.
- Run the repository checks after each coherent unit where practical.
- Finish with a local preview and browser inspection.
