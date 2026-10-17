# React Bits components

Source: https://github.com/DavidHDev/react-bits (retrieved 2026-10-17).
Official documentation: https://reactbits.dev/
License and attribution: see LICENSE.md alongside these sources. Components are included as part of this application.

Vendored TypeScript/CSS sources:
- `src/ts-default/TextAnimations/CountUp/CountUp.tsx`
- `src/ts-default/Components/SpotlightCard/SpotlightCard.tsx` and `.css`
- `src/ts-default/Animations/ClickSpark/ClickSpark.tsx`

Usage:
- CountUp: parent and administration metrics, 650 ms duration; existing Motion dependency.
- SpotlightCard: school hero, soft golden light, no ambient loop or flare. Decorative layers do not intercept pointer input.
- ClickSpark: metric cards, six small cobalt/gold sparks, 300 ms; disabled for reduced motion. No extra animation package added.

Local modifications:
- `integration.css` adapts source styling to cobalt/cream tokens, mobile layout and reduced motion.
- ClickSpark checks the current reduced-motion media query before every burst, including after settings change while the page is open.

No backend, external runtime script or tracking added. Source imports are local and bundled with Vite.
