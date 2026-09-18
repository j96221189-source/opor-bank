const KEY = "vtcu.demo.v4";
let editing = false;
const MAX_BAL = 1000000;

function requireAuth() {
  if (sessionStorage.getItem("oporBankUser") !== "sandra24") {
    sessionStorage.removeItem("oporBankUser");
    location.href = "./index.html";
    return false;
  }
  return true;
}

function money(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function clampBal(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return 0;
  return Math.min(MAX_BAL, Math.max(-MAX_BAL, Math.round(v * 100) / 100));
}

function defaultState() {
  return {
    memberName: "Sandra Bullock",
    accounts: [
      { id: "chk", name: "Checking", kind: "x1842", bal: 1000000 },
      { id: "sav", name: "Savings", kind: "x9031", bal: 877000 },
      { id: "cc", name: "Credit card", kind: "x4419", bal: 0 },
    ],
    activity: [
      { date: "Nov 25", fullDate: "November 25, 2025", desc: "YOUR TOWN CINEMA", acct: "Checking", amt: -7.5, tags: "Entertainment", acctNo: "Checking #1842 YOUR TOWN ST" },
      { date: "Nov 25", fullDate: "November 25, 2025", desc: "GEORGES BBQ & PUB", acct: "Checking", amt: -37.25, tags: "Food", acctNo: "Checking #1842 YOUR TOWN ST" },
      { date: "Nov 25", fullDate: "November 25, 2025", desc: "ATM DEPOSIT", acct: "Savings", amt: 37.25, tags: "Deposit", acctNo: "Savings #9031 YOUR TOWN ST" },
      { date: "Nov 25", fullDate: "November 25, 2025", desc: "YOUR TOWN UTILITIES", acct: "Checking", amt: -76.46, tags: "Bills", acctNo: "Checking #1842 YOUR TOWN ST" },
      { date: "Nov 25", fullDate: "November 25, 2025", desc: "EL GRAN RESTAURANTE", acct: "Checking", amt: -13.98, tags: "Entertainment, Food", acctNo: "Checking #1842 YOUR TOWN ST" },
      { date: "Nov 24", fullDate: "November 24, 2025", desc: "LE PETITE CAFE", acct: "Checking", amt: -2.61, tags: "Food", acctNo: "Checking #1842 YOUR TOWN ST" },
      { date: "Nov 22", fullDate: "November 22, 2025", desc: "PAYROLL", acct: "Checking", amt: 1860, tags: "Income", acctNo: "Checking #1842 YOUR TOWN ST" },
      { date: "Nov 20", fullDate: "November 20, 2025", desc: "TOWN MARKET", acct: "Checking", amt: -54.2, tags: "Groceries", acctNo: "Checking #1842 YOUR TOWN ST" },
    ],
  };
}

function load() {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return {
        ...base,
        ...saved,
        memberName: saved.memberName || base.memberName,
        accounts: Array.isArray(saved.accounts) && saved.accounts.length ? saved.accounts : base.accounts,
        activity: Array.isArray(saved.activity) && saved.activity.length ? saved.activity : base.activity,
      };
    }
  } catch {}
  return base;
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function firstName(full) {
  return String(full || "").trim().split(/\s+/)[0] || "there";
}

function greet() {
  const state = load();
  const g = document.getElementById("greet");
  if (g) g.textContent = `Hi, ${firstName(state.memberName)}`;
  const av = document.getElementById("avatar");
  if (av) av.textContent = (firstName(state.memberName)[0] || "V").toUpperCase();
}

function accountCard(a) {
  const el = document.createElement("article");
  el.className = "acct-card";
  const top = document.createElement("div");
  top.className = "acct-top";
  const left = document.createElement("div");
  const name = document.createElement("p");
  name.className = "acct-name";
  name.textContent = a.name;
  const kind = document.createElement("p");
  kind.className = "acct-mask";
  kind.textContent = a.kind;
  left.append(name, kind);
  const right = document.createElement("div");
  const shown = document.createElement("p");
  shown.className = "bal bal-show";
  shown.textContent = money(a.bal);
  const bal = document.createElement("input");
  bal.className = "bal-input edit-only";
  bal.type = "number";
  bal.step = "0.01";
  bal.min = String(-MAX_BAL);
  bal.max = String(MAX_BAL);
  bal.value = String(a.bal);
  bal.setAttribute("aria-label", `${a.name} balance`);
  bal.addEventListener("change", () => {
    const current = load();
    const acct = current.accounts.find((x) => x.id === a.id);
    acct.bal = clampBal(bal.value);
    save(current);
    renderDashboard();
  });
  const avail = document.createElement("p");
  avail.className = "avail";
  avail.textContent = a.id === "cc" ? "Current" : "Available";
  right.append(shown, bal, avail);
  top.append(left, right);
  el.append(top);
  return el;
}

function renderDashboard() {
  if (!requireAuth()) return;
  greet();
  const state = load();
  const cash = state.accounts.filter((a) => a.id !== "cc").reduce((s, a) => s + a.bal, 0);
  const kpis = document.getElementById("kpis");
  kpis.replaceChildren();
  const el = document.createElement("article");
  el.className = "kpi";
  const span = document.createElement("span");
  span.textContent = "Total available";
  const strong = document.createElement("strong");
  strong.textContent = money(cash);
  el.append(span, strong);
  kpis.appendChild(el);

  const deposits = state.accounts.filter((x) => x.id !== "cc");
  const tiles = document.getElementById("tiles");
  tiles.replaceChildren();
  for (const a of deposits) tiles.appendChild(accountCard(a));
  const creditTiles = document.getElementById("creditTiles");
  creditTiles.replaceChildren();
  for (const a of state.accounts.filter((x) => x.id === "cc")) creditTiles.appendChild(accountCard(a));

  const dots = document.getElementById("dots");
  if (dots) {
    dots.replaceChildren();
    deposits.forEach((a, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = i === 0 ? "dot on" : "dot";
      dot.setAttribute("aria-label", a.name);
      dot.addEventListener("click", () => {
        const card = tiles.children[i];
        if (card) card.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
      });
      dots.appendChild(dot);
    });
    if (!tiles.dataset.dotsBound) {
      tiles.dataset.dotsBound = "1";
      tiles.addEventListener("scroll", () => {
        const i = Math.round(tiles.scrollLeft / Math.max(tiles.clientWidth, 1));
        [...dots.children].forEach((d, n) => d.classList.toggle("on", n === i));
      });
    }
  }

  const viewAll = document.getElementById("viewAll");
  if (viewAll && !viewAll.dataset.bound) {
    viewAll.dataset.bound = "1";
    viewAll.addEventListener("click", () => {
      const open = tiles.classList.toggle("show-all");
      viewAll.textContent = open ? "View less" : "View all";
    });
  }

  const body = document.getElementById("activityBody");
  const limit = state.showAllTx ? state.activity.length : 6;
  const shown = state.activity.slice(0, limit);
  body.replaceChildren();
  shown.forEach((row, idx) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "tx-row";
    const left = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = row.desc;
    const meta = document.createElement("span");
    meta.textContent = `${row.date}, ${row.acct}`;
    left.append(title, meta);
    const amt = document.createElement("em");
    amt.textContent = `${row.amt > 0 ? "+" : ""}${money(row.amt)}`;
    item.append(left, amt);
    item.addEventListener("click", () => openDetail(idx));
    body.appendChild(item);
  });

  const seeMore = document.getElementById("seeMore");
  if (seeMore) {
    seeMore.hidden = state.showAllTx || state.activity.length <= 6;
    if (!seeMore.dataset.bound) {
      seeMore.dataset.bound = "1";
      seeMore.addEventListener("click", () => {
        const current = load();
        current.showAllTx = true;
        save(current);
        renderDashboard();
      });
    }
  }

  const menuBtn = document.getElementById("menuBtn");
  const menuSheet = document.getElementById("menuSheet");
  if (menuBtn && menuSheet && !menuBtn.dataset.bound) {
    menuBtn.dataset.bound = "1";
    menuBtn.addEventListener("click", () => {
      menuSheet.hidden = !menuSheet.hidden;
    });
  }
  const signOut = document.getElementById("signOut");
  if (signOut && !signOut.dataset.bound) {
    signOut.dataset.bound = "1";
    signOut.addEventListener("click", () => sessionStorage.removeItem("oporBankUser"));
  }

  const backTx = document.getElementById("backTx");
  if (backTx && !backTx.dataset.bound) {
    backTx.dataset.bound = "1";
    backTx.addEventListener("click", closeDetail);
  }

  const nameInput = document.getElementById("memberName");
  if (nameInput && !nameInput.dataset.bound) {
    nameInput.value = state.memberName || "";
    nameInput.dataset.bound = "1";
    nameInput.addEventListener("input", () => {
      const current = load();
      current.memberName = nameInput.value;
      save(current);
      renderDashboard();
    });
  } else if (nameInput && document.activeElement !== nameInput) {
    nameInput.value = state.memberName || "";
  }

  const toggle = document.getElementById("editToggle");
  if (toggle && !toggle.dataset.bound) {
    toggle.dataset.bound = "1";
    toggle.addEventListener("click", () => {
      editing = !editing;
      document.body.classList.toggle("is-editing", editing);
      toggle.textContent = editing ? "done" : "·";
    });
  }
  document.body.classList.toggle("is-editing", editing);
  if (toggle) toggle.textContent = editing ? "done" : "·";
}

function rowLine(label, value) {
  const row = document.createElement("div");
  row.className = "detail-row";
  const l = document.createElement("span");
  l.textContent = label;
  const v = document.createElement("strong");
  v.textContent = value;
  row.append(l, v);
  return row;
}

function actionLine(icon, label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "action-row";
  const l = document.createElement("span");
  l.textContent = icon;
  const v = document.createElement("b");
  v.textContent = label;
  btn.append(l, v);
  if (onClick) btn.addEventListener("click", onClick);
  return btn;
}

function openDetail(idx) {
  const state = load();
  const row = state.activity[idx];
  const home = document.getElementById("homeView");
  const detail = document.getElementById("detailView");
  const box = document.getElementById("detailBody");
  if (!row || !home || !detail || !box) return;
  home.hidden = true;
  detail.hidden = false;
  box.replaceChildren();

  const hero = document.createElement("div");
  hero.className = "detail-hero";
  const h = document.createElement("h1");
  h.textContent = row.desc;
  const amt = document.createElement("p");
  amt.className = "amt";
  amt.textContent = `${row.amt > 0 ? "+" : ""}${money(row.amt)}`;
  hero.append(h, amt);

  const list = document.createElement("div");
  list.className = "detail-list";
  list.append(rowLine("Date", row.fullDate || row.date));
  list.append(actionLine("🏷", row.tags || "Tag"));
  const noteBtn = actionLine("✎", row.note || "Add notes");
  noteBtn.addEventListener("click", () => {
    const next = window.prompt("Note", row.note || "");
    if (next == null) return;
    const current = load();
    current.activity[idx].note = next;
    save(current);
    openDetail(idx);
  });
  list.append(noteBtn);
  const attach = actionLine("🖼", row.imageName || "Attach image");
  attach.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const current = load();
      current.activity[idx].imageName = file.name;
      save(current);
      openDetail(idx);
    });
    input.click();
  });
  list.append(attach);

  const detailsHead = document.createElement("h3");
  detailsHead.textContent = "Details";
  list.appendChild(detailsHead);

  const similarHead = document.createElement("h3");
  similarHead.textContent = "Similar transactions";
  list.appendChild(similarHead);
  const extras = [
    { date: "Feb 4, 2020", amt: -104.8 },
    { date: "Nov 2, 2019", amt: -9.54 },
  ];
  for (const s of extras) {
    list.appendChild(rowLine(s.date, money(s.amt)));
  }
  const foot = document.createElement("p");
  foot.className = "acct-foot";
  foot.textContent = row.acctNo || row.acct;
  list.appendChild(foot);

  box.append(hero, list);
}

function closeDetail() {
  const home = document.getElementById("homeView");
  const detail = document.getElementById("detailView");
  if (home) home.hidden = false;
  if (detail) detail.hidden = true;
}

function renderTransfer() {
  if (!requireAuth()) return;
  const state = load();
  const from = document.getElementById("from");
  const to = document.getElementById("to");
  from.replaceChildren();
  to.replaceChildren();
  for (const a of state.accounts) {
    const o1 = document.createElement("option");
    o1.value = a.id;
    o1.textContent = `${a.name} (${money(a.bal)})`;
    from.appendChild(o1);
    to.appendChild(o1.cloneNode(true));
  }
  if (state.accounts[1]) to.value = state.accounts[1].id;

  if (!from.form.dataset.bound) {
    from.form.dataset.bound = "1";
    document.getElementById("transferForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const current = load();
      const amt = Number(document.getElementById("amount").value);
      const fid = from.value;
      const tid = to.value;
      if (!amt || fid === tid) return;
      const src = current.accounts.find((a) => a.id === fid);
      const dst = current.accounts.find((a) => a.id === tid);
      const room = MAX_BAL - dst.bal;
      const move = Math.min(amt, Math.max(0, room));
      if (!move) {
        document.getElementById("xferNote").hidden = false;
        document.getElementById("xferNote").textContent = "Destination is at the $1,000,000 maximum.";
        return;
      }
      src.bal = clampBal(src.bal - move);
      dst.bal = clampBal(dst.bal + move);
      current.activity.unshift({
        date: "Sep 17",
        fullDate: "September 17, 2026",
        desc: `TRANSFER TO ${dst.name.toUpperCase()}`,
        acct: src.name,
        amt: -move,
        tags: "Transfer",
        acctNo: `${src.name} ${src.kind}`,
      });
      save(current);
      document.getElementById("xferNote").hidden = false;
      renderTransfer();
    });
  }
}
