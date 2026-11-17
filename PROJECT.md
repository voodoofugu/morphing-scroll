# morphing-scroll — project context and decision log

## Documentation UI contract

The documentation shell is intentionally aligned with `nexus-state` and
`styled-atom`: brand at the left, a monospace theme control at the right, the
same responsive layout, an animated collapsible side navigation and a project
footer for external links. Only `morphing-scroll` keeps its `docs` / `playground`
mode switch in the header. The theme control supports click, keyboard input and
pointer dragging. Every site links back to the author's site from its footer.
Documentation uses one full-width main scroll: the side navigation is sticky
inside the article grid and ends before the full-width footer.

The implementation stays local to each repository for now. This avoids a shared
UI package and cross-project release coupling for a small amount of code. When
changing the shell, check the other two sites and mirror structural or
interaction changes. Accent colors, available links and navigation depth remain
project-specific. README disclosures that represent complete documentation
sections may become side-navigation pages; disclosures that only reveal an
example stay in the article.
