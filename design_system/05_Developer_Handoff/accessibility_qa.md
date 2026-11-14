# Accessibility & Responsive Acceptance Checklist

The designs are concepts; **WCAG 2.2 AA is an implementation goal, not a verified compliance claim**.

- [ ] Body text contrast >=4.5:1; large text >=3:1; essential icons and control boundaries >=3:1.
- [ ] Keyboard tab order logical, every interactive action operable without a mouse.
- [ ] Visible `:focus-visible` styles; do not remove outlines.
- [ ] Buttons/inputs have accessible names; required fields explained; error messages tied with `aria-describedby`.
- [ ] Async progress announces meaningful state via `role=status`/live region; never invent a completion percentage.
- [ ] Partial-data and error states pair words and icons with color.
- [ ] File selection and validation feedback are readable by screen readers.
- [ ] Exception rows use semantic table headers; expanded evidence is keyboard-operable.
- [ ] Test zoom at 200%; reflow at 320 CSS pixels (where applicable); touch targets comfortably sized.
- [ ] Test viewport widths 375, 768, 1024, 1440px at 100% browser zoom.
- [ ] No clipped money values, lost content, unintended horizontal page scrolling, or unreadably small text.
- [ ] Test with browser accessibility tree + axe/Lighthouse + manual keyboard, VoiceOver/NVDA.
- [ ] Confirm real backend behavior for errors, empty states, exports, status changes, and historical trends.
