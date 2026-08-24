const els = {
  docState: document.getElementById("docState"),
  docTitle: document.getElementById("docTitle"),
  docStats: document.getElementById("docStats"),
  docScopeSelect: document.getElementById("docScopeSelect"),
  docSelect: document.getElementById("docSelect"),
  docSearchInput: document.getElementById("docSearchInput"),
  docMatchCount: document.getElementById("docMatchCount"),
  docToc: document.getElementById("docToc"),
  docContent: document.getElementById("docContent"),
  refreshDocsBtn: document.getElementById("refreshDocsBtn")
};

const state = {
  docs: [],
  docCache: new Map()
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function shortDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function readJsonApi(url) {
  const response = await fetch(url);
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || `Invalid JSON from ${url}`);
  }
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

function docSearchTerms(query) {
  return String(query || "")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1)
    .slice(0, 8);
}

function highlightDocText(text, query) {
  let html = escapeHtml(text);
  const terms = docSearchTerms(query);
  if (!terms.length) return html;
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  return html.replace(pattern, "<mark>$1</mark>");
}

function countDocMatches(content, query) {
  const terms = docSearchTerms(query);
  if (!terms.length) return 0;
  const haystack = String(content || "");
  return terms.reduce((total, term) => {
    const matches = haystack.match(new RegExp(escapeRegExp(term), "gi"));
    return total + (matches ? matches.length : 0);
  }, 0);
}

function slugifyDocHeading(text, index) {
  const slug = String(text || "")
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || `section-${index + 1}`;
}

function markdownToDocHtml(markdown, query) {
  const lines = String(markdown || "").split(/\r?\n/);
  const html = [];
  const headings = [];
  let inCode = false;
  let codeLines = [];
  let listType = "";
  let paragraph = [];

  const closeParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${highlightDocText(paragraph.join(" "), query)}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = "";
  };
  const closeCode = () => {
    if (!inCode) return;
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    codeLines = [];
    inCode = false;
  };

  lines.forEach((line) => {
    if (/^```/.test(line.trim())) {
      if (inCode) {
        closeCode();
      } else {
        closeParagraph();
        closeList();
        inCode = true;
        codeLines = [];
      }
      return;
    }
    if (inCode) {
      codeLines.push(line);
      return;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeParagraph();
      closeList();
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = slugifyDocHeading(text, headings.length);
      headings.push({ level, text, id });
      html.push(`<h${level} id="${escapeHtml(id)}">${highlightDocText(text, query)}</h${level}>`);
      return;
    }

    const item = line.match(/^\s*[-*]\s+(.+)$/);
    if (item) {
      closeParagraph();
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${highlightDocText(item[1], query)}</li>`);
      return;
    }

    const orderedItem = line.match(/^\s*\d+\.\s+(.+)$/);
    if (orderedItem) {
      closeParagraph();
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${highlightDocText(orderedItem[1], query)}</li>`);
      return;
    }

    if (!line.trim()) {
      closeParagraph();
      closeList();
      return;
    }

    paragraph.push(line.trim());
  });

  closeCode();
  closeParagraph();
  closeList();
  return { html: html.join("\n"), headings };
}

function setDocState(label, tone = "idle") {
  if (!els.docState) return;
  els.docState.textContent = label;
  els.docState.dataset.tone = tone;
}

function renderDocToc(headings = []) {
  if (!els.docToc) return;
  const visible = headings.filter((heading) => heading.level <= 3).slice(0, 80);
  if (!visible.length) {
    els.docToc.innerHTML = '<span class="empty-note">No sections found.</span>';
    return;
  }
  els.docToc.innerHTML = visible.map((heading) => (
    `<a class="toc-link level-${heading.level}" href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a>`
  )).join("");
}

async function ensureDocContent(docPath) {
  if (state.docCache.has(docPath)) {
    return state.docCache.get(docPath);
  }
  const data = await readJsonApi(`/api/docs/read?path=${encodeURIComponent(docPath)}`);
  state.docCache.set(docPath, data.doc);
  return data.doc;
}

async function currentDocPayload() {
  const allDocs = els.docScopeSelect?.value === "all";
  if (!allDocs) {
    return ensureDocContent(els.docSelect?.value || "README.md");
  }
  const docs = await Promise.all(state.docs.map((doc) => ensureDocContent(doc.path)));
  const content = docs.map((doc) => (
    `# ${doc.title || doc.path}\n\nPath: ${doc.path}\n\n${doc.content || ""}`
  )).join("\n\n---\n\n");
  const updatedAt = state.docs
    .map((doc) => doc.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);
  return {
    path: "__all__",
    title: "All docs one page",
    content,
    docCount: docs.length,
    updatedAt: updatedAt || ""
  };
}

async function renderDocView() {
  if (!els.docContent) return;
  setDocState("Reading", "busy");
  const docPath = els.docSelect?.value || "README.md";
  const query = els.docSearchInput?.value.trim() || "";
  const allDocs = els.docScopeSelect?.value === "all";
  if (els.docSelect) {
    els.docSelect.disabled = allDocs;
  }
  if (els.docMatchCount) {
    els.docMatchCount.textContent = "Loading";
  }
  const doc = await currentDocPayload();
  const selectedMeta = state.docs.find((item) => item.path === docPath);
  const matchCount = countDocMatches(doc.content, query);
  const wordCount = String(doc.content || "").trim().split(/\s+/).filter(Boolean).length;
  const { html, headings } = markdownToDocHtml(doc.content, query);

  els.docTitle.textContent = doc.title || docPath;
  els.docStats.textContent = [
    doc.path === "__all__" ? `${doc.docCount || state.docs.length} documents` : doc.path,
    `${wordCount.toLocaleString()} words`,
    doc.path !== "__all__" && selectedMeta?.bytes ? formatBytes(selectedMeta.bytes) : "",
    doc.updatedAt || selectedMeta?.updatedAt ? `Updated ${shortDateTime(doc.updatedAt || selectedMeta.updatedAt)}` : ""
  ].filter(Boolean).join(" | ");
  if (els.docMatchCount) {
    els.docMatchCount.textContent = query ? `${matchCount} match${matchCount === 1 ? "" : "es"}` : "Search ready";
    els.docMatchCount.dataset.tone = query && matchCount === 0 ? "error" : query ? "busy" : "success";
  }
  renderDocToc(headings);
  els.docContent.innerHTML = html || "<p>No content.</p>";
  setDocState("Ready", "success");
}

async function loadDocs() {
  if (!els.docSelect) return;
  setDocState("Loading", "busy");
  const data = await readJsonApi("/api/docs");
  state.docs = data.docs || [];
  state.docCache.clear();
  els.docSelect.innerHTML = state.docs.map((doc) => (
    `<option value="${escapeHtml(doc.path)}">${escapeHtml(doc.title)} - ${escapeHtml(doc.path)}</option>`
  )).join("");
  const preferred = state.docs.find((doc) => doc.path === "docs/master-automation-doc.md") || state.docs[0];
  if (!preferred) {
    els.docTitle.textContent = "Automation docs";
    els.docStats.textContent = "No docs found.";
    els.docContent.textContent = "No docs found.";
    renderDocToc([]);
    setDocState("No docs", "error");
    return;
  }
  els.docSelect.value = preferred.path;
  await renderDocView();
}

els.docSelect?.addEventListener("change", () => {
  renderDocView().catch((error) => {
    setDocState("Failed", "error");
    els.docContent.textContent = error.message;
  });
});

els.docScopeSelect?.addEventListener("change", () => {
  renderDocView().catch((error) => {
    setDocState("Failed", "error");
    els.docContent.textContent = error.message;
  });
});

els.docSearchInput?.addEventListener("input", () => {
  renderDocView().catch((error) => {
    setDocState("Failed", "error");
    els.docContent.textContent = error.message;
  });
});

els.refreshDocsBtn?.addEventListener("click", () => {
  loadDocs().catch((error) => {
    setDocState("Failed", "error");
    els.docContent.textContent = error.message;
  });
});

els.docToc?.addEventListener("click", (event) => {
  const link = event.target.closest("a[href^='#']");
  if (!link) return;
  const target = els.docContent.querySelector(link.getAttribute("href"));
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
});

loadDocs().catch((error) => {
  setDocState("Failed", "error");
  if (els.docContent) {
    els.docContent.textContent = error.message;
  }
});
