declare module "virtual:ms-readme" {
  /** раздел README: компонент, его проп или параметр пропса — см. `plugins/readme.ts` */
  export type ReadmeNode = {
    name: string;
    /** путь, которым проп зовут в коде: `controls.bar.edgeGap` */
    path: string;
    component: string;
    kind: "component" | "prop";
    note: string;
    group: string;
    /** готовый HTML раздела, без вложенных разделов */
    body: string;
    children: ReadmeNode[];
  };

  export type ReadmeSection = { title: string; body: string };

  const readme: { sections: ReadmeSection[]; api: ReadmeNode[] };
  export default readme;
}
