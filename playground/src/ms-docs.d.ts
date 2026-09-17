declare module "virtual:ms-docs" {
  /** описание из `src/types/types.ts`, собранное плагином `ms-docs` */
  export type PropDoc = { text: string; default?: string };

  /** ключ — путь пропса: `mode`, `controls.bar.edgeGap`, `ref.step` */
  const docs: Record<string, PropDoc>;
  export default docs;
}
