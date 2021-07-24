import { existsSync, walkSync } from "https://deno.land/std@0.99.0/fs/mod.ts";

const readJson = (path: string) => JSON.parse(Deno.readTextFileSync(path));
const woSp = (text: string) => text.replaceAll(" ", "");
const n2c = (n: number) => String.fromCharCode(n + 97);
const c2n = (c: string) => c.charCodeAt(0) - 97;

const { aue }: { aue: string[] } = readJson("aue.json");
const contributors = [...Deno.readDirSync("contributions")].map(e => e.name.split(".")[0]);
{
  const first = "Patrick Bowen";
  contributors.sort((x, y) => (x == first ? -1 : y == first ? 1 : 0));
}
const defaultKeywords = "Aue,religion,atheist";

//Delete directories

const rmdirs = (dir: string) =>
  [...Deno.readDirSync(dir)]
    .filter(e => e.isDirectory && e.name != "cards")
    .forEach(e => Deno.removeSync(`${dir}/${e.name}`, { recursive: true }));
rmdirs("docs/");
rmdirs("fragments/");

//Create empty directories

const mkdir = (dir: string) => existsSync(dir) || Deno.mkdirSync(dir);
["fragments/articles", "fragments/contributions", "docs/wallpaper"].forEach(mkdir);

//Build verses.html fragment

Deno.writeTextFileSync(
  "fragments/verses.html",
  aue
    .map((v, i) => {
      const cite = n2c(i);
      return `<verse data-cite="${cite}"><cite>${cite}</cite> ${v}</verse>\n`;
    })
    .join("")
);

//Build contributors.html fragment

Deno.writeTextFileSync(
  "fragments/contributors.html",
  `<select id="contributor" onchange="DomContributor(this)">
  <option></option>
  ${contributors
    .map(c => {
      return `<option value="${woSp(c)}">${c}</option>`;
    })
    .join("")}</select>`
);

//Build articles.html fragment

const articles = [...walkSync("articles", { includeDirs: false })].map(({ name, path }) => {
  [name] = name.split(".");
  const [_, author] = path.split("/");
  const authorId = woSp(author);
  const content = Deno.readTextFileSync(path);
  const title = content.match(/<h1>(.+?)<\/h1>/)?.[1] ?? "Unknown article";
  const firstPara = content.match(/<p>((?:.|\s)+?)<\/p>/m)?.[1].replaceAll(/<\/?[^>]+>/g, "") ?? "";
  const byLine = content.match(/<p class="by-line">((?:.|\s)+?)<\/p>/)?.[1] ?? "";
  const date = Date.parse(byLine.match(/\d+-\d+-\d+/)?.[0] ?? "");
  const keywords = content.match(/<p class="keywords">((?:.|\s)+?)<\/p>/)?.[1] ?? "";
  return { name, title, path, byLine, date, author, authorId, firstPara, keywords };
});
articles.sort(({ date: b }, { date: a }) => a - b);

function makeArticlesFragment(forAuthor?: string) {
  return articles
    .filter(a => !forAuthor || a.authorId == forAuthor)
    .map(({ name, title, byLine, authorId, firstPara }) => {
      const maxLen = 200;
      firstPara = firstPara.length > maxLen ? firstPara.substr(0, maxLen) + "…" : firstPara;
      return `
<a class="article-link" href="/${authorId}/${name}">
<h3>${title}</h3>
<i>${byLine}</i>
<p>${firstPara}</p>
</a>`;
    });
}

Deno.writeTextFileSync("fragments/articles.html", makeArticlesFragment().join("\n"));

//Build contributor fragments

function materialHtml(title: string, urls: string | string[], comment: string) {
  const punc = title.endsWith("?") ? "" : ".";
  const titleHtml = Array.isArray(urls)
    ? `<i>${title}</i> (${urls.map((u, i) => `<a href="${u}">${i + 1}</a>`).join(", ")})`
    : `<a href="${urls}"><i>${title}</i></a>`;
  return `<material>${titleHtml}${punc} ${comment}</material>`;
}

contributors.forEach(c => {
  const {
    opinions,
    verseDescs,
    materials,
    charities,
  }: {
    opinions: [string, string, string][];
    verseDescs: [string, string][];
    materials: [string, string | string[], string];
    charities: string[];
  } = readJson(`contributions/${c}.json`);
  c = woSp(c);
  const opinionEls = opinions.map(
    ([name, body, cites]) =>
      `<opinion data-cites="${cites}"><i>${name}.</i> ${body} <cite>${cites}</cite></opinion>`
  );
  const articleEls = makeArticlesFragment(c);
  const descEls = verseDescs.map(([cite, body]) => {
    const verse = aue[c2n(cite)];
    body = body.split("\n").join("</p><p>");
    return `<description><cite>${cite}</cite> <b>${verse}</b> <p>${body}</p></description>`;
  });
  const materialEls = materials.map(([title, urls, body]) => materialHtml(title, urls, body));
  let html = "";
  if (opinionEls.length) {
    const els = opinionEls.join("\n");
    html += `\n<column class="opinions"><h2 class="opinions">Opinions</h2><opinions>${els}</opinions></column>`;
  }
  if (articleEls.length) {
    const els = articleEls.join("\n");
    html += `\n<column class="wide articles"><h2>Articles</h2>${els}</column>`;
  }
  if (descEls.length) {
    const els = descEls.join("\n");
    html += `\n<column class="descs"><h2>Verse Descriptions</h2><descs>${els}</descs></column>`;
  }
  if (materialEls.length) {
    const els = materialEls.join("\n");
    html += `\n<column class="thin materials"><h2>Materials</h2><materials>${els}</materials></column>`;
  }
  Deno.writeTextFileSync(`fragments/contributions/${c}-inner.html`, html);
  Deno.writeTextFileSync(
    `fragments/contributions/${c}.html`,
    `{{header}}{{core}}{{${c}-inner}}{{footer}}`
  );
});

//Build article fragments

articles.forEach(({ name, title, author, authorId }) =>
  Deno.writeTextFileSync(
    `fragments/articles/${authorId}---${name}.html`,
    `{{header}}{{article}}${Deno.readTextFileSync(`articles/${author}/${name}.html`)}{{footer}}`
  )
);

//Collect fragments

const targets = [...walkSync("fragments")]
  .filter(e => e.isFile)
  .map(e => [e.name.split(".")[0], Deno.readTextFileSync(e.path)])
  .map(([name, text]) => ({
    name,
    text,
    deps: [] as string[],
  }));

//Find dependencies

targets.forEach(t => (t.deps = [...new Set([...t.text.matchAll(/{{(.+?)}}/g)].map(g => g[1]))]));

//Resolve dependencies

let unresolved: typeof targets;
while ((unresolved = targets.filter(t => t.deps.length)).length) {
  unresolved.forEach(u => {
    const resolvable = targets.find(t => t.name == u.deps[0] && !t.deps.length);
    if (!resolvable) {
      return;
    }
    u.text = u.text.replaceAll(`{{${resolvable.name}}}`, resolvable.text);
    u.deps.shift();
  });
}

const target = (name: string) => targets.find(t => t.name == name)?.text ?? "";

//Generate index.html

Deno.writeTextFileSync(
  "docs/index.html",
  target("index")
    .replace("[[title]]", "Aue - a religion")
    .replace("[[desc]]", "A modern atheistic religion, focusing on joy & woe.")
    .replace("[[author-name]]", "Patrick Bowen")
    .replace("[[keywords]]", defaultKeywords)
);

//Generate contributor endpoints

contributors.forEach(contributor => {
  const title = `${contributor} - Aue - a religion`;
  const desc = `${contributor} gives their opinions, descriptions, materials, and articles on Aue - a modern religion`;
  const id = woSp(contributor);
  const dir = `docs/${id}`;
  mkdir(dir);
  Deno.writeTextFileSync(
    `${dir}/index.html`,
    target(id)
      .replace("[[title]]", title)
      .replace("[[desc]]", desc)
      .replace("[[author-name]]", contributor)
      .replace(
        "[[keywords]]",
        `${defaultKeywords},adherent,articles,materials,opinions`
      )
  );
});

//Generate article endpoints

articles.forEach(({ name, author, authorId, title, firstPara, keywords }) => {
  const dir = `docs/${authorId}`;
  const desc = `${firstPara.replace(/\s+/g, " ").trim().substr(0, 150)}…`;
  mkdir(dir);
  mkdir(`${dir}/${name}`);
  const content = target(`${authorId}---${name}`);
  Deno.writeTextFileSync(
    `${dir}/${name}/index.html`,
    content
      .replace("[[title]]", `${title} - ${author}`)
      .replace("[[desc]]", desc)
      .replace("[[author-name]]", author)
      .replace("[[keywords]]", `${defaultKeywords},${keywords}`)
  );
});

//Generate cards and wallpaper endpoint

Deno.writeTextFileSync("docs/cards/index.html", target("cards"));
Deno.writeTextFileSync("docs/wallpaper/index.html", target("wallpaper"));
