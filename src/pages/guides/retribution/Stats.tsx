import { MigratedPageView } from "@/components/migration/MigratedView";

const html = String.raw`<div class="outer-wrapper">
<div class="page-container">
<div class="main-wrapper">
<section id="stats-overview">
<h2 class="section-header">
<img alt="Retribution Icon" class="section-icon" src="/images/SpellIcons/Retribution.jpg"/>
                        RETRIBUTION PALADIN STATS
                    </h2>
<div class="stats-overview-section">
<p>
<strong>Strength</strong> is your primary stat, which increases all damage done by class spells, abilities, and auto attacks.
                            Each piece of gear will also have two secondary stats. This is what they do for Retribution:
                        </p>
<ul>
<li>
<strong>Critical Strike</strong>: Increases the chance to deal extra damage and healing with virtually all abilities,
                                including your own spells, auto attacks, trinkets, and many other effects. Gains value with talents like
                            </li>
<li>
<strong>Haste</strong>: Compresses the rotation by reducing both the GCD and the cooldown of rotational abilities like
                                Important for damage, but can feel a bit overrated because its impact is very “visible.”
                            </li>
<li>
<strong>Mastery</strong>: <span class="reference-chip">"Mastery: Highlord's Judgment"</span> increases Holy damage done (buffing most of your natural damage).
                                It also gives <span class="reference-chip">"Judgment"</span> a chance to deal extra Holy damage when cast. Mastery affects baseline spells and talents,
                                but won’t apply to outside sources like racials (e.g., <span class="reference-chip">"Light's Judgment"</span>) or other non-kit Holy damage.
                            </li>
<li>
<strong>Versatility</strong>: Increases damage done and reduces damage taken by half that amount. Not the flashiest stat,
                                but often more valuable than it seems thanks to the built-in damage reduction.
                            </li>
</ul>
</div>
</section>
<div class="separator-container">
<img alt="Separator 4" class="separator" src="/images/Separators/D4.png">
</img></div>
<section id="best-stats-section">
<h2>
<img alt="Cartel Chip Icon" class="section-icon" src="/images/icons/inv_10_inscription2_repcontracts_scroll_02_uprez_color2.jpg" style="text-align:center; color:#ff66cc;"/>
                        BEST STATS FOR RETRIBUTION PALADIN
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
                                            Herald of the Sun Stat Priority
                                        </h2>
<ol style="margin: 0 auto; padding: 0; text-align: left; width: fit-content;">
<li>Strength</li>
<li>Mastery</li>
<li>Crit</li>
<li>Haste</li>
<li>Versatility</li>
</ol>
</div>
<div>
<h2 style="color:#c2aa68; margin: 0;">
<img alt="Templar Icon" class="section-icon" src="/images/Templar.jpg"/>
                                            Templar Stat Priority
                                        </h2>
<ol style="margin: 0 auto; padding: 0; text-align: left; width: fit-content;">
<li>Strength</li>
<li>Mastery</li>
<li>Crit</li>
<li>Haste</li>
<li>Versatility</li>
</ol>
</div>
</div>
</div>
<div class="tab-content" id="mythic-tab" style="display: none;">
<div class="content-columns">
<div>
<h2 style="color:#ffaa33; margin: 0;">
<img alt="Herald Icon" class="section-icon" src="/images/Herald.jpg"/>
                                            Herald of the Sun Stat Priority
                                        </h2>
<ol style="margin: 0 auto; padding: 0; text-align: left; width: fit-content;">
<li>Strength</li>
<li>Mastery</li>
<li>Crit</li>
<li>Haste</li>
<li>Versatility</li>
</ol>
</div>
<div>
<h2 style="color:#c2aa68; margin: 0;">
<img alt="Templar Icon" class="section-icon" src="/images/Templar.jpg"/>
                                            Templar Stat Priority
                                        </h2>
<ol style="margin: 0 auto; padding: 0; text-align: left; width: fit-content;">
<li>Strength</li>
<li>Mastery</li>
<li>Crit</li>
<li>Haste</li>
<li>Versatility</li>
</ol>
</div>
</div>
<p>
<strong>Note:</strong> In Mythic+, gearing often leans a bit more towards damage. For <em>Templar</em>,
                                    <strong>Critical Strike</strong> becomes much stronger on <em>AoE</em> thanks to its synergy with <span class="reference-chip">"Wrathful Descent"</span>.
                                </p>
</div>
</div>
<p style="margin-top:16px;">
                            It’s also important to remember that secondary stats have <em>diminishing returns</em>, so the more of a single stat you already have,
                            the less benefit each additional point provides—sims will account for this. At the moment, <strong>Mastery</strong> is
                            technically slightly stronger than the other secondaries in general, but you’ll usually aim for a healthy mix (other than stacking
                            Versatility), and <strong>item level</strong> is frequently the better tiebreaker between otherwise similar pieces.
                        </p>
</section>
</section>
</div>
</div>
</div>`;

export default function Stats() {
  return <MigratedPageView title="Retribution Paladin Stats" html={html} />;
}
