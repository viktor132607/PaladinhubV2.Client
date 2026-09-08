import { Link } from "@/router/nextCompat";

const heroTrees = [
  {
    image: "/images/Herald.jpg",
    title: "HERALD OF THE SUN",
    specs: "(Holy/Retribution)",
    text:
      "Heralds of the Sun develop a deep bond to the sun and solar energy, using it to burn enemies and cauterize their allies' wounds. They can manifest potent solar rays while fully connected to the Light.",
  },
  {
    image: "/images/Lightsmith.jpg",
    title: "LIGHTSMITH",
    specs: "(Holy/Protection)",
    text:
      "Lightsmiths have developed such masterful control over the Light that they are able to wield it tangibly, employing constructs to empower their weapons and defenses and to protect their allies.",
  },
  {
    image: "/images/Templar.jpg",
    title: "TEMPLAR",
    specs: "(Protection/Retribution)",
    text:
      "Templars stop at nothing to bring justice to the wicked. They call down hammers of Light and unleash devastating combinations of physical and holy attacks to vanquish their enemies.",
  },
];

const guides = [
  {
    name: "Holy",
    image: "/images/twws1-home-small-1.png",
    href: "/Holy/Overview",
  },
  {
    name: "Protection",
    image: "/images/twws1-home-small-2.png",
    href: "/Protection/Overview",
  },
  {
    name: "Retribution",
    image: "/images/twws1-home-small-3.png",
    href: "/Retribution/Overview",
  },
];

const heroButtonClass =
  "inline-block border-2 border-[#FFD700] bg-transparent px-8 py-[0.8rem] " +
  "text-[1.1rem] text-[#FFD700] no-underline transition-all duration-300 " +
  "hover:bg-[#FFD700] hover:text-black";

export default function Home() {
  return (
    <div className="flex w-full justify-center overflow-visible">
      <div className="w-[1600px] shrink-0">
        {/* MAIN COVER */}
        <div className="mx-auto w-[1600px]">
          <img
            src="/images/mainHD.jpg"
            alt="Main Image"
            className="block w-full object-cover"
          />
        </div>

        {/* MAIN CONTENT */}
        <div className="mx-auto w-[1600px] bg-[#151515] px-[50px]">
          {/* HERO */}
          <section className="relative z-[1] min-h-[60vh] px-8 py-16 text-center">
            <h1 className="mb-6 pb-[30px] text-5xl font-bold text-white">
              PaladinHub
            </h1>

            <p className="mb-10 text-[1.2rem] text-white">
              <strong>
                Welcome to PaladinHub — your ultimate resource for mastering
                the Paladin class in World of Warcraft.
              </strong>
            </p>

            <p className="mb-10 text-[1.2rem] text-white">
              Whether you’re a seasoned veteran or a new initiate, here you’ll
              find up-to-date guides, talent builds, rotation tips, gearing
              advice, and more — tailored for <strong>Holy</strong>,{" "}
              <strong>Protection</strong>, and{" "}
              <strong>Retribution</strong> Paladins.
            </p>

            <p className="mb-10 text-[1.2rem] text-white">
              Embrace the Light, perfect your gameplay, and smite your enemies
              with righteous fury.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a href="#guides" className={heroButtonClass}>
                Explore Guides
              </a>

              <Link
                to="/Merchandise/Merchandise"
                className={heroButtonClass}
              >
                Our Shop
              </Link>
            </div>
          </section>

          {/* HERO TALENTS */}
          <section id="hero-tree" className="w-full py-10 text-center">
            <h2 className="pb-[30px] text-center text-[2rem] font-bold text-[#ff69b4]">
              NEW 11.0 Hero Talents
            </h2>

            <div className="mt-5 flex flex-wrap justify-center gap-[30px]">
              {heroTrees.map((tree) => (
                <article
                  key={tree.title}
                  className="
                    w-[250px]
                    border border-[#FFD700]
                    bg-transparent
                    p-5
                    shadow-[0_0_10px_rgba(255,215,0,0.2)]
                    transition-transform duration-300
                    hover:-translate-y-[5px]

                    max-[768px]:w-[90%]
                  "
                >
                  <img
                    src={tree.image}
                    alt={tree.title}
                    className="
                      mx-auto mb-[10px]
                      h-[150px] w-[150px]
                      rounded-full
                      border-2 border-[#555]
                      object-cover
                      transition-all duration-300
                      hover:scale-105
                      hover:border-[#FFD700]
                    "
                  />

                  <h3 className="mt-[10px] text-white">
                    {tree.title}
                  </h3>

                  <p className="my-[5px] text-[14px] text-[#ccc]">
                    <em className="mb-[10px] block not-italic text-[#d4af37]">
                      {tree.specs}
                    </em>
                  </p>

                  <p className="my-[5px] text-[14px] text-[#ccc]">
                    {tree.text}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* GUIDES CONTENT */}
          <div
            className="
              relative z-[1]
              mx-auto w-[80%]
              px-8 py-16

              max-[768px]:w-[95%]
              max-[768px]:px-4
              max-[768px]:py-8
            "
          >
            {/* GUIDE TITLES */}
            <section>
              <div className="mx-auto w-full">
                <div
                  className="
                    grid grid-cols-3
                    text-center

                    max-[768px]:grid-cols-1
                  "
                >
                  {guides.map((guide) => (
                    <div
                      key={guide.name}
                      className="
                        py-4
                        text-2xl font-bold
                        text-[#FFD700]
                      "
                    >
                      {guide.name}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* GUIDE CARDS */}
            <section id="guides" className="mt-12">
              <div className="mx-auto w-full">
                <div
                  className="
                    grid grid-cols-3
                    text-center

                    max-[768px]:grid-cols-1
                    max-[768px]:gap-10
                  "
                >
                  {guides.map((guide) => (
                    <div
                      key={guide.name}
                      className="flex justify-center"
                    >
                      <article className="inline-block h-full bg-transparent">
                        <div className="relative inline-block">
                          <img
                            src={guide.image}
                            alt={`${guide.name} Paladin`}
                            className="
                              block
                              h-[180px]
                              w-auto
                              object-cover
                            "
                          />

                          <div
                            className="
                              absolute
                              bottom-[10px]
                              left-1/2
                              -translate-x-1/2
                            "
                          >
                            <Link
                              to={guide.href}
                              className="
                                inline-block
                                whitespace-nowrap
                                px-4 py-[0.3rem]
                                text-2xl font-bold
                                text-[#FFD700]
                                no-underline
                                transition-[text-shadow]
                                duration-300
                                hover:[text-shadow:0_0_8px_#FFD700,0_0_12px_#FFD700]
                              "
                            >
                              View Guide
                            </Link>
                          </div>
                        </div>
                      </article>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}