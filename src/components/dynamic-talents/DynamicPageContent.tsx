"use client";
import { useLocalization } from "@/localization/LocalizationContext";
import { localizeContent } from "@/localization/content";
import { Component, type ReactNode, type ComponentType } from "react";
import {
  parseLayout,
  type Tree,
  type Block,
} from "@/features/dynamic-talents/model";
import TreeView from "./TreeView";
import Heading from "@/components/page-builder/blocks/HeadingBlock";
import Paragraph from "@/components/page-builder/blocks/ParagraphBlock";
import ImageBlock from "@/components/page-builder/blocks/ImageBlock";
import Callout from "@/components/page-builder/blocks/CalloutBlock";
import Divider from "@/components/page-builder/blocks/DividerBlock";
import PageHeader from "@/components/page-builder/blocks/PageHeaderBlock";
import GenericTable from "@/components/page-builder/blocks/GenericTableBlock";
import GearTable from "@/components/page-builder/blocks/GearTableBlock";
import ConsumablesTable from "@/components/page-builder/blocks/ConsumablesTableBlock";
import TalentTree from "@/components/page-builder/blocks/TalentTreeBlock";
import TalentBuildMenu from "@/components/page-builder/blocks/TalentBuildMenuBlock";
import ItemGrid from "@/components/page-builder/blocks/ItemGridBlock";
import SpellList from "@/components/page-builder/blocks/SpellListBlock";
import RotationCard from "@/components/page-builder/blocks/RotationCardBlock";
import Tabs from "@/components/page-builder/blocks/TabsBlock";
import Switcher from "@/components/page-builder/blocks/SwitcherBlock";
import ColumnsText from "@/components/page-builder/blocks/ColumnsTextBlock";
import TierList from "@/components/page-builder/blocks/TierListBlock";
import Section from "@/components/page-builder/blocks/SectionBlock";

const views: Record<string, ComponentType<Record<string, unknown>>> = {
  heading: Heading as ComponentType<Record<string, unknown>>,
  paragraph: Paragraph as ComponentType<Record<string, unknown>>,
  image: ImageBlock as ComponentType<Record<string, unknown>>,
  callout: Callout as ComponentType<Record<string, unknown>>,
  divider: Divider as ComponentType<Record<string, unknown>>,
  pageheader: PageHeader as ComponentType<Record<string, unknown>>,
  "table.generic": GenericTable as ComponentType<Record<string, unknown>>,
  "table.gear": GearTable as ComponentType<Record<string, unknown>>,
  "table.consumables": ConsumablesTable as ComponentType<Record<string, unknown>>,
  talenttree: TalentTree as ComponentType<Record<string, unknown>>,
  talentbuildmenu: TalentBuildMenu as ComponentType<Record<string, unknown>>,
  itemgrid: ItemGrid as ComponentType<Record<string, unknown>>,
  spelllist: SpellList as ComponentType<Record<string, unknown>>,
  rotationcard: RotationCard as ComponentType<Record<string, unknown>>,
  tabs: Tabs as ComponentType<Record<string, unknown>>,
  switcher: Switcher as ComponentType<Record<string, unknown>>,
  columnstext: ColumnsText as ComponentType<Record<string, unknown>>,
  tierlist: TierList as ComponentType<Record<string, unknown>>,
  section: Section as ComponentType<Record<string, unknown>>,
};

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, v]) => {
      const name = key[0].toLowerCase() + key.slice(1);
      return [
        name === "sectionId"
          ? "id"
          : name === "cssClass"
            ? "className"
            : name === "alternative"
              ? "alt"
              : name,
        normalize(v),
      ];
    }),
  );
}

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p role="alert">Invalid page block.</p>
    ) : (
      this.props.children
    );
  }
}

function RenderBlock({ block }: { block: Block }) {
  if (block.type === "talenttree.dynamic")
    return <TreeView tree={block as Tree} />;

  const View = views[block.type.toLowerCase()];
  if (!View) return <p role="alert">Unsupported block: {block.type}</p>;

  const props = normalize({
    ...block,
    ...(typeof block.props === "object" ? block.props : {}),
  }) as Record<string, unknown>;

  props.adminMode = false;
  if (block.type.toLowerCase() === "table.generic")
    props.rows = block.Rows ?? block.rows ?? [];

  return <View {...props} />;
}

export function hasDynamicTrees(json: string) {
  try {
    return parseLayout(json).some((b) => b.type === "talenttree.dynamic");
  } catch {
    return false;
  }
}

export function canRenderLayout(json: string) {
  try {
    const blocks = parseLayout(json);
    return (
      blocks.length > 0 &&
      blocks.every(
        (block) =>
          block.type === "talenttree.dynamic" ||
          Boolean(views[block.type.toLowerCase()]),
      )
    );
  } catch {
    return false;
  }
}

export default function DynamicPageContent({ json }: { json: string }) {
  const { t } = useLocalization();
  return (
    <div className="min-w-0 space-y-6">
      {localizeContent(parseLayout(json), t).map((block, i) => (
        <Boundary key={`${i}:${JSON.stringify(block)}`}>
          <RenderBlock block={block} />
        </Boundary>
      ))}
    </div>
  );
}
