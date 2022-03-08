"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var fs_1 = require("fs");
var fs_2 = require("fs");
var walkSync = require("walk-sync");
var readJson = function (path) { return JSON.parse((0, fs_1.readFileSync)(path).toString()); };
var woSp = function (text) { return text.replace(/ /g, ""); };
var n2c = function (n) { return String.fromCharCode(n + 97); };
var c2n = function (c) { return c.charCodeAt(0) - 97; };
var last = function (arr) { return arr[arr.length - 1]; };
var aue = readJson("aue.json").aue;
var contributors = __spreadArray([], __read((0, fs_1.readdirSync)("contributions")), false).map(function (e) { return e.split(".")[0]; });
{
    var first_1 = "Patrick Bowen";
    contributors.sort(function (x, y) { return (x == first_1 ? -1 : y == first_1 ? 1 : 0); });
}
var defaultKeywords = "Aue,religion,atheist";
//Delete directories
var rmdirs = function (dir) {
    return __spreadArray([], __read((0, fs_1.readdirSync)(dir)), false).filter(function (e) { return (0, fs_2.statSync)(dir + e).isDirectory() && e != "cards"; })
        .forEach(function (e) { return (0, fs_2.rmSync)(dir + e, { recursive: true, force: true }); });
};
rmdirs("docs/");
rmdirs("fragments/");
//Create empty directories
var mkdir = function (dir) { return (0, fs_2.existsSync)(dir) || (0, fs_2.mkdirSync)(dir); };
["fragments/articles", "fragments/contributions", "docs/wallpaper"].forEach(mkdir);
//Build verses.html fragment
(0, fs_1.writeFileSync)("fragments/verses.html", aue
    .map(function (v, i) {
    var cite = n2c(i);
    return "<verse data-cite=\"" + cite + "\"><cite>" + cite + "</cite> " + v + "</verse>\n";
})
    .join(""));
//Build contributors.html fragment
(0, fs_1.writeFileSync)("fragments/contributors.html", "<select id=\"contributor\" onchange=\"DomContributor(this)\">\n  <option></option>\n  " + contributors
    .map(function (c) {
    return "<option value=\"" + woSp(c) + "\">" + c + "</option>";
})
    .join("") + "</select>");
//Build articles.html fragment
var articles = __spreadArray([], __read(walkSync("articles", { directories: false })), false).map(function (path) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    path = "articles/" + path;
    var _l = __read(last(path.split("/")).split("."), 1), name = _l[0];
    var _m = __read(path.split("/"), 2), _ = _m[0], author = _m[1];
    var authorId = woSp(author);
    var content = (0, fs_1.readFileSync)(path).toString();
    var title = (_b = (_a = content.match(/<h1>(.+?)<\/h1>/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : "Unknown article";
    var firstPara = (_d = (_c = content.match(/<p>((?:.|\s)+?)<\/p>/m)) === null || _c === void 0 ? void 0 : _c[1].replace(/<\/?[^>]+>/g, "")) !== null && _d !== void 0 ? _d : "";
    var byLine = (_f = (_e = content.match(/<p class="by-line">((?:.|\s)+?)<\/p>/)) === null || _e === void 0 ? void 0 : _e[1]) !== null && _f !== void 0 ? _f : "";
    var date = Date.parse((_h = (_g = byLine.match(/\d+-\d+-\d+/)) === null || _g === void 0 ? void 0 : _g[0]) !== null && _h !== void 0 ? _h : "");
    var keywords = (_k = (_j = content.match(/<p class="keywords">((?:.|\s)+?)<\/p>/)) === null || _j === void 0 ? void 0 : _j[1]) !== null && _k !== void 0 ? _k : "";
    return { name: name, title: title, path: path, byLine: byLine, date: date, author: author, authorId: authorId, firstPara: firstPara, keywords: keywords };
});
articles.sort(function (_a, _b) {
    var b = _a.date;
    var a = _b.date;
    return a - b;
});
function makeArticlesFragment(forAuthor) {
    return articles
        .filter(function (a) { return !forAuthor || a.authorId == forAuthor; })
        .map(function (_a) {
        var name = _a.name, title = _a.title, byLine = _a.byLine, authorId = _a.authorId, firstPara = _a.firstPara;
        var maxLen = 200;
        firstPara = firstPara.length > maxLen ? firstPara.substr(0, maxLen) + "…" : firstPara;
        return "\n<a class=\"article-link\" href=\"/" + authorId + "/" + name + "\">\n<h3>" + title + "</h3>\n<i>" + byLine + "</i>\n<p>" + firstPara + "</p>\n</a>";
    });
}
(0, fs_1.writeFileSync)("fragments/articles.html", makeArticlesFragment().join("\n"));
//Build contributor fragments
function materialHtml(title, urls, comment) {
    var punc = title.endsWith("?") ? "" : ".";
    var titleHtml = Array.isArray(urls)
        ? "<i>" + title + "</i> (" + urls.map(function (u, i) { return "<a href=\"" + u + "\">" + (i + 1) + "</a>"; }).join(", ") + ")"
        : "<a href=\"" + urls + "\"><i>" + title + "</i></a>";
    return "<material>" + titleHtml + punc + " " + comment + "</material>";
}
contributors.forEach(function (c) {
    var _a = readJson("contributions/" + c + ".json"), opinions = _a.opinions, verseDescs = _a.verseDescs, materials = _a.materials, charities = _a.charities;
    c = woSp(c);
    var opinionEls = (opinions !== null && opinions !== void 0 ? opinions : []).map(function (_a) {
        var _b = __read(_a, 3), name = _b[0], body = _b[1], cites = _b[2];
        return "<opinion data-cites=\"" + cites + "\"><i>" + name + ".</i> " + body + " <cite>" + cites + "</cite></opinion>";
    });
    var articleEls = makeArticlesFragment(c);
    var descEls = (verseDescs !== null && verseDescs !== void 0 ? verseDescs : []).map(function (_a) {
        var _b = __read(_a, 2), cite = _b[0], body = _b[1];
        var verse = aue[c2n(cite)];
        body = body.split("\n").join("</p><p>");
        return "<description><cite>" + cite + "</cite> <b>" + verse + "</b> <p>" + body + "</p></description>";
    });
    var materialEls = (materials !== null && materials !== void 0 ? materials : []).map(function (_a) {
        var _b = __read(_a, 3), title = _b[0], urls = _b[1], body = _b[2];
        return materialHtml(title, urls, body);
    });
    var html = "";
    if (opinionEls.length) {
        var els = opinionEls.join("\n");
        html += "\n<column class=\"opinions\"><h2 class=\"opinions\">Opinions</h2><opinions>" + els + "</opinions></column>";
    }
    if (articleEls.length) {
        var els = articleEls.join("\n");
        html += "\n<column class=\"wide articles\"><h2>Articles</h2>" + els + "</column>";
    }
    if (descEls.length) {
        var els = descEls.join("\n");
        html += "\n<column class=\"descs\"><h2>Verse Descriptions</h2><descs>" + els + "</descs></column>";
    }
    if (materialEls.length) {
        var els = materialEls.join("\n");
        html += "\n<column class=\"thin materials\"><h2>Materials</h2><materials>" + els + "</materials></column>";
    }
    (0, fs_1.writeFileSync)("fragments/contributions/" + c + "-inner.html", html);
    (0, fs_1.writeFileSync)("fragments/contributions/" + c + ".html", "{{header}}{{core}}{{" + c + "-inner}}{{footer}}");
});
//Build article fragments
articles.forEach(function (_a) {
    var name = _a.name, title = _a.title, author = _a.author, authorId = _a.authorId;
    return (0, fs_1.writeFileSync)("fragments/articles/" + authorId + "---" + name + ".html", "{{header}}{{article}}" + (0, fs_1.readFileSync)("articles/" + author + "/" + name + ".html") + "{{footer}}");
});
//Collect fragments
var targets = __spreadArray([], __read(walkSync("fragments", { directories: false })), false).map(function (path) { return "fragments/" + path; })
    .map(function (path) { return [last(path.split("/")).split(".")[0], (0, fs_1.readFileSync)(path).toString()]; })
    .map(function (_a) {
    var _b = __read(_a, 2), name = _b[0], text = _b[1];
    return ({
        name: name,
        text: text,
        deps: []
    });
});
//Find dependencies
targets.forEach(function (t) { return (t.deps = __spreadArray([], __read(new Set(__spreadArray([], __read(t.text.matchAll(/{{(.+?)}}/g)), false).map(function (g) { return g[1]; }))), false)); });
//Resolve dependencies
var unresolved;
while ((unresolved = targets.filter(function (t) { return t.deps.length; })).length) {
    unresolved.forEach(function (u) {
        var resolvable = targets.find(function (t) { return t.name == u.deps[0] && !t.deps.length; });
        if (!resolvable) {
            return;
        }
        u.text = u.text.replace(new RegExp("{{" + resolvable.name + "}}", "g"), resolvable.text);
        u.deps.shift();
    });
}
var target = function (name) { var _a, _b; return (_b = (_a = targets.find(function (t) { return t.name == name; })) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : ""; };
//Generate index.html
(0, fs_1.writeFileSync)("docs/index.html", target("index")
    .replace("[[title]]", "Aue - a religion")
    .replace("[[desc]]", "A modern naturalistic religion, focusing on joy & woe.")
    .replace("[[author-name]]", "Patrick Bowen")
    .replace("[[keywords]]", defaultKeywords));
//Generate contributor endpoints
contributors.forEach(function (contributor) {
    var title = contributor + " - Aue - a religion";
    var desc = contributor + " gives their opinions, descriptions, materials, and articles on Aue - a modern religion.";
    var id = woSp(contributor);
    var dir = "docs/" + id;
    mkdir(dir);
    (0, fs_1.writeFileSync)(dir + "/index.html", target(id)
        .replace("[[title]]", title)
        .replace("[[desc]]", desc)
        .replace("[[author-name]]", contributor)
        .replace("[[keywords]]", defaultKeywords + ",adherent,articles,materials,opinions"));
});
//Generate article endpoints
articles.forEach(function (_a) {
    var name = _a.name, author = _a.author, authorId = _a.authorId, title = _a.title, firstPara = _a.firstPara, keywords = _a.keywords;
    var dir = "docs/" + authorId;
    var desc = firstPara.replace(/\s+/g, " ").trim().substr(0, 150) + "\u2026";
    mkdir(dir);
    mkdir(dir + "/" + name);
    var content = target(authorId + "---" + name).replace(/'/g, "&rsquo;");
    (0, fs_1.writeFileSync)(dir + "/" + name + "/index.html", content
        .replace("[[title]]", title + " - " + author)
        .replace("[[desc]]", desc)
        .replace("[[author-name]]", author)
        .replace("[[keywords]]", defaultKeywords + "," + keywords));
});
//Generate cards and wallpaper endpoint
(0, fs_1.writeFileSync)("docs/cards/index.html", target("cards"));
(0, fs_1.writeFileSync)("docs/wallpaper/index.html", target("wallpaper"));
//# sourceMappingURL=generate.js.map