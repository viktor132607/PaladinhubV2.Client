import { Link } from "@/router/nextCompat";

const heroTrees = [
  ["/images/Herald.jpg", "HERALD OF THE SUN", "(Holy/Retribution)", "Heralds of the Sun develop a deep bond to the sun and solar energy, using it to burn enemies and cauterize their allies' wounds. They can manifest potent solar rays while fully connected to the Light."],
  ["/images/Lightsmith.jpg", "LIGHTSMITH", "(Holy/Protection)", "Lightsmiths have developed such masterful control over the Light that they are able to wield it tangibly, employing constructs to empower their weapons and defenses and to protect their allies."],
  ["/images/Templar.jpg", "TEMPLAR", "(Protection/Retribution)", "Templars stop at nothing to bring justice to the wicked. They call down hammers of Light and unleash devastating combinations of physical and holy attacks to vanquish their enemies."],
] as const;

const guides = [
  ["Holy", "/images/twws1-home-small-1.png", "/Holy/Overview"],
  ["Protection", "/images/twws1-home-small-2.png", "/Protection/Overview"],
  ["Retribution", "/images/twws1-home-small-3.png", "/Retribution/Overview"],
] as const;

export default function Home() {
  return (
    <div className="home-v1 outer-wrapper">
      <div className="page-container">
        <div className="main-cover-container">
          <img src="/images/mainHD.jpg" alt="Main Image" className="main-cover" />
        </div>
        <div className="main-wrapper">
          <div className="hero-section">
            <h1>PaladinHub</h1>
            <p><strong>Welcome to PaladinHub — your ultimate resource for mastering the Paladin class in World of Warcraft.</strong></p>
            <p>Whether you’re a seasoned veteran or a new initiate, here you’ll find up-to-date guides, talent builds, rotation tips, gearing advice, and more — tailored for <strong>Holy</strong>, <strong>Protection</strong>, and <strong>Retribution</strong> Paladins.</p>
            <p>Embrace the Light, perfect your gameplay, and smite your enemies with righteous fury.</p>
            <a href="#guides" className="btn-hero">Explore Guides</a>{" "}
            <Link to="/Merchandise/List" className="btn-hero">Our Shop</Link>
          </div>

          <section id="hero-tree">
            <h2>NEW 11.0 Hero Talents</h2>
            <div className="hero-tree-grid">
              {heroTrees.map(([image, title, specs, text]) => (
                <div className="hero-tree-card" key={title}>
                  <img src={image} alt={title} className="hero-tree-img" />
                  <h3>{title}</h3>
                  <p><em>{specs}</em></p>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="content-wrapper">
            <section className="captions-section">
              <div className="home-container">
                <div className="home-row captions-row">
                  {guides.map(([name]) => <div className="home-col" key={name}><div className="caption">{name}</div></div>)}
                </div>
              </div>
            </section>

            <section id="guides">
              <div className="home-container">
                <div className="home-row guides-row">
                  {guides.map(([name, image, href]) => (
                    <div className="home-col guide-col" key={name}>
                      <div className="card">
                        <div className="guide-position">
                          <img src={image} alt={`${name} Paladin`} className="guide-image" />
                          <div className="guide-link-position">
                            <Link to={href} className="view-guide-link">View Guide</Link>
                          </div>
                        </div>
                      </div>
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
