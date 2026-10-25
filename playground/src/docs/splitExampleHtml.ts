const EXAMPLE_LABEL = "<b>Example:</b>";
const CODE_END = "</pre>";
const BANNER = /^\s*<p><img\s+(?=[^>]*alt="banner")[^>]*><\/p>/;

/**
 * README keeps a static snippet and banner for GitHub. On the documentation
 * site a live demo replaces both, but stays exactly where `Example:` stood.
 */
export function splitExampleHtml(html: string) {
  const start = html.indexOf(EXAMPLE_LABEL);
  if (start === -1) return null;

  const codeStart = html.indexOf("<pre", start + EXAMPLE_LABEL.length);
  const codeClose = codeStart === -1 ? -1 : html.indexOf(CODE_END, codeStart);
  if (codeClose === -1) return null;

  let end = codeClose + CODE_END.length;
  const banner = html.slice(end).match(BANNER)?.[0];
  if (banner) end += banner.length;

  const before = html.slice(0, start);
  const paragraphIsOpen =
    before.lastIndexOf("<p") > before.lastIndexOf("</p>");

  return {
    before: `${before}${paragraphIsOpen ? "</p>" : ""}`,
    after: html.slice(end),
  };
}
