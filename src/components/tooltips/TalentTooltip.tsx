
import TooltipCard, { type TooltipCardProps } from "./TooltipCard";

export type TalentTooltipProps = TooltipCardProps;
export default function TalentTooltip(props: TalentTooltipProps) {
  return <TooltipCard {...props} kind="talent" />;
}
