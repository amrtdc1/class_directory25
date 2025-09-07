// ========= Config =========
const GATE_KEY = "classdir_ok";
// SHA-256("class2025") in hex:
const PWD_HASH = "9d735278cfbdb946834416adfb5aaf6c9d75e0dc5247c5973afbb2c6f72e1304";

// ========= Utilities =========
async function sha256Hex(str) {
  if (!("crypto" in window) || !crypto.subtle) {
    throw new Error(
      "Web Crypto unavailable. Run over HTTPS or localhost (not file://)."
    );
  }
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function show(el, flag) {
  if (el) el.hidden = !flag;
}

function sanitize(s) {
  return (s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ========= App =========
document.addEventListener("DOMContentLoaded", () => {
  const gate = document.getElementById("gate");
  const pwdInput = document.getElementById("pwd");
  const unlockBtn = document.getElementById("unlock");
  const err = document.getElementById("err");
  const logoutBtn = document.getElementById("logout");
  const listEl = document.getElementById("list");
  const searchEl = document.getElementById("q");
  const countEl = document.getElementById("count");
  const azEl = document.getElementById("az");

  if (!gate || !unlockBtn) {
    console.error("Gate or unlock button not found. Check index.html IDs.");
    return;
  }

  // Gate visibility on load
  show(gate, sessionStorage.getItem(GATE_KEY) !== "1");

  async function checkPassword() {
    err.textContent = "";
    try {
      const hex = await sha256Hex((pwdInput.value || "").trim());
      if (hex === PWD_HASH) {
        sessionStorage.setItem(GATE_KEY, "1");
        show(gate, false);
        init();
      } else {
        err.textContent = "Incorrect password";
        pwdInput.value = "";
        pwdInput.focus();
      }
    } catch (e) {
      console.error(e);
      err.textContent =
        "Password check needs HTTPS/localhost. Host on GitHub Pages/Netlify or use a local server.";
    }
  }

  unlockBtn.addEventListener("click", checkPassword);
  pwdInput.addEventListener("keydown", e => e.key === "Enter" && checkPassword());
  logoutBtn?.addEventListener("click", () => {
    sessionStorage.removeItem(GATE_KEY);
    location.reload();
  });

  if (sessionStorage.getItem(GATE_KEY) === "1") {
    show(gate, false);
    init();
  }

  async function init() {
    try {
      const res = await fetch("directory.json");
      const data = await res.json();

      function render(filter = "") {
        listEl.innerHTML = "";
        let shown = 0;
        const grouped = {};
        for (const p of data) {
          const hit =
            !filter ||
            [p.name, p.role, p.notes, p.email, p.phone]
              .filter(Boolean)
              .some(v => v.toLowerCase().includes(filter));
          if (!hit) continue;
          const letter = (p.name?.[0] || "#").toUpperCase();
          (grouped[letter] ||= []).push(p);
          shown++;
        }
        Object.keys(grouped)
          .sort()
          .forEach(letter => {
            const groupDiv = document.createElement("section");
            groupDiv.className = "group";
            groupDiv.id = "letter-" + letter;
            groupDiv.innerHTML = `<h2>${letter}</h2>`;
            for (const p of grouped[letter]) {
              const card = document.createElement("article");
              card.className = "card";
              const tel = p.phone ? `tel:${p.phone.replace(/[^0-9+]/g, "")}` : "";
              card.innerHTML = `
                <div>
                  <div class="name">${sanitize(p.name)}</div>
                  <div class="role">${sanitize(p.role || "")}</div>
                  <div class="role">${sanitize(p.notes || "")}</div>
                </div>
                <div class="actions">
                  ${p.email ? `<a href="mailto:${sanitize(p.email)}"><button>Email</button></a>` : ""}
                  ${p.phone ? `<a href="${tel}"><button>Call</button></a>` : ""}
                </div>`;
              groupDiv.appendChild(card);
            }
            listEl.appendChild(groupDiv);
          });
        if (countEl) countEl.textContent = shown;
      }

      // Search
      searchEl?.addEventListener("input", () =>
        render(searchEl.value.trim().toLowerCase())
      );

      // A–Z nav
      azEl.innerHTML = "";
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(letter => {
        const span = document.createElement("span");
        span.textContent = letter;
        span.addEventListener("click", () => {
          const target = document.getElementById("letter-" + letter);
          if (target) target.scrollIntoView({ behavior: "smooth" });
        });
        azEl.appendChild(span);
      });

      render();
    } catch (e) {
      console.error("Failed to init directory:", e);
      err.textContent = "Could not load directory.json.";
      show(gate, true);
    }
  }
});
