
export type PageHeaderBlockProps = { id?: string; title?: string; iconUrl?: string; smallIcon?: boolean };
export default function PageHeaderBlock({ id, title = "Section Title", iconUrl = "/images/itemIcons/inv_scroll_03.jpg", smallIcon = false }: PageHeaderBlockProps) {
  return <section id={id}><h2 className="section-header flex items-center gap-3 text-left"><img src={iconUrl} alt="" className={smallIcon ? "section-icon small-icon h-8 w-8" : "section-icon h-12 w-12"} />{title}</h2></section>;
}
