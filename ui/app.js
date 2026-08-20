const els = {
  serverStatus: document.getElementById("serverStatus"),
  inputPath: document.getElementById("inputPath"),
  driveSyncDir: document.getElementById("driveSyncDir"),
  updateSourceWorkbook: document.getElementById("updateSourceWorkbook"),
  toolSelect: document.getElementById("toolSelect"),
  loadToolsBtn: document.getElementById("loadToolsBtn"),
  rowNumber: document.getElementById("rowNumber"),
  maxScenes: document.getElementById("maxScenes"),
  queueStartRow: document.getElementById("queueStartRow"),
  queueLimit: document.getElementById("queueLimit"),
  queueRows: document.getElementById("queueRows"),
  queueBtn: document.getElementById("queueBtn"),
  stopQueueBtn: document.getElementById("stopQueueBtn"),
  googleVidsConfig: document.getElementById("googleVidsConfig"),
  profileCount: document.getElementById("profileCount"),
  profileList: document.getElementById("profileList"),
  refreshProfilesBtn: document.getElementById("refreshProfilesBtn"),
  primaryProfile: document.getElementById("primaryProfile"),
  fallbackProfile: document.getElementById("fallbackProfile"),
  loginProfile: document.getElementById("loginProfile"),
  newProfileName: document.getElementById("newProfileName"),
  addProfileOnlyBtn: document.getElementById("addProfileOnlyBtn"),
  addProfileBtn: document.getElementById("addProfileBtn"),
  customProfile: document.getElementById("customProfile"),
  useOnlyPrimary: document.getElementById("useOnlyPrimary"),
  useAvatar: document.getElementById("useAvatar"),
  avatarChoice: document.getElementById("avatarChoice"),
  avatarScenes: document.getElementById("avatarScenes"),
  useIngredients: document.getElementById("useIngredients"),
  ingredientScenes: document.getElementById("ingredientScenes"),
  quotaEstimate: document.getElementById("quotaEstimate"),
  quotaPlan: document.getElementById("quotaPlan"),
  quotaAiLimit: document.getElementById("quotaAiLimit"),
  quotaAiUsed: document.getElementById("quotaAiUsed"),
  quotaAvatarLimit: document.getElementById("quotaAvatarLimit"),
  quotaAvatarUsed: document.getElementById("quotaAvatarUsed"),
  quotaExhausted: document.getElementById("quotaExhausted"),
  quotaNote: document.getElementById("quotaNote"),
  saveQuotaBtn: document.getElementById("saveQuotaBtn"),
  reuseUrl: document.getElementById("reuseUrl"),
  noLocalFallback: document.getElementById("noLocalFallback"),
  runBtn: document.getElementById("runBtn"),
  stopBtn: document.getElementById("stopBtn"),
  loginBtn: document.getElementById("loginBtn"),
  terminal: document.getElementById("terminal"),
  runState: document.getElementById("runState"),
  runTitle: document.getElementById("runTitle"),
  runHint: document.getElementById("runHint"),
  selectedToolInfo: document.getElementById("selectedToolInfo"),
  selectedToolMeta: document.getElementById("selectedToolMeta"),
  modeInfo: document.getElementById("modeInfo"),
  modeMeta: document.getElementById("modeMeta"),
  profileInfo: document.getElementById("profileInfo"),
  profileMeta: document.getElementById("profileMeta"),
  profileCenterStats: document.getElementById("profileCenterStats"),
  profileCenterRefreshBtn: document.getElementById("profileCenterRefreshBtn"),
  profileLimitSummary: document.getElementById("profileLimitSummary"),
  profileLimitList: document.getElementById("profileLimitList"),
  outputInfo: document.getElementById("outputInfo"),
  outputMeta: document.getElementById("outputMeta"),
  resultTitle: document.getElementById("resultTitle"),
  resultMeta: document.getElementById("resultMeta"),
  videoPreview: document.getElementById("videoPreview"),
  retryBtn: document.getElementById("retryBtn"),
  openVideoBtn: document.getElementById("openVideoBtn"),
  openVideoFolderBtn: document.getElementById("openVideoFolderBtn"),
  openGeneratedFolderBtn: document.getElementById("openGeneratedFolderBtn"),
  openCacheFolderBtn: document.getElementById("openCacheFolderBtn"),
  openRunFolderBtn: document.getElementById("openRunFolderBtn"),
  queueTitle: document.getElementById("queueTitle"),
  queueMeta: document.getElementById("queueMeta"),
  queueList: document.getElementById("queueList"),
  historyList: document.getElementById("historyList"),
  docTitle: document.getElementById("docTitle"),
  docStats: document.getElementById("docStats"),
  docScope: document.getElementById("docScope"),
  docSelect: document.getElementById("docSelect"),
  docSearch: document.getElementById("docSearch"),
  docMatchCount: document.getElementById("docMatchCount"),
  docToc: document.getElementById("docToc"),
  refreshDocsBtn: document.getElementById("refreshDocsBtn"),
  docContent: document.getElementById("docContent")
};

const state = {
  mode: "local",
  activeRunId: "",
  activeQueueId: "",
  activeTab: "run",
  queueTimer: null,
  eventSource: null,
  profiles: [],
  docs: [],
  docCache: new Map(),
  tools: [],
  history: [],
  lastRunBody: null,
  lastRun: null,
  output: {
    video: "",
    videoFolder: "",
    generatedFolder: "",
    cacheFolder: "",
    runFolder: ""
  }
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

function setStatus(text, tone = "ready") {
  els.serverStatus.textContent = text;
  els.serverStatus.style.background = tone === "busy" ? "#fff7ed" : tone === "error" ? "#ffebe9" : "#eaf8ef";
  els.serverStatus.style.color = tone === "busy" ? "#a65f00" : tone === "error" ? "#9f2b22" : "#137a42";
}

function appendTerminal(text, stream = "stdout") {
  const span = document.createElement("span");
  span.className = stream;
  span.textContent = text;
  els.terminal.appendChild(span);
  els.terminal.scrollTop = els.terminal.scrollHeight;
}

function resetTerminal(text = "") {
  els.terminal.textContent = text || "";
}

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll(".segment").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  if (mode === "google-full" && els.useAvatar.checked) {
    els.avatarScenes.value = "1,2,3,4,5,6";
  }
  if (mode === "google" && els.useAvatar.checked && els.avatarScenes.value.trim() === "1,2,3,4,5,6") {
    els.avatarScenes.value = "1,2,6";
  }
  const vidsDisabled = mode === "local" || mode === "prep";
  els.googleVidsConfig.classList.toggle("is-hidden", vidsDisabled);
  els.primaryProfile.disabled = vidsDisabled;
  els.fallbackProfile.disabled = vidsDisabled;
  els.useOnlyPrimary.disabled = vidsDisabled;
  els.useAvatar.disabled = vidsDisabled;
  els.avatarChoice.disabled = vidsDisabled || !els.useAvatar.checked;
  els.avatarScenes.disabled = vidsDisabled || !els.useAvatar.checked;
  els.useIngredients.disabled = vidsDisabled;
  els.ingredientScenes.disabled = vidsDisabled || !els.useIngredients.checked;
  els.reuseUrl.disabled = vidsDisabled;
  els.noLocalFallback.disabled = vidsDisabled;
  updateQuotaEstimate();
  updateInfoCards();
}

function quotaLimitUsed(quota = {}) {
  const aiLimit = Number(quota.aiVideoMonthlyLimit || 0);
  const avatarLimit = Number(quota.avatarMonthlyLimit || 0);
  const aiUsed = Number(quota.aiVideoUsed || 0);
  const avatarUsed = Number(quota.avatarUsed || 0);
  return Boolean(
    quota.quotaExhausted ||
    quota.limitStatus === "limit_used" ||
    quota.lastQuotaHitAt ||
    (aiLimit > 0 && aiUsed >= aiLimit) ||
    (avatarLimit > 0 && avatarUsed >= avatarLimit)
  );
}

function profileOptions(profiles) {
  return profiles.map((profile) => {
    const limitSuffix = quotaLimitUsed(profile.quota) ? " (limit used)" : "";
    const loginSuffix = profile.loggedIn ? "" : " (login needed)";
    const identity = profile.email || profile.googleName || profile.profileName || "email unknown";
    return `<option value="${escapeHtml(profile.path)}">${escapeHtml(profile.label || identity)} - ${escapeHtml(profile.path)}${limitSuffix}${loginSuffix}</option>`;
  }).join("");
}

function avatarOptions(options) {
  return options.map((option) => (
    `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label || option.value)}</option>`
  )).join("");
}

function quotaNumbers(quota = {}) {
  const aiLimit = Number(quota.aiVideoMonthlyLimit || 0);
  const avatarLimit = Number(quota.avatarMonthlyLimit || 0);
  const aiUsed = Number(quota.aiVideoUsed || 0);
  const avatarUsed = Number(quota.avatarUsed || 0);
  return {
    aiLimit,
    avatarLimit,
    aiUsed,
    avatarUsed,
    aiLeft: aiLimit > 0 ? Math.max(0, aiLimit - aiUsed) : null,
    avatarLeft: avatarLimit > 0 ? Math.max(0, avatarLimit - avatarUsed) : null,
    aiPercent: aiLimit > 0 ? Math.max(0, Math.min(100, (aiUsed / aiLimit) * 100)) : 0,
    avatarPercent: avatarLimit > 0 ? Math.max(0, Math.min(100, (avatarUsed / avatarLimit) * 100)) : 0
  };
}

function quotaLine(label, used, limit, left, percent, isLimitUsed) {
  const limitText = limit > 0 ? limit : "-";
  const leftText = left === null ? "manual" : `${left} left`;
  return `
    <div class="quota-line">
      <div class="quota-line-top">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(used)}/${escapeHtml(limitText)} · ${escapeHtml(leftText)}</strong>
      </div>
      <div class="quota-meter" aria-hidden="true">
        <span class="${isLimitUsed ? "danger" : ""}" style="width: ${percent.toFixed(0)}%"></span>
      </div>
    </div>
  `;
}

function renderProfileCenter() {
  if (!els.profileLimitList) return;
  const profiles = state.profiles || [];
  const loggedIn = profiles.filter((profile) => profile.loggedIn).length;
  const limitUsed = profiles.filter((profile) => quotaLimitUsed(profile.quota)).length;
  const available = profiles.filter((profile) => profile.loggedIn && !quotaLimitUsed(profile.quota)).length;
  const selectedPrimary = els.primaryProfile.value;
  const selectedFallback = els.fallbackProfile.value;

  els.profileCenterStats.textContent = `${profiles.length} profile(s) added | ${loggedIn} logged in | ${available} available | ${limitUsed} limit used`;
  els.profileLimitSummary.innerHTML = [
    ["Total", profiles.length],
    ["Logged in", loggedIn],
    ["Available", available],
    ["Limit used", limitUsed]
  ].map(([label, value]) => (
    `<div class="profile-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`
  )).join("");

  if (!profiles.length) {
    els.profileLimitList.innerHTML = `<div class="mini-item"><div class="mini-meta">No profiles added yet. Use Add Profile or Add + Login from the sidebar.</div></div>`;
    return;
  }

  els.profileLimitList.innerHTML = profiles.map((profile, index) => {
    const quota = profile.quota || {};
    const numbers = quotaNumbers(quota);
    const isLimitUsed = quotaLimitUsed(quota);
    const statusClass = isLimitUsed ? "limit_used" : (profile.loggedIn ? "complete" : "failed");
    const statusText = isLimitUsed ? "LIMIT USED" : (profile.loggedIn ? "LOGIN OK" : "LOGIN NEEDED");
    const identity = profile.email || profile.googleName || profile.profileName || `Profile ${index + 1}`;
    const selectedBadges = [
      profile.path === selectedPrimary ? `<span class="pill running">PRIMARY</span>` : "",
      profile.path === selectedFallback ? `<span class="pill queued">FALLBACK</span>` : ""
    ].filter(Boolean).join("");
    const metaRows = [
      ["Path", profile.path],
      ["Email/name", identity],
      ["Chrome profile", profile.browserProfile || "-"],
      ["Plan", quota.plan || "Manual / free"],
      ["Reset", quota.resetNote || "Monthly reset"],
      ["Updated", quota.updatedAt || quota.estimatedUsageUpdatedAt || quota.quotaExhaustedAt || profile.lastActive || ""]
    ];
    const note = [
      quota.quotaNote || "",
      quota.lastQuotaHitAt ? `Last quota hit: ${formatTime(quota.lastQuotaHitAt)}` : "",
      quota.quotaExhaustedAt ? `Limit marked: ${formatTime(quota.quotaExhaustedAt)}` : ""
    ].filter(Boolean).join(" | ");

    return `
      <article class="profile-limit-card">
        <div class="profile-limit-top">
          <div>
            <p class="eyebrow">PROFILE ${index + 1}</p>
            <h3>${escapeHtml(identity)}</h3>
            <div class="profile-badges">
              <span class="pill ${statusClass}">${statusText}</span>
              ${selectedBadges}
            </div>
          </div>
          <div class="profile-limit-actions">
            <button class="secondary-button" data-action="profile-primary" data-profile="${escapeHtml(profile.path)}" type="button">Use Primary</button>
            <button class="secondary-button" data-action="profile-fallback" data-profile="${escapeHtml(profile.path)}" type="button">Use Fallback</button>
            <button class="secondary-button" data-action="profile-login" data-profile="${escapeHtml(profile.path)}" type="button">Login</button>
            <button class="secondary-button" data-action="open-path" data-path="${escapeHtml(profile.absolutePath || profile.path)}" type="button">Folder</button>
          </div>
        </div>
        <div class="quota-lines">
          ${quotaLine("AI video", numbers.aiUsed, numbers.aiLimit, numbers.aiLeft, numbers.aiPercent, isLimitUsed)}
          ${quotaLine("Avatar", numbers.avatarUsed, numbers.avatarLimit, numbers.avatarLeft, numbers.avatarPercent, isLimitUsed)}
        </div>
        <dl class="profile-meta-grid">
          ${metaRows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || "-")}</dd></div>`).join("")}
        </dl>
        ${note ? `<p class="profile-note">${escapeHtml(note)}</p>` : ""}
      </article>
    `;
  }).join("");
}

function setActiveTab(tab) {
  state.activeTab = tab || "run";
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === state.activeTab);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tab-${state.activeTab}`);
  });
  if (state.activeTab === "docs" && state.docs.length) {
    renderDocView().catch((error) => {
      els.docContent.textContent = error.message;
    });
  }
  if (state.activeTab === "profiles") {
    renderProfileCenter();
  }
}

function renderProfiles(profiles) {
  state.profiles = profiles || [];
  const loggedIn = state.profiles.filter((profile) => profile.loggedIn).length;
  const limitUsedCount = state.profiles.filter((profile) => quotaLimitUsed(profile.quota)).length;
  els.profileCount.textContent = `${state.profiles.length} profile(s) added, ${loggedIn} logged in, ${limitUsedCount} limit used`;
  els.profileList.innerHTML = state.profiles.map((profile) => {
    const identity = profile.email || profile.googleName || "Email unknown";
    const quota = profile.quota || {};
    const isLimitUsed = quotaLimitUsed(quota);
    const statusClass = isLimitUsed ? "limit_used" : (profile.loggedIn ? "complete" : "failed");
    const statusText = isLimitUsed ? "LIMIT USED" : (profile.loggedIn ? "login ok" : "login needed");
    const aiLimit = Number(quota.aiVideoMonthlyLimit || 0);
    const avatarLimit = Number(quota.avatarMonthlyLimit || 0);
    const quotaLine = `AI ${Number(quota.aiVideoUsed || 0)}/${aiLimit || "-"} | Avatar ${Number(quota.avatarUsed || 0)}/${avatarLimit || "-"}`;
    const meta = [
      profile.path,
      profile.browserProfile ? `Chrome: ${profile.browserProfile}` : "",
      profile.hostedDomain ? `Domain: ${profile.hostedDomain}` : "",
      quotaLine
    ].filter(Boolean).join(" | ");
    return `
      <div class="profile-chip">
        <div class="profile-chip-top">
          <strong>${escapeHtml(identity)}</strong>
          <span class="pill ${statusClass}">${statusText}</span>
        </div>
        <span>${escapeHtml(meta)}</span>
      </div>
    `;
  }).join("");
  updateInfoCards();
  renderProfileCenter();
}

function syncProfileSelects(profiles, preferred = {}) {
  const previousPrimary = preferred.primary || els.primaryProfile.value;
  const previousFallback = preferred.fallback || els.fallbackProfile.value;
  const previousLogin = preferred.login || els.loginProfile.value;
  const options = profileOptions(profiles);
  els.primaryProfile.innerHTML = options;
  els.loginProfile.innerHTML = options;
  els.fallbackProfile.innerHTML = `<option value="">No fallback</option>${options}`;
  if (previousPrimary && profiles.some((profile) => profile.path === previousPrimary)) {
    els.primaryProfile.value = previousPrimary;
  }
  if (previousFallback && profiles.some((profile) => profile.path === previousFallback)) {
    els.fallbackProfile.value = previousFallback;
  } else if (!previousFallback && profiles[1]) {
    els.fallbackProfile.value = profiles[1].path;
  }
  if (previousLogin && profiles.some((profile) => profile.path === previousLogin)) {
    els.loginProfile.value = previousLogin;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function searchTerms(query) {
  return String(query || "")
    .trim()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function highlightText(value, query) {
  let html = escapeHtml(value);
  const terms = searchTerms(query).map((term) => escapeRegExp(escapeHtml(term)));
  if (!terms.length) {
    return html;
  }
  const expression = new RegExp(`(${terms.join("|")})`, "gi");
  html = html.replace(expression, "<mark>$1</mark>");
  return html;
}

function countMatches(content, query) {
  const text = String(content || "").toLowerCase();
  return searchTerms(query).reduce((count, term) => {
    const needle = term.toLowerCase();
    if (!needle) return count;
    let index = 0;
    let next = text.indexOf(needle, index);
    let matches = 0;
    while (next !== -1) {
      matches += 1;
      index = next + needle.length;
      next = text.indexOf(needle, index);
    }
    return count + matches;
  }, 0);
}

function slugifyHeading(value, used = new Map()) {
  const base = String(value || "section")
    .toLowerCase()
    .replace(/`+/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "section";
  const count = used.get(base) || 0;
  used.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
}

function formatBytes(bytes) {
  const number = Number(bytes || 0);
  if (!Number.isFinite(number) || number <= 0) return "";
  if (number < 1024) return `${number} B`;
  if (number < 1024 * 1024) return `${(number / 1024).toFixed(1)} KB`;
  return `${(number / (1024 * 1024)).toFixed(1)} MB`;
}

function markdownToHtml(content, query = "") {
  const lines = String(content || "").split(/\r?\n/);
  const headings = [];
  const usedHeadings = new Map();
  let html = "";
  let inCode = false;
  let listType = "";

  const closeList = () => {
    if (listType) {
      html += `</${listType}>`;
      listType = "";
    }
  };

  for (const line of lines) {
    const fence = line.match(/^```/);
    if (fence) {
      closeList();
      if (inCode) {
        html += "</code></pre>";
        inCode = false;
      } else {
        html += "<pre><code>";
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      html += `${highlightText(line, query)}\n`;
      continue;
    }

    if (!line.trim()) {
      closeList();
      html += "<div class=\"doc-gap\"></div>";
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = Math.min(4, heading[1].length);
      const text = heading[2].trim();
      const id = slugifyHeading(text, usedHeadings);
      headings.push({ id, level, text });
      html += `<h${level} id="${id}">${highlightText(text, query)}</h${level}>`;
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      if (listType !== "ul") {
        closeList();
        html += "<ul>";
        listType = "ul";
      }
      html += `<li>${highlightText(bullet[1], query)}</li>`;
      continue;
    }

    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ordered) {
      if (listType !== "ol") {
        closeList();
        html += "<ol>";
        listType = "ol";
      }
      html += `<li>${highlightText(ordered[1], query)}</li>`;
      continue;
    }

    closeList();
    html += `<p>${highlightText(line, query)}</p>`;
  }

  closeList();
  if (inCode) {
    html += "</code></pre>";
  }
  return { html, headings };
}

function selectedProfiles() {
  const list = [];
  const primary = els.primaryProfile.value;
  const fallback = els.fallbackProfile.value;
  const custom = els.customProfile.value.trim();
  if (primary) list.push(primary);
  if (!els.useOnlyPrimary.checked && fallback && fallback !== primary) list.push(fallback);
  if (custom && !list.includes(custom)) list.push(custom);
  return list;
}

function parseNumberList(value) {
  return String(value || "")
    .split(",")
    .flatMap((part) => {
      const trimmed = part.trim();
      if (!trimmed) {
        return [];
      }
      const range = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
      if (!range) {
        const single = Number(trimmed);
        return Number.isFinite(single) ? [single] : [];
      }
      const start = Number(range[1]);
      const end = Number(range[2]);
      const low = Math.min(start, end);
      const high = Math.max(start, end);
      return Array.from({ length: high - low + 1 }, (_, index) => low + index);
    })
    .filter((number, index, numbers) => Number.isFinite(number) && numbers.indexOf(number) === index);
}

function buildRunBody(rowOverride = null) {
  return {
    input: els.inputPath.value,
    driveSyncDir: els.driveSyncDir.value.trim(),
    updateSourceWorkbook: els.updateSourceWorkbook.checked,
    row: Number(rowOverride || els.rowNumber.value || 2),
    mode: state.mode,
    maxScenes: Number(els.maxScenes.value || 6),
    profiles: selectedProfiles(),
    useAvatar: els.useAvatar.checked,
    avatar: els.avatarChoice.value,
    avatarScenes: els.avatarScenes.value.trim(),
    useIngredients: els.useIngredients.checked,
    ingredientScenes: els.ingredientScenes.value.trim(),
    reuseUrlOnFallback: els.reuseUrl.checked,
    noLocalFallback: els.noLocalFallback.checked
  };
}

function estimateRowCount() {
  const explicitRows = parseNumberList(els.queueRows.value);
  if (explicitRows.length) return explicitRows.length;
  return Math.max(1, Number(els.queueLimit.value || 1));
}

function selectedQuota(profilePathOverride = "") {
  const profilePath = profilePathOverride || els.primaryProfile.value;
  const profile = state.profiles.find((item) => item.path === profilePath);
  return profile?.quota || {
    plan: "Manual / free",
    aiVideoMonthlyLimit: 10,
    avatarMonthlyLimit: 10,
    aiVideoUsed: 0,
    avatarUsed: 0,
    quotaExhausted: false,
    limitStatus: "",
    resetNote: "Monthly reset"
  };
}

function quotaFromFields() {
  const base = selectedQuota();
  const manuallyExhausted = Boolean(els.quotaExhausted?.checked);
  return {
    ...base,
    aiVideoMonthlyLimit: Number(els.quotaAiLimit.value || base.aiVideoMonthlyLimit || 0),
    aiVideoUsed: Number(els.quotaAiUsed.value || 0),
    avatarMonthlyLimit: Number(els.quotaAvatarLimit.value || base.avatarMonthlyLimit || 0),
    avatarUsed: Number(els.quotaAvatarUsed.value || 0),
    quotaExhausted: manuallyExhausted,
    quotaExhaustedAt: manuallyExhausted ? base.quotaExhaustedAt : "",
    limitStatus: manuallyExhausted ? "limit_used" : "",
    lastQuotaHitAt: manuallyExhausted ? base.lastQuotaHitAt : ""
  };
}

function countScenes(value, maxScenes) {
  return parseNumberList(value).filter((scene) => scene >= 1 && scene <= maxScenes).length;
}

function estimateQuota(rowCount = 1) {
  const maxScenes = Math.max(3, Math.min(6, Number(els.maxScenes.value || 6)));
  const generating = state.mode === "google" || state.mode === "google-full";
  if (!generating) {
    return { aiVideo: 0, avatar: 0, total: 0, rowCount };
  }
  const avatarCount = els.useAvatar.checked ? countScenes(els.avatarScenes.value || "1,2,6", maxScenes) : 0;
  return {
    aiVideo: Math.max(0, maxScenes - avatarCount) * rowCount,
    avatar: avatarCount * rowCount,
    total: maxScenes * rowCount,
    rowCount
  };
}

function updateQuotaEstimate() {
  if (!els.quotaEstimate) return;
  const rowCount = estimateRowCount();
  const estimate = estimateQuota(rowCount);
  const quota = quotaFromFields();
  const limitUsed = quotaLimitUsed(quota);
  const aiLeft = limitUsed ? 0 : Math.max(0, Number(quota.aiVideoMonthlyLimit || 0) - Number(quota.aiVideoUsed || 0));
  const avatarLeft = limitUsed ? 0 : Math.max(0, Number(quota.avatarMonthlyLimit || 0) - Number(quota.avatarUsed || 0));
  const enoughAi = estimate.aiVideo <= aiLeft;
  const enoughAvatar = estimate.avatar <= avatarLeft;
  const modeText = {
    prep: "Script/assets only",
    local: "Local MP4",
    google: "Vids Clips",
    "google-full": "All Vids Clips"
  }[state.mode] || state.mode;
  const warning = limitUsed && (state.mode === "google" || state.mode === "google-full")
    ? "Selected profile marked LIMIT USED. Try another profile or use Local MP4."
    : "";
  els.quotaEstimate.textContent = [
    `${modeText}: ${estimate.aiVideo} AI video + ${estimate.avatar} avatar requests for ${rowCount} row(s).`,
    `Left in tracker: ${aiLeft} AI video, ${avatarLeft} avatar.`,
    warning
  ].filter(Boolean).join("\n");
  els.quotaEstimate.style.color = !limitUsed && enoughAi && enoughAvatar ? "#137a42" : "#9f2b22";
}

function applyQuotaToFields(profilePath) {
  const quota = selectedQuota(profilePath);
  els.quotaPlan.value = quota.plan || "Manual / free";
  els.quotaAiLimit.value = quota.aiVideoMonthlyLimit ?? 10;
  els.quotaAiUsed.value = quota.aiVideoUsed ?? 0;
  els.quotaAvatarLimit.value = quota.avatarMonthlyLimit ?? 10;
  els.quotaAvatarUsed.value = quota.avatarUsed ?? 0;
  els.quotaExhausted.checked = quotaLimitUsed(quota);
  const notes = [
    quota.resetNote || "Monthly reset",
    quotaLimitUsed(quota) ? "LIMIT USED: Google Vids generation is exhausted or manually marked." : "",
    quota.quotaNote || "",
    quota.quotaExhaustedAt ? `Limit marked: ${quota.quotaExhaustedAt}` : "",
    quota.lastQuotaHitAt ? `Last quota hit: ${quota.lastQuotaHitAt}` : ""
  ].filter(Boolean);
  els.quotaNote.textContent = notes.join("\n");
  updateQuotaEstimate();
  updateInfoCards();
  renderProfileCenter();
}

function directoryOf(filePath) {
  const text = String(filePath || "");
  const index = text.lastIndexOf("/");
  return index > 0 ? text.slice(0, index) : "";
}

function selectedToolRecord() {
  const selectedRow = Number(els.rowNumber.value || els.toolSelect.value || 0);
  return state.tools.find((tool) => Number(tool.row) === selectedRow) || null;
}

function updateInfoCards() {
  if (!els.selectedToolInfo) return;
  const row = Number(els.rowNumber.value || els.toolSelect.value || 2);
  const scenes = Math.max(3, Math.min(6, Number(els.maxScenes.value || 6)));
  const tool = selectedToolRecord();
  const selectedOption = els.toolSelect.selectedOptions?.[0]?.textContent || "";
  const toolTitle = tool?.name || selectedOption.replace(/^Row\s+\d+\s+-\s+/, "").replace(/\s+\[[^\]]+\]$/, "") || "No tool loaded";
  const toolMeta = [
    Number.isFinite(row) ? `Row ${row}` : "",
    tool?.category ? `Category: ${tool.category}` : "",
    tool?.status ? `Status: ${tool.status}` : "",
    tool?.lastEndedAt ? `Last: ${formatTime(tool.lastEndedAt)}` : "",
    tool?.lastError ? `Issue: ${tool.lastError}` : ""
  ].filter(Boolean).join(" | ");

  const estimate = estimateQuota(estimateRowCount());
  const currentQuota = selectedQuota(els.primaryProfile.value);
  const limitUsed = quotaLimitUsed(currentQuota);
  const loggedIn = state.profiles.filter((profile) => profile.loggedIn).length;
  const limitUsedCount = state.profiles.filter((profile) => quotaLimitUsed(profile.quota)).length;
  const latestHistory = state.history?.[0] || null;
  const outputParts = [
    state.output.video ? "Video ready" : "",
    state.output.generatedFolder ? "Generated folder ready" : "",
    state.output.cacheFolder ? "Vids cache ready" : ""
  ].filter(Boolean);
  const latestOutputParts = [
    latestHistory?.mp4Path ? `Last video: ${shortPath(latestHistory.mp4Path)}` : "",
    latestHistory?.generatedFolder ? `Generated: ${shortPath(latestHistory.generatedFolder)}` : "",
    latestHistory?.endedAt ? formatTime(latestHistory.endedAt) : ""
  ].filter(Boolean);

  els.selectedToolInfo.textContent = toolTitle;
  els.selectedToolMeta.textContent = toolMeta || "Load Excel tools first.";
  els.modeInfo.textContent = modeLabel(state.mode);
  els.modeMeta.textContent = `${scenes} scene(s) | ${estimate.total} Google job estimate`;
  els.profileInfo.textContent = `${state.profiles.length} added, ${loggedIn} login ok`;
  els.profileMeta.textContent = [
    limitUsedCount ? `${limitUsedCount} limit used` : "Quota tracker clean",
    limitUsed ? "Selected profile limit used" : "",
    estimate.aiVideo || estimate.avatar ? `${estimate.aiVideo} AI + ${estimate.avatar} avatar needed` : "No Vids quota in this mode"
  ].filter(Boolean).join(" | ");
  els.outputInfo.textContent = outputParts[0] || (latestHistory ? "Recent output" : "Waiting");
  els.outputMeta.textContent = outputParts.length ? outputParts.join(" | ") : (latestOutputParts.join(" | ") || "Generated folders will appear after a run.");
  els.runHint.textContent = state.activeRunId
    ? `Running ${modeLabel(state.mode)} for row ${row}. Watch terminal logs below.`
    : `Ready for ${modeLabel(state.mode)} on row ${row}.`;
}

function setOutputButtons(report, run) {
  const mp4Path = report?.mp4Path || "";
  const cacheFolder = report?.vidsClipCacheFolder || "";
  const generatedFolder = report?.generatedFolder || "";
  state.output.video = mp4Path;
  state.output.videoFolder = mp4Path ? directoryOf(mp4Path) : "";
  state.output.generatedFolder = generatedFolder;
  state.output.cacheFolder = cacheFolder;
  state.output.runFolder = run?.outputDir || report?.outputDir || "";

  els.openVideoBtn.disabled = !state.output.video;
  els.openVideoFolderBtn.disabled = !state.output.videoFolder;
  els.openGeneratedFolderBtn.disabled = !state.output.generatedFolder;
  els.openCacheFolderBtn.disabled = !state.output.cacheFolder;
  els.openRunFolderBtn.disabled = !state.output.runFolder;

  if (mp4Path) {
    els.videoPreview.style.display = "block";
    els.videoPreview.src = `/file?path=${encodeURIComponent(mp4Path)}`;
  } else {
    els.videoPreview.pause();
    els.videoPreview.removeAttribute("src");
    els.videoPreview.style.display = "none";
  }
  updateInfoCards();
}

async function loadDefaults() {
  const data = await api("/api/defaults");
  els.inputPath.value = data.input;
  els.driveSyncDir.value = data.driveSync?.rootDir || "";
  renderProfiles(data.profiles || []);
  syncProfileSelects(data.profiles || []);
  els.avatarChoice.innerHTML = avatarOptions(data.googleVids?.avatarOptions || [{ label: "Auto Realistic", value: "auto" }]);
  els.avatarChoice.value = data.googleVids?.defaultAvatar || "auto";
  els.avatarScenes.value = data.googleVids?.defaultAvatarScenes || "1,2,6";
  els.ingredientScenes.value = data.googleVids?.defaultIngredientScenes || "3,4,5";

  applyQuotaToFields(els.primaryProfile.value);
  await loadTools();
  await refreshHistory();
  await refreshQueues();
  await loadDocs();
}

async function refreshProfiles(preferred = {}) {
  const data = await api("/api/profiles");
  renderProfiles(data.profiles || []);
  syncProfileSelects(data.profiles || [], preferred);
  applyQuotaToFields(els.primaryProfile.value);
}

async function createProfileFromField() {
  const profileName = els.newProfileName.value.trim();
  const data = await api("/api/profiles", {
    method: "POST",
    body: JSON.stringify({ profile: profileName })
  });
  renderProfiles(data.profiles || []);
  syncProfileSelects(data.profiles || [], {
    primary: data.profile?.path,
    login: data.profile?.path,
    fallback: els.fallbackProfile.value
  });
  els.newProfileName.value = "";
  return data.profile;
}

async function addProfileOnly() {
  resetTerminal("");
  const profile = await createProfileFromField();
  appendTerminal(`Added profile: ${profile?.path}\n`, "system");
  appendTerminal("Profile created. Use Open Login whenever you want to sign in.\n", "system");
}

async function addProfileAndLogin() {
  resetTerminal("");
  const profile = await createProfileFromField();
  appendTerminal(`Added profile: ${profile?.path}\n`, "system");
  await startLogin();
}

async function loadDocs() {
  const data = await api("/api/docs");
  state.docs = data.docs || [];
  state.docCache.clear();
  els.docSelect.innerHTML = state.docs.map((doc) => (
    `<option value="${escapeHtml(doc.path)}">${escapeHtml(doc.title)} - ${escapeHtml(doc.path)}</option>`
  )).join("");
  const preferred = state.docs.find((doc) => doc.path === "docs/master-automation-doc.md") || state.docs[0];
  if (preferred) {
    els.docSelect.value = preferred.path;
    await renderDocView();
  } else {
    els.docTitle.textContent = "Automation docs";
    els.docStats.textContent = "No docs found.";
    els.docToc.innerHTML = "";
    els.docContent.textContent = "No docs found.";
  }
}

async function ensureDocContent(docPath) {
  if (state.docCache.has(docPath)) {
    return state.docCache.get(docPath);
  }
  const data = await api(`/api/docs/read?path=${encodeURIComponent(docPath)}`);
  state.docCache.set(docPath, data.doc);
  return data.doc;
}

async function currentDocPayload() {
  const allDocs = els.docScope.value === "all";
  if (!allDocs) {
    return ensureDocContent(els.docSelect.value || "README.md");
  }

  const docs = await Promise.all(state.docs.map((doc) => ensureDocContent(doc.path)));
  const content = docs.map((doc) => (
    `# ${doc.title || doc.path}\n\nPath: ${doc.path}\n\n${doc.content || ""}`
  )).join("\n\n---\n\n");
  const latestUpdate = state.docs
    .map((doc) => doc.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);
  return {
    path: "__all__",
    title: "All docs one page",
    content,
    docCount: docs.length,
    updatedAt: latestUpdate || ""
  };
}

function renderDocToc(headings) {
  const visible = (headings || []).filter((heading) => heading.level <= 3).slice(0, 60);
  if (!visible.length) {
    els.docToc.innerHTML = `<span class="empty-note">No sections found.</span>`;
    return;
  }
  els.docToc.innerHTML = visible.map((heading) => (
    `<a class="toc-link level-${heading.level}" href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a>`
  )).join("");
}

async function renderDocView() {
  const docPath = els.docSelect.value || "README.md";
  const query = els.docSearch.value.trim();
  const allDocs = els.docScope.value === "all";
  els.docSelect.disabled = allDocs;
  els.docMatchCount.textContent = "Loading";
  const doc = await currentDocPayload();
  const selectedMeta = state.docs.find((item) => item.path === docPath);
  const matchCount = countMatches(doc.content, query);
  const wordCount = String(doc.content || "").trim().split(/\s+/).filter(Boolean).length;
  const { html, headings } = markdownToHtml(doc.content, query);

  els.docTitle.textContent = doc.title || docPath;
  els.docStats.textContent = [
    doc.path === "__all__" ? `${doc.docCount || state.docs.length} documents` : doc.path,
    `${wordCount.toLocaleString()} words`,
    doc.path !== "__all__" && selectedMeta?.bytes ? formatBytes(selectedMeta.bytes) : "",
    doc.updatedAt || selectedMeta?.updatedAt ? `Updated ${formatTime(doc.updatedAt || selectedMeta.updatedAt)}` : ""
  ].filter(Boolean).join(" | ");
  els.docMatchCount.textContent = query ? `${matchCount} match${matchCount === 1 ? "" : "es"}` : "Search ready";
  els.docMatchCount.style.background = query && matchCount === 0 ? "#ffebe9" : query ? "#fff7ed" : "#eaf8ef";
  els.docMatchCount.style.color = query && matchCount === 0 ? "#9f2b22" : query ? "#a65f00" : "#137a42";
  renderDocToc(headings);
  els.docContent.innerHTML = html || "<p>No content.</p>";
}

async function loadTools() {
  setStatus("Loading", "busy");
  const data = await api(`/api/tools?input=${encodeURIComponent(els.inputPath.value)}`);
  state.tools = data.tools || [];
  els.toolSelect.innerHTML = state.tools.map((tool) => {
    const status = tool.status ? ` [${tool.status}]` : "";
    const label = `Row ${tool.row} - ${tool.name}${status}`;
    return `<option value="${tool.row}">${escapeHtml(label)}</option>`;
  }).join("");
  const first = state.tools[0];
  if (first) {
    els.rowNumber.value = first.row;
    els.toolSelect.value = String(first.row);
  }
  setStatus("Ready");
  updateInfoCards();
}

function attachRun(run) {
  if (state.eventSource) {
    state.eventSource.close();
  }
  setActiveTab("run");
  state.activeRunId = run.id;
  state.lastRun = run;
  els.runTitle.textContent = run.id;
  els.runState.textContent = run.status;
  els.stopBtn.disabled = false;
  els.runBtn.disabled = true;
  els.queueBtn.disabled = true;
  els.loginBtn.disabled = true;
  els.retryBtn.disabled = true;
  updateInfoCards();
  setStatus("Running", "busy");

  state.eventSource = new EventSource(`/api/runs/${run.id}/events`);
  state.eventSource.addEventListener("log", (event) => {
    const entry = JSON.parse(event.data);
    appendTerminal(entry.text, entry.stream);
  });
  state.eventSource.addEventListener("status", (event) => {
    const latest = JSON.parse(event.data);
    els.runState.textContent = latest.status;
    if (latest.status !== "running") {
      els.stopBtn.disabled = true;
      els.runBtn.disabled = false;
      els.queueBtn.disabled = Boolean(state.activeQueueId);
      els.loginBtn.disabled = false;
      els.retryBtn.disabled = !state.lastRunBody;
      els.stopQueueBtn.disabled = !state.activeQueueId;
      setStatus(latest.status === "complete" ? "Complete" : "Failed", latest.status === "complete" ? "ready" : "error");
      state.activeRunId = "";
      state.eventSource.close();
      state.eventSource = null;
      showResult(latest);
      refreshHistory().catch(() => {});
      loadTools().catch(() => {});
    }
  });
  state.eventSource.onerror = () => {
    appendTerminal("\nConnection to terminal stream was interrupted.\n", "stderr");
  };
}

function showResult(run) {
  state.lastRun = run;
  const report = run.report;
  setOutputButtons(report, run);
  if (report?.mp4Path) {
    const isLocalFallback = report.mode === "generate_export" && report.fallback === "local_remotion";
    els.resultTitle.textContent = isLocalFallback ? "Local fallback video ready" : "Video ready";
    const parts = [
      `MP4: ${report.mp4Path}`,
      report.driveVideoPath ? `Drive video: ${report.driveVideoPath}` : "",
      report.driveFolderPath ? `Drive folder: ${report.driveFolderPath}` : "",
      report.vidsUrl ? `Google Vids: ${report.vidsUrl}` : "",
      report.vidsSceneClips?.length ? `Vids scene clips: ${report.vidsSceneClips.length}` : "",
      report.generatedFolder ? `Generated: ${report.generatedFolder}` : "",
      report.generatedFiles?.length ? `Generated saved: ${report.generatedFiles.length}` : "",
      report.vidsClipCacheFolder ? `Vids cache: ${report.vidsClipCacheFolder}` : "",
      report.cachedVidsClips?.length ? `Cached clips: ${report.cachedVidsClips.length}` : "",
      isLocalFallback && report.googleVidsError ? `Why: Google Vids failed before final export, so local MP4 was rendered.` : "",
      report.partialGeneratedScenes?.length ? `Vids scenes inserted before failure: ${report.partialGeneratedScenes.join(", ")}` : "",
      `Workbook: ${report.preparedWorkbook || ""}`
    ].filter(Boolean);
    els.resultMeta.textContent = parts.join("\n");
    return;
  }
  if (report?.vidsUrl) {
    els.resultTitle.textContent = "Google Vids link ready";
    els.resultMeta.textContent = [
      report.vidsUrl,
      report.generatedFolder ? `Generated: ${report.generatedFolder}` : "",
      report.vidsClipCacheFolder ? `Vids cache: ${report.vidsClipCacheFolder}` : ""
    ].filter(Boolean).join("\n");
    return;
  }
  if (report?.generatedFolder || report?.vidsClipCacheFolder) {
    els.resultTitle.textContent = run.status === "complete" ? "Assets ready" : "Run failed";
    els.resultMeta.textContent = [
      report.generatedFolder ? `Generated: ${report.generatedFolder}` : "",
      report.vidsClipCacheFolder ? `Vids cache: ${report.vidsClipCacheFolder}` : "",
      report.preparedWorkbook ? `Workbook: ${report.preparedWorkbook}` : "",
      report.error || ""
    ].filter(Boolean).join("\n");
    return;
  }
  els.resultTitle.textContent = run.status === "complete" ? "Run complete" : "Run failed";
  els.resultMeta.textContent = report?.error || run.outputDir || "Check terminal output.";
}

function modeLabel(mode) {
  return {
    prep: "Script + Assets",
    local: "Local MP4",
    google: "Vids Clips",
    "google-full": "All Vids Clips",
    local_only: "Local MP4",
    generate_export: "Vids Clips",
    prep_only: "Script + Assets",
    dry_run: "Prompt Fill"
  }[mode] || mode || "Run";
}

function shortPath(filePath) {
  const text = String(filePath || "");
  if (!text) return "";
  const parts = text.split("/");
  return parts.length > 3 ? `${parts.at(-3)}/${parts.at(-2)}/${parts.at(-1)}` : text;
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function pillClass(status) {
  return String(status || "").replace(/[^a-z0-9_-]+/gi, "_").toLowerCase();
}

function renderQueue(queue) {
  if (!queue) return;
  const done = (queue.counts.complete || 0) + (queue.counts.failed || 0) + (queue.counts.canceled || 0) + (queue.counts.paused || 0);
  els.queueTitle.textContent = `${queue.status} (${done}/${queue.total})`;
  const estimate = queue.quotaEstimate || {};
  els.queueMeta.textContent = [
    queue.note || "",
    queue.progressWorkbook ? `Progress workbook: ${shortPath(queue.progressWorkbook)}` : "",
    queue.progressWorkbookError ? `Workbook update issue: ${queue.progressWorkbookError}` : "",
    `Estimate: ${estimate.aiVideoClips || 0} AI video + ${estimate.avatarClips || 0} avatar requests.`,
    queue.activeRunId ? `Active run: ${queue.activeRunId}` : ""
  ].filter(Boolean).join("\n");
  const progressItem = queue.progressWorkbook ? `
    <div class="mini-item">
      <div class="mini-item-header">
        <div class="mini-title">Queue progress workbook</div>
        <span class="pill ready">LIVE</span>
      </div>
      <div class="mini-meta">${escapeHtml(queue.progressWorkbook)}</div>
      <div class="mini-actions">
        <button class="secondary-button" data-action="open-path" data-path="${escapeHtml(queue.progressWorkbook)}" type="button">Open Workbook</button>
        <button class="secondary-button" data-action="open-path" data-path="${escapeHtml(directoryOf(queue.progressWorkbook))}" type="button">Folder</button>
      </div>
    </div>
  ` : "";
  els.queueList.innerHTML = progressItem + queue.items.map((item) => {
    const report = item.report || {};
    const title = report.toolName || `Excel row ${item.row}`;
    const meta = [
      `Row ${item.row}`,
      report.mp4Path ? `Video: ${shortPath(report.mp4Path)}` : "",
      report.driveVideoPath ? `Drive video: ${shortPath(report.driveVideoPath)}` : "",
      report.driveFolderPath ? `Drive: ${shortPath(report.driveFolderPath)}` : "",
      report.vidsSceneClips?.length ? `Scene clips: ${report.vidsSceneClips.length}` : "",
      report.generatedFolder ? `Generated: ${shortPath(report.generatedFolder)}` : "",
      report.vidsClipCacheFolder ? `Cache: ${shortPath(report.vidsClipCacheFolder)}` : "",
      report.error ? `Error: ${report.error}` : "",
      item.endedAt ? `Ended: ${formatTime(item.endedAt)}` : ""
    ].filter(Boolean).join("\n");
    const actions = [
      item.runId ? `<button class="secondary-button" data-action="attach-run" data-run-id="${escapeHtml(item.runId)}" type="button">Logs</button>` : "",
      report.mp4Path ? `<button class="secondary-button" data-action="preview-path" data-path="${escapeHtml(report.mp4Path)}" type="button">Preview</button>` : "",
      report.mp4Path ? `<button class="secondary-button" data-action="open-path" data-path="${escapeHtml(directoryOf(report.mp4Path))}" type="button">Folder</button>` : "",
      report.driveVideoPath ? `<button class="secondary-button" data-action="preview-path" data-path="${escapeHtml(report.driveVideoPath)}" type="button">Drive Preview</button>` : "",
      report.driveFolderPath ? `<button class="secondary-button" data-action="open-path" data-path="${escapeHtml(report.driveFolderPath)}" type="button">Drive</button>` : "",
      report.generatedFolder ? `<button class="secondary-button" data-action="open-path" data-path="${escapeHtml(report.generatedFolder)}" type="button">Generated</button>` : "",
      report.vidsClipCacheFolder ? `<button class="secondary-button" data-action="open-path" data-path="${escapeHtml(report.vidsClipCacheFolder)}" type="button">Cache</button>` : "",
      item.status === "failed" || item.status === "paused" ? `<button class="secondary-button" data-action="retry-row" data-row="${item.row}" type="button">Retry</button>` : ""
    ].filter(Boolean).join("");
    return `
      <div class="mini-item">
        <div class="mini-item-header">
          <div class="mini-title">${escapeHtml(title)}</div>
          <span class="pill ${pillClass(item.status)}">${escapeHtml(item.status)}</span>
        </div>
        <div class="mini-meta">${escapeHtml(meta)}</div>
        ${actions ? `<div class="mini-actions">${actions}</div>` : ""}
      </div>
    `;
  }).join("");
}

function renderHistory(history) {
  state.history = history || [];
  if (!state.history.length) {
    els.historyList.innerHTML = `<div class="mini-item"><div class="mini-meta">No recent videos yet.</div></div>`;
    updateInfoCards();
    return;
  }
  els.historyList.innerHTML = state.history.slice(0, 12).map((entry) => {
    const title = entry.toolName || `Excel row ${entry.row}`;
    const meta = [
      `${modeLabel(entry.mode)} - Row ${entry.row}`,
      entry.mp4Path ? `Video: ${shortPath(entry.mp4Path)}` : "",
      entry.driveVideoPath ? `Drive video: ${shortPath(entry.driveVideoPath)}` : "",
      entry.driveFolderPath ? `Drive: ${shortPath(entry.driveFolderPath)}` : "",
      entry.vidsSceneClips?.length ? `Scene clips: ${entry.vidsSceneClips.length}` : "",
      entry.generatedFolder ? `Generated: ${shortPath(entry.generatedFolder)}` : "",
      entry.vidsClipCacheFolder ? `Cache: ${shortPath(entry.vidsClipCacheFolder)}` : "",
      entry.vidsUrl ? "Google Vids link saved" : "",
      entry.error ? `Issue: ${entry.error}` : "",
      entry.endedAt ? formatTime(entry.endedAt) : ""
    ].filter(Boolean).join("\n");
    const actions = [
      `<button class="secondary-button" data-action="retry-row" data-row="${entry.row}" type="button">Retry</button>`,
      entry.mp4Path ? `<button class="secondary-button" data-action="preview-path" data-path="${escapeHtml(entry.mp4Path)}" type="button">Preview</button>` : "",
      entry.mp4Path ? `<button class="secondary-button" data-action="open-path" data-path="${escapeHtml(directoryOf(entry.mp4Path))}" type="button">Folder</button>` : "",
      entry.driveVideoPath ? `<button class="secondary-button" data-action="preview-path" data-path="${escapeHtml(entry.driveVideoPath)}" type="button">Drive Preview</button>` : "",
      entry.driveFolderPath ? `<button class="secondary-button" data-action="open-path" data-path="${escapeHtml(entry.driveFolderPath)}" type="button">Drive</button>` : "",
      entry.generatedFolder ? `<button class="secondary-button" data-action="open-path" data-path="${escapeHtml(entry.generatedFolder)}" type="button">Generated</button>` : "",
      entry.vidsClipCacheFolder ? `<button class="secondary-button" data-action="open-path" data-path="${escapeHtml(entry.vidsClipCacheFolder)}" type="button">Cache</button>` : "",
      entry.outputDir ? `<button class="secondary-button" data-action="open-path" data-path="${escapeHtml(entry.outputDir)}" type="button">Run</button>` : ""
    ].filter(Boolean).join("");
    return `
      <div class="mini-item">
        <div class="mini-item-header">
          <div class="mini-title">${escapeHtml(title)}</div>
          <span class="pill ${pillClass(entry.status)}">${escapeHtml(entry.status)}</span>
        </div>
        <div class="mini-meta">${escapeHtml(meta)}</div>
        <div class="mini-actions">${actions}</div>
      </div>
    `;
  }).join("");
  updateInfoCards();
}

async function refreshHistory() {
  const data = await api("/api/history?limit=20");
  renderHistory(data.history);
}

async function startOneVideo() {
  resetTerminal("");
  const body = buildRunBody();
  state.lastRunBody = body;
  const data = await api("/api/runs", {
    method: "POST",
    body: JSON.stringify(body)
  });
  attachRun(data.run);
}

async function retryLastRun() {
  if (!state.lastRunBody) return;
  resetTerminal("");
  const data = await api("/api/runs", {
    method: "POST",
    body: JSON.stringify(state.lastRunBody)
  });
  attachRun(data.run);
}

async function saveQuota() {
  const profile = els.primaryProfile.value;
  await api("/api/quota", {
    method: "POST",
    body: JSON.stringify({
      profile,
      plan: els.quotaPlan.value,
      aiVideoMonthlyLimit: Number(els.quotaAiLimit.value || 0),
      aiVideoUsed: Number(els.quotaAiUsed.value || 0),
      avatarMonthlyLimit: Number(els.quotaAvatarLimit.value || 0),
      avatarUsed: Number(els.quotaAvatarUsed.value || 0),
      quotaExhausted: els.quotaExhausted.checked
    })
  });
  const data = await api("/api/defaults");
  renderProfiles(data.profiles || []);
  syncProfileSelects(data.profiles || [], { primary: profile });
  applyQuotaToFields(profile);
  appendTerminal("Quota tracker saved.\n", "system");
}

async function startLogin() {
  resetTerminal("");
  const profile = els.loginProfile.value || els.primaryProfile.value;
  const data = await api("/api/profile-login", {
    method: "POST",
    body: JSON.stringify({ profile })
  });
  attachRun(data.run);
}

async function stopActiveRun() {
  if (!state.activeRunId) return;
  await api(`/api/runs/${state.activeRunId}/stop`, { method: "POST", body: "{}" });
}

async function startQueue() {
  resetTerminal("");
  setActiveTab("queue");
  const body = {
    ...buildRunBody(Number(els.queueStartRow.value || els.rowNumber.value || 2)),
    startRow: Number(els.queueStartRow.value || els.rowNumber.value || 2),
    queueLimit: Number(els.queueLimit.value || 1),
    rows: els.queueRows.value.trim()
  };
  state.lastRunBody = body;
  const data = await api("/api/queues", {
    method: "POST",
    body: JSON.stringify(body)
  });
  state.activeQueueId = data.queue.id;
  els.queueBtn.disabled = true;
  els.stopQueueBtn.disabled = false;
  setStatus("Queue running", "busy");
  renderQueue(data.queue);
  pollQueue();
}

async function stopActiveQueue() {
  if (!state.activeQueueId) return;
  const data = await api(`/api/queues/${state.activeQueueId}/stop`, {
    method: "POST",
    body: "{}"
  });
  renderQueue(data.queue);
}

async function refreshQueues() {
  const data = await api("/api/queues");
  const latest = data.queues[0];
  if (latest) {
    renderQueue(latest);
  }
}

async function pollQueue() {
  if (state.queueTimer) {
    clearTimeout(state.queueTimer);
  }
  if (!state.activeQueueId) return;
  try {
    const data = await api(`/api/queues/${state.activeQueueId}`);
    const queue = data.queue;
    renderQueue(queue);
    if (queue.activeRunId && queue.activeRunId !== state.activeRunId) {
      const runData = await api(`/api/runs/${queue.activeRunId}`);
      attachRun(runData.run);
    }
    const active = queue.status === "queued" || queue.status === "running" || queue.status === "canceling";
    if (active) {
      state.queueTimer = setTimeout(() => pollQueue(), 2500);
    } else {
      els.queueBtn.disabled = false;
      els.stopQueueBtn.disabled = true;
      state.activeQueueId = "";
      setStatus(queue.status === "complete" ? "Complete" : queue.status === "paused_quota" ? "Quota paused" : "Ready", queue.status === "paused_quota" ? "error" : "ready");
      await refreshHistory();
      await loadTools();
    }
  } catch (error) {
    appendTerminal(`\nQueue poll failed: ${error.message}\n`, "stderr");
    state.queueTimer = setTimeout(() => pollQueue(), 4000);
  }
}

async function openPathTarget(target) {
  if (!target) return;
  await api("/api/open", {
    method: "POST",
    body: JSON.stringify({ path: target })
  });
}

function previewPath(target) {
  if (!target) return;
  const pseudoRun = { outputDir: directoryOf(target) };
  const pseudoReport = { mp4Path: target };
  setOutputButtons(pseudoReport, pseudoRun);
  els.resultTitle.textContent = "Preview loaded";
  els.resultMeta.textContent = target;
}

async function attachRunById(runId) {
  const data = await api(`/api/runs/${runId}`);
  attachRun(data.run);
}

async function retryRow(row) {
  if (!row) return;
  els.rowNumber.value = String(row);
  const match = Array.from(els.toolSelect.options).find((option) => option.value === String(row));
  if (match) {
    els.toolSelect.value = match.value;
  }
  resetTerminal("");
  const body = buildRunBody(row);
  state.lastRunBody = body;
  const data = await api("/api/runs", {
    method: "POST",
    body: JSON.stringify(body)
  });
  attachRun(data.run);
}

async function openOutput(kind) {
  const target = state.output[kind];
  if (!target) return;
  try {
    await openPathTarget(target);
  } catch (error) {
    appendTerminal(`\nOpen failed: ${error.message}\n`, "stderr");
  }
}

document.querySelectorAll(".segment").forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

els.useAvatar.addEventListener("change", () => setMode(state.mode));
els.useIngredients.addEventListener("change", () => setMode(state.mode));
els.primaryProfile.addEventListener("change", () => applyQuotaToFields(els.primaryProfile.value));
els.fallbackProfile.addEventListener("change", () => {
  updateQuotaEstimate();
  updateInfoCards();
  renderProfileCenter();
});
els.refreshProfilesBtn.addEventListener("click", () => {
  refreshProfiles().catch((error) => {
    setStatus("Error", "error");
    appendTerminal(`${error.message}\n`, "stderr");
  });
});
els.profileCenterRefreshBtn.addEventListener("click", () => {
  refreshProfiles().catch((error) => {
    setStatus("Error", "error");
    appendTerminal(`${error.message}\n`, "stderr");
  });
});
els.addProfileOnlyBtn.addEventListener("click", () => {
  addProfileOnly().catch((error) => {
    setStatus("Error", "error");
    appendTerminal(`${error.message}\n`, "stderr");
    els.runBtn.disabled = false;
    els.queueBtn.disabled = false;
    els.loginBtn.disabled = false;
  });
});
els.addProfileBtn.addEventListener("click", () => {
  addProfileAndLogin().catch((error) => {
    setStatus("Error", "error");
    appendTerminal(`${error.message}\n`, "stderr");
    els.runBtn.disabled = false;
    els.queueBtn.disabled = false;
    els.loginBtn.disabled = false;
  });
});
els.docSelect.addEventListener("change", () => {
  renderDocView().catch((error) => {
    els.docContent.textContent = error.message;
  });
});
els.docScope.addEventListener("change", () => {
  renderDocView().catch((error) => {
    els.docContent.textContent = error.message;
  });
});
els.docSearch.addEventListener("input", () => {
  renderDocView().catch((error) => {
    els.docContent.textContent = error.message;
  });
});
els.refreshDocsBtn.addEventListener("click", () => {
  loadDocs().catch((error) => {
    els.docContent.textContent = error.message;
  });
});
[
  els.maxScenes,
  els.queueLimit,
  els.queueRows,
  els.driveSyncDir,
  els.updateSourceWorkbook,
  els.avatarScenes,
  els.ingredientScenes,
  els.quotaAiLimit,
  els.quotaAiUsed,
  els.quotaAvatarLimit,
  els.quotaAvatarUsed
].forEach((element) => {
  element.addEventListener("input", () => {
    updateQuotaEstimate();
    updateInfoCards();
  });
});

els.quotaExhausted.addEventListener("change", () => {
  updateQuotaEstimate();
  updateInfoCards();
});

els.loadToolsBtn.addEventListener("click", () => {
  loadTools().catch((error) => {
    setStatus("Error", "error");
    resetTerminal(`${error.message}\n`);
  });
});

els.toolSelect.addEventListener("change", () => {
  els.rowNumber.value = els.toolSelect.value;
  els.queueStartRow.value = els.toolSelect.value;
  updateQuotaEstimate();
  updateInfoCards();
});

els.rowNumber.addEventListener("input", () => {
  const match = Array.from(els.toolSelect.options).find((option) => option.value === els.rowNumber.value);
  if (match) {
    els.toolSelect.value = match.value;
  }
  els.queueStartRow.value = els.rowNumber.value || "2";
  updateInfoCards();
});

els.runBtn.addEventListener("click", () => {
  startOneVideo().catch((error) => {
    setStatus("Error", "error");
    appendTerminal(`${error.message}\n`, "stderr");
    els.runBtn.disabled = false;
    els.queueBtn.disabled = false;
    els.loginBtn.disabled = false;
  });
});

els.queueBtn.addEventListener("click", () => {
  startQueue().catch((error) => {
    setStatus("Error", "error");
    appendTerminal(`${error.message}\n`, "stderr");
    els.queueBtn.disabled = false;
    els.runBtn.disabled = false;
    els.loginBtn.disabled = false;
  });
});

els.stopQueueBtn.addEventListener("click", () => {
  stopActiveQueue().catch((error) => appendTerminal(`${error.message}\n`, "stderr"));
});

els.retryBtn.addEventListener("click", () => {
  retryLastRun().catch((error) => {
    setStatus("Error", "error");
    appendTerminal(`${error.message}\n`, "stderr");
  });
});

els.saveQuotaBtn.addEventListener("click", () => {
  saveQuota().catch((error) => {
    setStatus("Error", "error");
    appendTerminal(`${error.message}\n`, "stderr");
  });
});

els.loginBtn.addEventListener("click", () => {
  startLogin().catch((error) => {
    setStatus("Error", "error");
    appendTerminal(`${error.message}\n`, "stderr");
    els.runBtn.disabled = false;
    els.queueBtn.disabled = false;
    els.loginBtn.disabled = false;
  });
});

els.stopBtn.addEventListener("click", () => {
  stopActiveRun().catch((error) => appendTerminal(`${error.message}\n`, "stderr"));
});

els.openVideoBtn.addEventListener("click", () => openOutput("video"));
els.openVideoFolderBtn.addEventListener("click", () => openOutput("videoFolder"));
els.openGeneratedFolderBtn.addEventListener("click", () => openOutput("generatedFolder"));
els.openCacheFolderBtn.addEventListener("click", () => openOutput("cacheFolder"));
els.openRunFolderBtn.addEventListener("click", () => openOutput("runFolder"));

document.addEventListener("click", (event) => {
  const tocLink = event.target.closest(".toc-link");
  if (tocLink) {
    event.preventDefault();
    const target = els.docContent.querySelector(tocLink.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return;
  }

  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "preview-path") {
    previewPath(button.dataset.path);
  } else if (action === "open-path") {
    openPathTarget(button.dataset.path).catch((error) => appendTerminal(`${error.message}\n`, "stderr"));
  } else if (action === "attach-run") {
    attachRunById(button.dataset.runId).catch((error) => appendTerminal(`${error.message}\n`, "stderr"));
  } else if (action === "retry-row") {
    retryRow(Number(button.dataset.row)).catch((error) => appendTerminal(`${error.message}\n`, "stderr"));
  } else if (action === "profile-primary") {
    els.primaryProfile.value = button.dataset.profile;
    applyQuotaToFields(button.dataset.profile);
    appendTerminal(`Primary profile selected: ${button.dataset.profile}\n`, "system");
  } else if (action === "profile-fallback") {
    els.fallbackProfile.value = button.dataset.profile;
    updateQuotaEstimate();
    updateInfoCards();
    renderProfileCenter();
    appendTerminal(`Fallback profile selected: ${button.dataset.profile}\n`, "system");
  } else if (action === "profile-login") {
    els.loginProfile.value = button.dataset.profile;
    startLogin().catch((error) => appendTerminal(`${error.message}\n`, "stderr"));
  }
});

setActiveTab(state.activeTab);
setMode(state.mode);
loadDefaults().catch((error) => {
  setStatus("Error", "error");
  resetTerminal(`${error.message}\n`);
});
