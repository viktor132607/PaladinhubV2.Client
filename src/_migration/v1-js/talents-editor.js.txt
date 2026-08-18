(function () {
    function closest(el, sel) {
        while (el && el.nodeType === 1) {
            if (el.matches(sel)) return el;
            el = el.parentElement;
        }
        return null;
    }

    function setEditing(container, on) {
        container.classList.toggle("is-editing", !!on);
        container.querySelectorAll(".node a").forEach(a => {
            if (on) {
                a.setAttribute("data-href", a.getAttribute("href") || "#");
                a.setAttribute("href", "#");
            } else if (a.hasAttribute("data-href")) {
                a.setAttribute("href", a.getAttribute("data-href"));
            }
        });
    }

    function collectState(container) {
        return Array.from(container.querySelectorAll(".node")).map(n => ({
            id: n.getAttribute("data-id"),
            active: n.classList.contains("active")
        }));
    }

    function restoreSnapshot(container, snap) {
        const byId = new Map(snap.map(x => [x.id, x.active]));
        container.querySelectorAll(".node").forEach(n => {
            const id = n.getAttribute("data-id");
            const active = byId.get(id);
            n.classList.toggle("active", !!active);
            n.classList.toggle("inactive", !active);
        });
    }

    function initTree(section) {
        const controls = section.querySelector(".admin-controls");
        if (!controls) return;

        const key = controls.getAttribute("data-tree-key");
        const container = section.querySelector(`[data-tree-key="${key}"]`);
        if (!container) return;

        const btnEdit = controls.querySelector(".js-tree-edit");
        const btnSave = controls.querySelector(".js-tree-save");
        const btnCancel = controls.querySelector(".js-tree-cancel");

        let snapshot = null;

        btnEdit?.addEventListener("click", function () {
            snapshot = collectState(container);
            setEditing(container, true);
            btnEdit.classList.add("d-none");
            btnSave.classList.remove("d-none");
            btnCancel.classList.remove("d-none");
        });

        btnCancel?.addEventListener("click", function () {
            if (snapshot) restoreSnapshot(container, snapshot);
            setEditing(container, false);
            btnEdit.classList.remove("d-none");
            btnSave.classList.add("d-none");
            btnCancel.classList.add("d-none");
        });

        btnSave?.addEventListener("click", async function () {
            const payload = { key, nodes: collectState(container) };
            await fetch(`/api/talents/${encodeURIComponent(key)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            setEditing(container, false);
            btnEdit.classList.remove("d-none");
            btnSave.classList.add("d-none");
            btnCancel.classList.add("d-none");
        });

        container.addEventListener("click", function (e) {
            if (!container.classList.contains("is-editing")) return;
            const node = closest(e.target, ".node");
            if (!node) return;

            e.preventDefault();
            e.stopPropagation();

            const wasActive = node.classList.contains("active");
            node.classList.toggle("active", !wasActive);
            node.classList.toggle("inactive", wasActive);
        });
    }

    function initAll() {
        document.querySelectorAll("section").forEach(initTree);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAll);
    } else {
        initAll();
    }
})();
