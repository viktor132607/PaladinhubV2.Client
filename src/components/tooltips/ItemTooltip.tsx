
import TooltipCard, { type TooltipCardProps } from "./TooltipCard";

export type ItemTooltipProps = TooltipCardProps;
export default function ItemTooltip(props: ItemTooltipProps) {
  return <TooltipCard {...props} kind="item" />;
}
