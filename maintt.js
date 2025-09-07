// ======= Simple client-side password gate =======
const GATE_KEY = "classdir_ok";
// SHA-256("class2025") in hex:
const PWD_HASH = "9d735278cfbdb946834416adfb5aaf6c9d75e0dc5247c5973afbb2c6f72e1304";

async function sha256Hex(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function checkPassword() {
  const input = document.getElementById("pwd");
  const err = document.getElementById("err");
  const val = input.value.trim();
  const hex = await sha256Hex(val);
  if (hex === PWD_HASH) {
    sessionStorage.setItem(GATE_KEY, "1");
    document.getElementById("gate").hidden = true;
    init();
  } else {
    err.textContent = "Incorrect password";
    input.value = "";
    input.focus();
  }
}

document.getElementById("unlock").addEventListener("click", checkPassword);
document.getElementById("pwd").addEventListener("keydown", e => {
  if (e.key === "Enter") checkPassword();
});
document.getElementById("logout").addEventListener("click", () => {
  sessionStorage.removeItem(GATE_KEY);
  location.reload();
});

if (sessionStorage.getItem(GATE_KEY) === "1") {
  document.getElementById("gate").hidden = true;
  init();
} else {
  document.getElementById("gate").hidden = false;
}

// ======= Directory App Logic =======
async function init() {
  const res = await fetch("directory.json");
  const data = await res.json();
  let listEl = document.getElementById("list");
  let searchEl = document.getElementById("q");
  let countEl = document.getElementById("count");
  let azEl = document.getElementById("az");

  // Group people by first letter
  function render(filter = "") {
    listEl.innerHTML = "";
    let shown = 0;
    let grouped = {};
    for (let person of data) {
      if (
        filter &&
        !(
          person.name.toLowerCase().includes(filter) ||
          (person.role && person.role.toLowerCase().includes(filter)) ||
          (person.notes && person.notes.toLowerCase().includes(filter))
        )
      ) {
        continue;
      }
      let letter = person.name[0].toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(person);
      shown++;
    }

    Object.keys(grouped)
      .sort()
      .forEach(letter => {
        let groupDiv = document.createElement("div");
        groupDiv.className = "group";
        groupDiv.id = "letter-" + letter;
        groupDiv.innerHTML = `<h2>${letter}</h2>`;
        for (let p of grouped[letter]) {
          let card = document.createElement("div");
          card.className = "card";
          card.innerHTML = `
            <div>
              <div class="name">${p.name}</div>
              <div class="role">${p.role || ""}</div>
              <div class="role">${p.notes || ""}</div>
            </div>
            <div class="actions">
              ${p.email ? `<a href="mailto:${p.email}">📧</a>` : ""}
              ${p.phone ? `<a href="tel:${p.phone}">📞</a>` : ""}
            </div>
          `;
          groupDiv.appendChild(card);
        }
        listEl.appendChild(groupDiv);
      });

    countEl.textContent = shown;
  }

  searchEl.addEventListener("input", () => {
    render(searchEl.value.trim().toLowerCase());
  });

  // A–Z nav
  azEl.innerHTML = "";
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(letter => {
    let span = document.createElement("span");
    span.textContent = letter;
    span.addEventListener("click", () => {
      let target = document.getElementById("letter-" + letter);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
    azEl.appendChild(span);
  });

  render();
}
