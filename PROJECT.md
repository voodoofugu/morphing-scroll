# morphing-scroll — project context and decision log

## Documentation UI contract

The documentation shell is intentionally aligned with `nexus-state` and
`styled-atom`: brand at the left, centered project links, theme control at the
right, the same responsive layout and the same side-navigation treatment. The
theme control supports click, keyboard input and pointer dragging. Every site
links back to the author's site.

The implementation stays local to each repository for now. This avoids a shared
UI package and cross-project release coupling for a small amount of code. When
changing the shell, check the other two sites and mirror structural or
interaction changes. Accent colors, available links and navigation depth remain
project-specific; page disclosures are content, not side-navigation nodes.
