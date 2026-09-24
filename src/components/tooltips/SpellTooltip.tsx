
import TooltipCard, { type TooltipCardProps } from "./TooltipCard";

export type SpellTooltipProps = TooltipCardProps;
export default function SpellTooltip(props: SpellTooltipProps) {
  return <TooltipCard {...props} kind="spell" />;
}
