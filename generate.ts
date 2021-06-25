import { existsSync, walkSync } from "https://deno.land/std@0.99.0/fs/mod.ts";

const readJson = (path: string) => JSON.parse(Deno.readTextFileSync(path));
const woSp = (text: string) => text.replaceAll(" ", "");
const n2c = (n: number) => String.fromCharCode(n + 97);
const c2n = (c: string) => c.charCodeAt(0) - 97;

const { aue }: { aue: string[] } = readJson("aue.json");
const contributors = [...Deno.readDirSync("contributions")]
  .map((e) => e.name.split(".")[0]);
{
  const first = "Patrick Bowen";
  contributors.sort((x, y) => x == first ? -1 : y == first ? 1 : 0);
}

//Delete directories

const rmdirs = (dir: string) =>
  [...Deno.readDirSync(dir)]
    .filter((e) => e.isDirectory && e.name != "ads")
    .forEach((e) => Deno.removeSync(`${dir}/${e.name}`, { recursive: true }));
rmdirs("docs/");
rmdirs("fragments/");

//Create empty directories

const mkdir = (dir: string) => existsSync(dir) || Deno.mkdirSync(dir);
["fragments/articles", "fragments/contributions", "docs/wallpaper"].forEach(mkdir);

//Build verses.html fragment

Deno.writeTextFileSync(
  "fragments/verses.html",
  aue.map((v, i) => {
    const cite = n2c(i);
    return `<verse data-cite="${cite}"><cite>${cite}</cite> ${v}</verse>\n`;
  }).join(""),
);

//Build contributors.html fragment

Deno.writeTextFileSync(
  "fragments/contributors.html",
  `<select id="contributor" onchange="DomContributor(this)">
  <option></option>
  ${
    contributors.map((c) => {
      return `<option value="${woSp(c)}">${c}</option>`;
    }).join("")
  }</select>`,
);

//Build contributor fragments

function materialHtml(title: string, urls: string | string[], comment: string) {
  const punc = title.endsWith("?") ? "" : ".";
  const titleHtml = Array.isArray(urls)
    ? `<i>${title}</i> (${
      urls.map((u, i) => `<a href="${u}">${i + 1}</a>`).join(", ")
    })`
    : `<a href="${urls}"><i>${title}</i></a>`;
  return `<material>${titleHtml}${punc} ${comment}</material>`;
}

contributors.forEach((c) => {
  const { opinions, verseDescs, materials, charities }: {
    opinions: [string, string, string][];
    verseDescs: [string, string][];
    materials: [string, string | string[], string];
    charities: string[];
  } = readJson(`contributions/${c}.json`);
  c = woSp(c);
  const opinionEls = opinions.map(([name, body, cites]) =>
    `<opinion data-cites="${cites}"><i>${name}.</i> ${body} <cite>${cites}</cite></opinion>`
  );
  const descEls = verseDescs.map(([cite, body]) => {
    const verse = aue[c2n(cite)];
    return `<description><cite>${cite}</cite> <b>${verse}</b> <p>${
      body.split("\n").join("</p><p>")
    }</p></description>`;
  });
  const materialEls = materials.map(([title, urls, body]) =>
    materialHtml(title, urls, body)
  );
  let html = "";
  if (opinionEls.length) {
    html +=
      `<column class="opinions"><h2 class="opinions">Opinions</h2><opinions>${
        opinionEls.join("")
      }</opinions></column>`;
  }
  if (descEls.length) {
    html += `<column class="descs"><h2>Verse Descriptions</h2><descs>${
      descEls.join("")
    }</descs></column>`;
  }
  if (materialEls.length) {
    html += `<column class="thin materials"><h2>Materials</h2><materials>${
      materialEls.join("")
    }</materials></column>`;
  }
  Deno.writeTextFileSync(
    `fragments/contributions/${c}-inner.html`,
    html,
  );
  Deno.writeTextFileSync(
    `fragments/contributions/${c}.html`,
    `{{header}}{{homepage}}{{${c}-inner}}{{footer}}`,
  );
});

//Build article fragments

const articles = [...walkSync("articles", { includeDirs: false })]
  .map(({ name, path }) => {
    const [title] = name.split(".");
    const [_, author] = path.split("/");
    const authorId = woSp(author);
    return { title, path, author, authorId };
  });
articles.forEach(({ title, author, authorId }) =>
  Deno.writeTextFileSync(
    `fragments/articles/${authorId}---${title}.html`,
    `{{header}}{{article}}${
      Deno.readTextFileSync(`articles/${author}/${title}.html`)
    }{{footer}}`,
  )
);

//Collect fragments

const targets = [...walkSync("fragments")]
  .filter((e) => e.isFile)
  .map(
    (e) => [e.name.split(".")[0], Deno.readTextFileSync(e.path)],
  )
  .map(([name, text]) => ({
    name,
    text,
    deps: [] as string[],
  }));

//Find dependencies

targets.forEach((t) =>
  t.deps = [...new Set([...t.text.matchAll(/{{(.+?)}}/g)].map((g) => g[1]))]
);

//Resolve dependencies

let unresolved: typeof targets;
while ((unresolved = targets.filter((t) => t.deps.length)).length) {
  unresolved.forEach((u) => {
    const resolvable = targets.find((t) =>
      t.name == u.deps[0] && !t.deps.length
    );
    if (!resolvable) {
      return;
    }
    u.text = u.text.replaceAll(`{{${resolvable.name}}}`, resolvable.text);
    u.deps.shift();
  });
}

const target = (name: string) =>
  targets.find((t) => t.name == name)?.text ?? "";

//Generate index.html

Deno.writeTextFileSync(
  "docs/index.html",
  target("index")
  .replace("[[title]]", "Aue - a religion")
  .replace("[[desc]]", "A modern atheistic religion, focusing on joy & woe."),
);

//Generate contributor endpoints

contributors.forEach((c) => {
  const title = `${c} - Aue - a religion`;
  const desc =
    `${c} gives their opinions, decriptions, materials, and articles on Aue - a modern religion`;
  c = woSp(c);
  const dir = `docs/${c}`;
  mkdir(dir);
  Deno.writeTextFileSync(
    `${dir}/index.html`,
    target(c)
      .replace("[[title]]", title)
      .replace("[[desc]]", desc),
  );
});

//Generate article endpoints

articles.forEach(({ title, author, authorId }) => {
  const dir = `docs/${authorId}`;
  mkdir(dir);
  mkdir(`${dir}/${title}`);
  const content = target(`${authorId}---${title}`);
  const longTitle = content.match(/<h1>(.+?)<\/h1>/)?.[1] ?? "Unknown article";
  Deno.writeTextFileSync(
    `${dir}/${title}/index.html`,
    content
      .replace("[[title]]", `${longTitle} - ${author}`)
      .replace("[[desc]]", `${longTitle} by ${author}`),
  );
});

//Generate ads and wallpaper endpoint

Deno.writeTextFileSync("docs/ads/index.html", target("ads"));
Deno.writeTextFileSync("docs/wallpaper/index.html", target("wallpaper"));