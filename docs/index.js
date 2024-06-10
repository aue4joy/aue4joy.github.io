const e = el => document.querySelector(el);
const es = el => [...document.querySelectorAll(el)];
const ess = el => e(el).style;
const i2c = i => String.fromCharCode(97 + i);

const numOpinion = () => es("opinion").length;

let inClick = false;

function DomVerseHover() {
  if (inClick || !numOpinion()) {
    return;
  }
  DomReset();
  es("verse").forEach(el => el != this && el.classList.add("dim"));
  const opinions = es("opinion");
  const toDim = opinions.filter(
    el =>
      !el.querySelector(":last-child").innerText.includes(this.dataset.cite),
  );
  toDim.forEach(el => el.classList.add("dim"));
  e("h2.opinions").innerHTML = `Opinions (${opinions.length - toDim.length})`;
}

function DomOpinionHover() {
  if (inClick) {
    return;
  }
  DomReset();
  es("opinion").forEach(el => el != this && el.classList.add("dim"));
  es("verse").forEach(
    (el, i) => !this.dataset.cites.includes(i2c(i)) && el.classList.add("dim"),
  );
}

function DomClick(e) {
  if (!numOpinion()) {
    return;
  }
  if (!(inClick = !inClick)) {
    DomReset();
  } else {
    e.currentTarget.classList.add("underlined");
    es("verse.dim, opinion.dim").forEach(el =>
      el.classList.add("unselectable"),
    );
  }
  e.stopPropagation();
}

function DomReset() {
  if (inClick) {
    return;
  }
  if (e("h2.opinions")) {
    e("h2.opinions").innerHTML = `Opinions (${numOpinion()})`;
  }
  es("verse, opinion").forEach(el =>
    el.classList.remove("dim", "underlined", "unselectable"),
  );
}

function FirstLoad() {
  if (!numOpinion()) {
    return;
  }
  es("verse").forEach(l => {
    l.addEventListener("mouseover", DomVerseHover);
    l.addEventListener("click", DomVerseHover);
    l.addEventListener("click", DomClick);
    l.addEventListener("mouseout", DomReset);
    l.style.cursor = "pointer";
  });
  es("opinion").forEach(l => {
    l.addEventListener("mouseover", DomOpinionHover);
    l.addEventListener("mouseout", DomReset);
    l.addEventListener("click", DomOpinionHover);
    l.addEventListener("click", DomClick);
  });
  document.body.addEventListener("click", () => {
    if (window.getSelection().type == "Range") {
      return;
    }
    inClick = false;
    DomReset();
  });
}

async function DomChooseLanguage(select) {
  const lang = select.value;
  const html = await (await fetch(`/translations/verses-${lang}.html`)).text();
  e("aue").innerHTML = html;
  const rtl = lang === "ara";
  e("aue").dir = rtl ? "rtl" : "ltr";
}
