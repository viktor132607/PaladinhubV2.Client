/* wwwroot/js/talenttrees.js
   Talent trees with validation: prerequisites, point costs, per-tree caps.
   Persists via /api/talents (session) with localStorage fallback.
*/
(function (window, document) {
    'use strict';

    /* ================== RULES CONFIG ==================
       Ключът е "tree key". За стандартните: paladin, holy, protection, retribution.
       За hero: най-сигурно е да сложиш data-tree-key на контейнера, напр.:
         <div class="hero-tree-container" data-tree-key="holy-herald"></div>
       Ако няма, скриптът ще извади ключ от URL спека + <h2> заглавието (e.g. "holy-herald-of-the-sun").
  
       nodes: { "<NodeName>": { cost?: number, requires?: string[] } }
       max: лимит точки за дървото (може да е null/undefined -> без лимит)
  
       ВАЖНО: Името на нода трябва да съвпада с <img alt="..."> от SpellNode.
    ==================================================== */
    const TALENT_RULES = {
        paladin: {
            max: 31,
            nodes: {
                "Lay on Hands": { cost: 1 },
                "Divine Steed": { cost: 1 },
                "Blessing of Freedom": { cost: 1, requires: ["Divine Steed"] },
                // ...допълни останалите
            }
        },
        holy: {
            max: 31,
            nodes: {
                "Holy Shock": { cost: 1 },
                "Light of Dawn": { cost: 1, requires: ["Holy Shock"] },
                "Infusion of Light": { cost: 1, requires: ["Holy Shock"] },
                // ...допълни
            }
        },
        protection: { max: 31, nodes: { /* ... */ } },
        retribution: { max: 31, nodes: { /* ... */ } },

        // ==== HERO примери (допиши и за lightsmith/templar и др.) ====
        // Ключът трябва да съвпада с data-tree-key или извлеченото от заглавието
        // Пример за Holy / Herald of the Sun
        "holy-herald-of-the-sun": {
            max: 11,
            nodes: {
                "Dawnlight": { cost: 1 },
                "Gleaming Rays": { cost: 1, requires: ["Dawnlight"] },
                "Eternal Flame": { cost: 1, requires: ["Dawnlight"] },
                "Luminosity": { cost: 1, requires: ["Dawnlight"] },
                "Will of the Dawn": { cost: 1, requires: ["Gleaming Rays", "Eternal Flame", "Luminosity"] }, // пример
                "Blessing of An'she": { cost: 1, requires: ["Gleaming Rays"] },
                "Sun Sear": { cost: 1, requires: ["Luminosity"] }
                // ...допълни по реалните зависимости
            }
        },
        // Пример за Holy / Lightsmith
        "holy-lightsmith": {
            max: 11,
            nodes: {
                "Tempered in Light": { cost: 1 },
                "Steel Your Resolve": { cost: 1, requires: ["Tempered in Light"] },
                "Divine Inspiration": { cost: 1, requires: ["Tempered in Light"] },
                // ...
            }
        }
        // add: "protection-templar", "protection-lightsmith", "retribution-herald", "retribution-templar", ...
    };

    // ---------- utils ----------
    const slug = s => (s || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const specFromUrl = () => {
        try { return (location.pathname.split('/').filter(Boolean)[0] || '').toLowerCase(); }
        catch { return ''; }
    };

    const getAFToken = () => document.querySelector("input[name='__RequestVerificationToken']")?.value || null;
    const nodeName = node => node.querySelector('img[alt]')?.alt?.trim() || null;

    const markAllInactive = root => root.querySelectorAll('.node').forEach(n => {
        n.classList.add('inactive'); n.classList.remove('active');
    });

    const applyActive = (root, names) => {
        const set = new Set((names || []).map(s => s.toLowerCase()));
        root.querySelectorAll('.node').forEach(n => {
            const on = set.has((nodeName(n) || '').toLowerCase());
            n.classList.toggle('active', on);
            n.classList.toggle('inactive', !on);
        });
    };

    const getActive = root =>
        Array.from(root.querySelectorAll('.node.active')).map(nodeName).filter(Boolean);

    async function loadFromServer(tree) {
        try {
            const r = await fetch(`/api/talents?tree=${encodeURIComponent(tree)}`, { credentials: 'same-origin' });
            if (!r.ok) throw 0;
            return await r.json();
        } catch { return null; }
    }
    const loadFromLocal = tree => {
        try { return JSON.parse(localStorage.getItem(`talents:${tree}`) || '[]'); } catch { return []; }
    };
    const saveToLocal = (tree, names) => {
        try { localStorage.setItem(`talents:${tree}`, JSON.stringify(names || [])); } catch { }
    };

    const timers = {};
    const debounce = (fn, key, ms) => { clearTimeout(timers[key]); timers[key] = setTimeout(fn, ms || 250); };

    async function save(tree, names) {
        const token = getAFToken();
        try {
            await fetch('/api/talents', {
                method: 'POST',
                credentials: 'same-origin',
                headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'RequestVerificationToken': token } : {}),
                body: JSON.stringify({ tree, nodes: names })
            });
        } catch { /* ignore */ }
        saveToLocal(tree, names);
    }

    // ---------- key resolution ----------
    function keyForStandard(container, fixed) { return fixed; }

    function keyForHero(container) {
        const explicit = container.getAttribute('data-tree-key');
        if (explicit) return explicit.toLowerCase();

        const spec = specFromUrl(); // 'holy'|'protection'|'retribution'
        let title = '';
        const sec = container.closest('section');
        if (sec) {
            const h2 = sec.querySelector('h2');
            if (h2?.textContent) title = h2.textContent.trim();
            else {
                const attrs = Array.from(sec.attributes).map(a => a.name.toLowerCase())
                    .filter(n => !['class', 'style', 'id'].includes(n));
                if (attrs.length) title = attrs.join('-');
            }
        }
        if (!title) title = 'hero';
        return [spec || 'paladin', slug(title)].filter(Boolean).join('-');
    }

    // ---------- validation ----------
    function rulesOf(treeKey) { return TALENT_RULES[treeKey] || { max: null, nodes: {} }; }
    function costOf(treeKey, name) {
        const r = rulesOf(treeKey).nodes[name] || {};
        return Number.isFinite(r.cost) ? r.cost : 1;
    }
    function requiresOf(treeKey, name) {
        const r = rulesOf(treeKey).nodes[name] || {};
        return Array.isArray(r.requires) ? r.requires : [];
    }
    function dependentsOf(treeKey, name) {
        const nodes = rulesOf(treeKey).nodes;
        return Object.keys(nodes).filter(n => (nodes[n].requires || []).includes(name));
    }

    function canActivate(treeKey, name, activeNames, currentTotal) {
        const reqs = requiresOf(treeKey, name);
        const missing = reqs.filter(r => !activeNames.has(r));
        if (missing.length) return { ok: false, reason: 'req', missing };

        const max = rulesOf(treeKey).max;
        const cost = costOf(treeKey, name);
        if (Number.isFinite(max) && currentTotal + cost > max) {
            return { ok: false, reason: 'cap', need: currentTotal + cost - max };
        }
        return { ok: true };
    }

    function cascadeOff(treeKey, toRemove, activeNames) {
        // remove dependents transitively
        const q = [...toRemove];
        const removed = new Set();
        while (q.length) {
            const n = q.shift();
            if (removed.has(n)) continue;
            removed.add(n);
            dependentsOf(treeKey, n).forEach(dep => {
                if (activeNames.has(dep)) q.push(dep);
            });
        }
        return removed;
    }

    // UI feedback
    function flash(node) {
        node.classList.add('shake');
        setTimeout(() => node.classList.remove('shake'), 300);
    }

    // ---------- init per container ----------
    async function initTree(container, treeKey) {
        markAllInactive(container);

        const fromServer = await loadFromServer(treeKey);
        const activeArr = fromServer ?? loadFromLocal(treeKey);
        applyActive(container, activeArr);

        container.addEventListener('click', (e) => {
            const node = e.target.closest('.node');
            if (!node || !container.contains(node)) return;
            e.preventDefault();

            const name = nodeName(node);
            if (!name) return;

            const current = new Set(getActive(container));
            const totalPoints = Array.from(current).reduce((sum, n) => sum + costOf(treeKey, n), 0);

            if (node.classList.contains('inactive')) {
                // trying to activate
                const check = canActivate(treeKey, name, current, totalPoints);
                if (!check.ok) { flash(node); return; }
                node.classList.remove('inactive');
                node.classList.add('active');
            } else {
                // deactivate + cascade dependents off
                const removed = cascadeOff(treeKey, [name], current);
                container.querySelectorAll('.node.active img[alt]').forEach(img => {
                    if (removed.has(img.alt.trim())) {
                        const nd = img.closest('.node');
                        nd?.classList.remove('active');
                        nd?.classList.add('inactive');
                    }
                });
            }

            const names = getActive(container);
            debounce(() => save(treeKey, names), treeKey, 250);
        });
    }

    function boot() {
        // стандартните четири
        document.querySelectorAll('.paladin-tree-container').forEach(el => initTree(el, keyForStandard(el, 'paladin')));
        document.querySelectorAll('.holy-tree-container').forEach(el => initTree(el, keyForStandard(el, 'holy')));
        document.querySelectorAll('.protection-tree-container').forEach(el => initTree(el, keyForStandard(el, 'protection')));
        document.querySelectorAll('.retribution-tree-container').forEach(el => initTree(el, keyForStandard(el, 'retribution')));

        // всички hero дървета
        document.querySelectorAll('.hero-tree-container').forEach(el => initTree(el, keyForHero(el)));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})(window, document);
(function adminEditMode(window, document) {
    'use strict';
    function closestNode(el) {
        return el && (el.classList?.contains('node') ? el : closestNode(el.parentElement));
    }

    function enableEdit(container, treeKey) {
        container.dataset.editMode = "1";
        container.classList.add('is-editing');

        // спираме навигацията
        container.querySelectorAll('.node a').forEach(a => {
            a.addEventListener('click', function (e) {
                if (container.dataset.editMode === "1") e.preventDefault();
            });
        });

        // клик върху нод -> toggle
        container.addEventListener('click', onNodeClick);
        function onNodeClick(e) {
            if (container.dataset.editMode !== "1") return;
            const node = closestNode(e.target);
            if (!node) return;

            // превключване на класовете
            const nowActive = node.classList.toggle('active');
            if (nowActive) node.classList.remove('inactive'); else node.classList.add('inactive');

            // дебаунснато записване на единичен нод (по желание)
            debounce(() => {
                saveToggle(treeKey, node.dataset.id, nowActive);
            }, `admin-toggle:${treeKey}:${node.dataset.id}`, 300);
        }
    }

    async function saveToggle(tree, nodeId, active) {
        try {
            const token = getAFToken();
            await fetch('/api/talents/admin/toggle', {
                method: 'POST',
                credentials: 'same-origin',
                headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'RequestVerificationToken': token } : {}),
                body: JSON.stringify({ tree, nodeId, active })
            });
        } catch { /* ignore */ }
    }

    async function saveAll(container, treeKey) {
        const nodes = Array.from(container.querySelectorAll('.node')).map(n => ({
            id: n.dataset.id,
            active: n.classList.contains('active')
        }));
        const token = getAFToken();
        await fetch('/api/talents/admin/state', {
            method: 'POST',
            credentials: 'same-origin',
            headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'RequestVerificationToken': token } : {}),
            body: JSON.stringify({ tree: treeKey, nodes })
        });
    }

    function wireHeaderControls() {
        document.querySelectorAll('.admin-controls').forEach(ctrl => {
            const treeKey = ctrl.dataset.treeKey;
            // намираме съответния контейнер за това дърво
            const container = document.querySelector(`.${treeKey}-tree-container`)
                || document.querySelector(`.hero-tree-container[data-tree-key="${treeKey}"]`)
                || ctrl.closest('.talent-tree')?.querySelector('.tree-grid');

            const btnEdit = ctrl.querySelector('.js-tree-edit');
            const btnSave = ctrl.querySelector('.js-tree-save');
            const btnCancel = ctrl.querySelector('.js-tree-cancel');

            btnEdit?.addEventListener('click', () => {
                enableEdit(container, treeKey);
                btnEdit.classList.add('d-none');
                btnSave.classList.remove('d-none');
                btnCancel.classList.remove('d-none');
            });

            btnSave?.addEventListener('click', async () => {
                await saveAll(container, treeKey);
                // излизаме от edit режима
                container.dataset.editMode = "0";
                container.classList.remove('is-editing');
                btnEdit.classList.remove('d-none');
                btnSave.classList.add('d-none');
                btnCancel.classList.add('d-none');
            });

            btnCancel?.addEventListener('click', () => {
                // най-семпло: рефреш
                window.location.reload();
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wireHeaderControls);
    } else {
        wireHeaderControls();
    }
})(window, document);
