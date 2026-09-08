import { MigratedPageView } from "@/components/migration/MigratedView";

const html = String.raw`<div class="outer-wrapper">
<div class="page-container">
<div class="main-wrapper">
<section id="stats-overview">
<h2 class="section-header">
<img alt="Trinkets Icon" class="section-icon" src="/images/SpellIcons/Holy Shock.jpg"/>
						HOLY PALADIN STATS
					</h2>
<div class="stats-overview-section">
<p>
							Intellect is your primary stat and it's found on all plate gear and all weapons you'll acquire. Intellect increases the damage and healing that your abilities do and is one of your primary ways of getting stronger.

							Each piece of gear will also have two secondary stats on it. This is what they do:
						</p>
<ul>
<li><strong>Critical Strike</strong>: Chance for each attack and ability to do twice as much damage or healing, and helps proc  <span class="reference-chip">"Infusion of Light"</span>.</li>
<li><strong>Haste</strong>: Increases attack speed and spell casting speed. Also reduces the global cooldown, and the cooldowns of some spells like <span class="reference-chip">"Holy Shock"</span>.</li>
<li><strong>Mastery</strong>: Increases the effectiveness of <span class="reference-chip">"Mastery: Lightbringer"</span>. This increases the healing you do based on how close your target is to you or your Beacon targets.</li>
<li><strong>Versatility</strong>: Increases damage and healing, and reduces damage taken.</li>
</ul>
</div>
</section>
<div class="separator-container">
<img alt="Separator 4" class="separator" src="/images/Separators/D4.png">
</img></div>
<section id="best-stats-section">
<h2>
<img alt="Cartel Chip Icon" class="section-icon" src="/images/icons/inv_10_inscription2_repcontracts_scroll_02_uprez_color2.jpg" style="text-align:center; color:#ff66cc;"/>
						BEST STATS FOR HOLY PALADIN
					</h2>
<section id="bis-tabs">
<div class="bis-tabs">
<div class="tab-header">
<button class="tab-button active">Raid</button>
<button class="tab-button">Mythic+</button>
</div>
<div class="tab-content" id="raid-tab" style="display: block;">
<div class="content-columns">
<div>
<h2 style="color:#ffaa33; margin: 0;">
<img alt="Herald Icon" class="section-icon" src="/images/Herald.jpg"/>
											Herald of the Sun Stat Priory
										</h2>
<ol style="margin: 0 auto; padding: 0; text-align: left; width: fit-content;">
<li>Intellect</li>
<li>Haste = Mastery</li>
<li>Critical Strike</li>
<li>Versatility</li>
</ol>
</div>
<div>
<h2 style="color:#33ccff; margin: 0;">
<img alt="Lightsmith Icon" class="section-icon" src="/images/Lightsmith.jpg"/>
											Lightsmith Stat Priory
										</h2>
<ol style="margin: 0 auto; padding: 0; text-align: left; width: fit-content;">
<li>Intellect</li>
<li>Haste = Mastery</li>
<li>Mastery = Versatility</li>
</ol>
</div>
</div>
</div>
<div class="tab-content" id="mythic-tab" style="display: none;">
<div class="content-columns">
<div>
<h2 style="color:#ffaa33; margin: 0;">
<img alt="Herald Icon" class="section-icon" src="/images/Herald.jpg"/>
											Herald of the Sun Stat Priory
										</h2>
<ol style="margin: 0 auto; padding: 0; text-align: left; width: fit-content;">
<li>Intellect</li>
<li>Haste</li>
<li>Critical Strike</li>
<li>Versatility</li>
<li>Mastery*</li>
</ol>
</div>
<div>
<h2 style="color:#33ccff; margin: 0;">
<img alt="Lightsmith Icon" class="section-icon" src="/images/Lightsmith.jpg"/>
											Lightsmith Stat Priory
										</h2>
<ol style="margin: 0 auto; padding: 0; text-align: left; width: fit-content;">
<li>Intellect</li>
<li>Haste = Critical Strike</li>
<li>Versatility</li>
<li>Mastery</li>
</ol>
</div>
</div>
<p>
									* Mythic+ is an environment that encourages you to deal more damage. This will often lead to you dropping a bit of your mastery in favor of stats that add damage as well as healing, <strong>however if you need as much healing you can get, then Mastery is still great and you should follow the same stat prio as in Raid.</strong>
</p>
</div>
</div>
</section>
</section>
</div>
</div>
</div>`;

export default function Stats() {
  return <MigratedPageView title="Holy Paladin Stats" html={html} />;
}
