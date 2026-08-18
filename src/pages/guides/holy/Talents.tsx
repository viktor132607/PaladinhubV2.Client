"use client";

import SectionTalentTrees from "@/components/talent-trees/SectionTalentTrees";

type HeaderButton = {
  href: string;
  text: string;
  icon: string;
};

const currentSectionButtons: HeaderButton[] = [
  {
    href: "#talent-tree-1",
    text: "Scroll to Talents",
    icon: "/images/itemIcons/talents.jpg",
  },
  {
    href: "#talent-tree-2",
    text: "Scroll to Talents",
    icon: "/images/itemIcons/talents.jpg",
  },
];

const otherSectionButtons: HeaderButton[] = [
  {
    href: "/Holy/Overview",
    text: "Overview",
    icon: "/images/SpellIcons/Divine Hammer.jpg",
  },
  {
    href: "/Holy/Gear",
    text: "BiS Gear",
    icon: "/images/itemIcons/inv_chest_plate_earthendungeon_c_01.jpg",
  },
  {
    href: "/Holy/Talents",
    text: "Talent Builds",
    icon: "/images/itemIcons/talents.jpg",
  },
  {
    href: "/Holy/Consumables",
    text: "Consumables",
    icon: "/images/itemIcons/inv_potion_green.jpg",
  },
  {
    href: "/Holy/Rotation",
    text: "Rotation",
    icon: "/images/icons/ui_spellbook_onebutton.jpg",
  },
  {
    href: "/Holy/Stats",
    text: "Stats",
    icon: "/images/icons/inv_10_inscription2_repcontracts_scroll_02_uprez_color2.jpg",
  },
  {
    href: "/Holy/Overview",
    text: "CheatSheet",
    icon: "/images/itemIcons/inv_misc_note_03.jpg",
  },
  {
    href: "/Holy/WA-Addons",
    text: "WA & Addons",
    icon: "/images/icons/WA.png",
  },
];

const pageText =
  "Here are all the best Holy Paladin Talent Tree builds in the Patch 11.1.7 & Season 2 for raids and Mythic+, including export links to import these builds directly into the game. For recommended talent builds for each raid boss and Mythic+ dungeon, check out our Liberation of Undermine Raid Page and Mythic+ page.";

function SectionGrid({
  buttons,
}: {
  buttons: HeaderButton[];
}) {
  return (
    <div
      className="
        mx-auto
        grid
        max-w-[900px]
        grid-cols-4
        border
        border-[#444]
      "
    >
      {buttons.map((button) => (
        <a
          key={`${button.href}-${button.text}`}
          href={button.href}
          className="
            flex
            min-h-[54px]
            items-center
            gap-[10px]
            border
            border-[#333]
            bg-[#1c1c1c]
            p-[10px]
            font-bold
            text-white
            no-underline
            transition-colors
            duration-200
            hover:bg-[#2a2a2a]
            hover:text-white
            hover:no-underline
          "
        >
          <span
            aria-hidden="true"
            className="
              block
              h-8
              w-8
              shrink-0
              rounded-[4px]
              border-2
              border-[#666]
              bg-[#222]
              bg-cover
              bg-center
              bg-no-repeat
            "
            style={{
              backgroundImage: `url("${button.icon}")`,
            }}
          />

          <span>
            {button.text}
          </span>
        </a>
      ))}
    </div>
  );
}

function Separator({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <div
      className="
        my-5
        flex
        w-full
        justify-center
      "
    >
      <img
        src={src}
        alt={alt}
        className="
          block
          h-auto
          w-[95%]
        "
      />
    </div>
  );
}

function HolyTalentsPageHeader() {
  return (
    <div
      className="
        relative
        left-1/2
        w-[1600px]
        max-w-none
        -translate-x-1/2
      "
    >
      <div
        className="
          w-[1600px]
          p-0
        "
      >
        {/* V1 image-cover-container */}
        <div
          className="
            aspect-[2560/820]
            w-[1600px]
            overflow-hidden
          "
        >
          <img
            src="/images/TheHolyCover2.jpg"
            alt="Cover"
            className="
              block
              h-full
              w-full
              object-cover
            "
          />
        </div>

        {/* V1 main-wrapper from _PageHeader */}
        <div
          className="
            box-border
            w-[1600px]
            bg-[#151515]
            px-[50px]
            pb-6
            pt-6
          "
        >
          <h1
            className="
              m-0
              pb-[30px]
              text-center
              text-[2.5rem]
              font-medium
              leading-[1.2]
              text-white
            "
          >
            Best Holy Paladin Talent Tree Builds - The War Within
          </h1>

          <p
            className="
              mb-4
              text-[16px]
              font-medium
              leading-[1.6]
              text-white
            "
          >
            {pageText}
          </p>

          <div
            className="
              mb-[10px]
              mt-5
              text-center
              text-[1.8em]
              font-bold
              leading-[1.2]
              text-white
            "
          >
            Current Sections :
          </div>

          <SectionGrid
            buttons={
              currentSectionButtons
            }
          />

          <div
            className="
              mb-[10px]
              mt-5
              text-center
              text-[1.8em]
              font-bold
              leading-[1.2]
              text-white
            "
          >
            Other Sections :
          </div>

          <SectionGrid
            buttons={
              otherSectionButtons
            }
          />

          <Separator
            src="/images/Separators/D4.png"
            alt="Separator 4"
          />
        </div>
      </div>
    </div>
  );
}

export default function Talents() {
  return (
    <>
      <HolyTalentsPageHeader />

      {/* V1 Talents.cshtml body */}
      <div
        className="
          relative
          left-1/2
          w-[1600px]
          max-w-none
          -translate-x-1/2
        "
      >
        <div
          className="
            box-border
            w-[1600px]
            bg-[#151515]
            px-[50px]
            pb-[120px]
          "
        >
          <SectionTalentTrees section="holy" />
        </div>
      </div>
    </>
  );
}