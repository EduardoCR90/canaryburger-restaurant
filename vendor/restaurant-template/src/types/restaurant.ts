import { z } from "zod";
import {themeSchema} from './visual';
export {themeSchema} from './visual';
export const moduleSchema = z.object({
  key: z.enum(["reservations", "staff", "qrMenu", "events", "analytics"]),
  enabled: z.boolean().default(false),
  presentation: z.enum(["link", "section"]).default("link"),
});
export type Theme = z.infer<typeof themeSchema>;
export type ModuleEntitlement = {
  key: z.infer<typeof moduleSchema>["key"];
  authorized: boolean;
};
export function canUseModule(
  preference: z.infer<typeof moduleSchema>,
  entitlement?: ModuleEntitlement,
) {
  return (
    preference.enabled &&
    entitlement?.key === preference.key &&
    entitlement.authorized === true
  );
}
export function themeVariables(theme: Theme) {
  const sans = {
    system: "'Helvetica Neue',Arial,sans-serif",
    humanist: "Verdana,Geneva,sans-serif",
    mono: "monospace",
  }[theme.sansFont];
  const radius = { square: "0", soft: ".35rem", pill: "3rem" }[
    theme.buttonShape
  ];
  return `--paper:${theme.paper};--ink:${theme.ink};--rust:${theme.accent};--serif:${theme.font === "sans" ? "Arial,sans-serif" : "Georgia,'Times New Roman',serif"};--sans:${sans};--muted:${theme.muted};--line:${theme.line};--image-placeholder:${theme.imagePlaceholder};--surface:${theme.surface};--on-dark-muted:${theme.onDarkMuted};--dark-line:${theme.darkLine};--gutter:clamp(${theme.gutterMin}rem,${theme.gutterVw}vw,${theme.gutterMax}rem);--space:clamp(${theme.spaceMin}rem,${theme.spaceVw}vw,${theme.spaceMax}rem);--content-max:${theme.contentMax}px;--reading-width:${theme.readingWidth}rem;--button-radius:${radius}`;
}
