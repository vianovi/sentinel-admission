# Public Contract Evidence

## Verifiable application contracts

- `/` is public and returns Inertia component `Landing/Welcome`.
- Landing props explicitly include a subset of the active wave plus global `auth`, `flash`, and `app` props.
- `/media/gallery/{filename}` accepts only `images|videos`, a restricted basename, and known image/video extensions before resolving the private disk path.
- Public/auth shell dependencies include Google Fonts, cdnjs Font Awesome, Google Maps, and—currently—Picsum/MDN placeholder showcase media.
- Navigation crosses to `/daftar`, `/login`, and authenticated `/dashboard` based on current auth state.

## Unverified/contradictory business content

- Placeholder showcase source and claims are explicit in `CinematicShowcase.tsx`.
- Displayed footer address and embedded map identify different locations.
- Legal actions have no destination.
- Brochure file type and UI/download metadata disagree.
- No authoritative repository manifest identifies approved address, map, contacts, social accounts, legal URLs, showcase assets, or institutional statistics.

## Decision boundary

Code cannot establish which content is truthful. Replacing it speculatively would violate the repository prohibition on invented data. Safe options are:

1. Owner supplies a verified public-content manifest and approved media/assets/URLs.
2. Owner authorizes removal or explicit disabling of every unverified public element until verified content exists.

Task 01 must remain blocked until one option is chosen.
