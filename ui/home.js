const els = {
  fileInput: document.getElementById("excelFileInput"),
  defaultBtn: document.getElementById("defaultBtn"),
  openTrackerExcelBtn: document.getElementById("openTrackerExcelBtn"),
  importBtn: document.getElementById("importBtn"),
  analysisState: document.getElementById("analysisState"),
  fileName: document.getElementById("fileName"),
  fileHint: document.getElementById("fileHint"),
  analysisResults: document.getElementById("analysisResults"),
  toolRows: document.getElementById("toolRows"),
  columnCount: document.getElementById("columnCount"),
  urlCount: document.getElementById("urlCount"),
  scriptCount: document.getElementById("scriptCount"),
  headerList: document.getElementById("headerList"),
  warningList: document.getElementById("warningList"),
  previewTitle: document.getElementById("previewTitle"),
  savedPath: document.getElementById("savedPath"),
  previewBody: document.getElementById("previewBody"),
  taskNotice: document.getElementById("taskNotice"),
  taskName: document.getElementById("taskName"),
  taskDetail: document.getElementById("taskDetail"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  themeToggleIcon: document.getElementById("themeToggleIcon"),
  themeToggleText: document.getElementById("themeToggleText"),
  workspace: document.querySelector(".clean-workspace"),
  flowSteps: [...document.querySelectorAll("[data-flow-step]")],
  workspaceResizer: document.getElementById("workspaceResizer"),
  terminalPane: document.getElementById("terminalPane"),
  terminalStatus: document.getElementById("terminalStatus"),
  terminalOutput: document.getElementById("terminalOutput"),
  terminalFullscreenBtn: document.getElementById("terminalFullscreenBtn"),
  clearTerminalBtn: document.getElementById("clearTerminalBtn"),
  loadStepLink: document.getElementById("loadStepLink"),
  selectStepLink: document.getElementById("selectStepLink"),
  assetStepLink: document.getElementById("assetStepLink"),
  scriptStepLink: document.getElementById("scriptStepLink"),
  hookStepLink: document.getElementById("hookStepLink"),
  finalStepLink: document.getElementById("finalStepLink"),
  profileStepLink: document.getElementById("profileStepLink"),
  loadStepMeta: document.getElementById("loadStepMeta"),
  selectStepMeta: document.getElementById("selectStepMeta"),
  assetStepMeta: document.getElementById("assetStepMeta"),
  scriptStepMeta: document.getElementById("scriptStepMeta"),
  hookStepMeta: document.getElementById("hookStepMeta"),
  finalStepMeta: document.getElementById("finalStepMeta"),
  profileStepMeta: document.getElementById("profileStepMeta"),
  toolSearchInput: document.getElementById("toolSearchInput"),
  toolOptionCount: document.getElementById("toolOptionCount"),
  artifactNotice: document.getElementById("artifactNotice"),
  artifactNoticeTitle: document.getElementById("artifactNoticeTitle"),
  artifactNoticeDetail: document.getElementById("artifactNoticeDetail"),
  useExistingAssetsBtn: document.getElementById("useExistingAssetsBtn"),
  generateNewAssetsBtn: document.getElementById("generateNewAssetsBtn"),
  useExistingScriptBtn: document.getElementById("useExistingScriptBtn"),
  assetState: document.getElementById("assetState"),
  scriptState: document.getElementById("scriptState"),
  hookState: document.getElementById("hookState"),
  finalState: document.getElementById("finalState"),
  assetRowInput: document.getElementById("assetRowInput"),
  toolSelect: document.getElementById("toolSelect"),
  selectedToolName: document.getElementById("selectedToolName"),
  buildAssetsBtn: document.getElementById("buildAssetsBtn"),
  viewAssetsBtn: document.getElementById("viewAssetsBtn"),
  scriptLanguageSelect: document.getElementById("scriptLanguageSelect"),
  scriptSceneCount: document.getElementById("scriptSceneCount"),
  generateScriptBtn: document.getElementById("generateScriptBtn"),
  viewScriptFolderBtn: document.getElementById("viewScriptFolderBtn"),
  hookPresenterSelect: document.getElementById("hookPresenterSelect"),
  hookCharacterSelect: document.getElementById("hookCharacterSelect"),
  hookToneSelect: document.getElementById("hookToneSelect"),
  hookDurationSelect: document.getElementById("hookDurationSelect"),
  hookPrimaryProfileSelect: document.getElementById("hookPrimaryProfileSelect"),
  hookFallbackEnabled: document.getElementById("hookFallbackEnabled"),
  hookFallbackProfileSelect: document.getElementById("hookFallbackProfileSelect"),
  hookProfileStatus: document.getElementById("hookProfileStatus"),
  refreshHookProfilesBtn: document.getElementById("refreshHookProfilesBtn"),
  addHookProfileBtn: document.getElementById("addHookProfileBtn"),
  loginHookProfileBtn: document.getElementById("loginHookProfileBtn"),
  profileState: document.getElementById("profileState"),
  profileManagerSummary: document.getElementById("profileManagerSummary"),
  profileManagerList: document.getElementById("profileManagerList"),
  newHookProfileName: document.getElementById("newHookProfileName"),
  profileRefreshBtn: document.getElementById("profileRefreshBtn"),
  profileAddBtn: document.getElementById("profileAddBtn"),
  profileAddLoginBtn: document.getElementById("profileAddLoginBtn"),
  profileLoginSelectedBtn: document.getElementById("profileLoginSelectedBtn"),
  prepareHookAvatarBtn: document.getElementById("prepareHookAvatarBtn"),
  generateHookAvatarBtn: document.getElementById("generateHookAvatarBtn"),
  viewHookAvatarBtn: document.getElementById("viewHookAvatarBtn"),
  finalVoiceProviderSelect: document.getElementById("finalVoiceProviderSelect"),
  generateRemainingVidsBtn: document.getElementById("generateRemainingVidsBtn"),
  playVoiceoverBtn: document.getElementById("playVoiceoverBtn"),
  renderFinalReelBtn: document.getElementById("renderFinalReelBtn"),
  viewFinalFolderBtn: document.getElementById("viewFinalFolderBtn"),
  assetResult: document.getElementById("assetResult"),
  assetToolName: document.getElementById("assetToolName"),
  assetFileCount: document.getElementById("assetFileCount"),
  assetFolderPath: document.getElementById("assetFolderPath"),
  assetSummary: document.getElementById("assetSummary"),
  assetFileList: document.getElementById("assetFileList"),
  scriptResult: document.getElementById("scriptResult"),
  scriptToolName: document.getElementById("scriptToolName"),
  scriptDuration: document.getElementById("scriptDuration"),
  scriptFolderPath: document.getElementById("scriptFolderPath"),
  scriptParts: document.getElementById("scriptParts"),
  scriptSceneCountLabel: document.getElementById("scriptSceneCountLabel"),
  scriptSceneList: document.getElementById("scriptSceneList"),
  hookResult: document.getElementById("hookResult"),
  hookToolName: document.getElementById("hookToolName"),
  hookStatusText: document.getElementById("hookStatusText"),
  hookFolderPath: document.getElementById("hookFolderPath"),
  hookScriptText: document.getElementById("hookScriptText"),
  hookPromptText: document.getElementById("hookPromptText"),
  hookFileList: document.getElementById("hookFileList"),
  hookVideoPreview: document.getElementById("hookVideoPreview"),
  finalPipeline: document.getElementById("finalPipeline"),
  finalResult: document.getElementById("finalResult"),
  finalToolName: document.getElementById("finalToolName"),
  finalStatusText: document.getElementById("finalStatusText"),
  finalFolderPath: document.getElementById("finalFolderPath"),
  finalSummary: document.getElementById("finalSummary"),
  finalVideoPreview: document.getElementById("finalVideoPreview"),
  voiceoverPreviewBox: document.getElementById("voiceoverPreviewBox"),
  voiceoverAudioPreview: document.getElementById("voiceoverAudioPreview"),
  voiceoverPreviewInfo: document.getElementById("voiceoverPreviewInfo"),
  finalFileList: document.getElementById("finalFileList")
};

const state = {
  inputPath: "",
  tools: [],
  filteredTools: [],
  lastAssetFolder: "",
  lastAssetRow: 0,
  lastAssetInput: "",
  lastScriptFolder: "",
  lastHookAvatarFolder: "",
  lastHookAvatarVideo: "",
  lastHookAvatarRunId: "",
  lastFinalReelFolder: "",
  lastFinalReelVideo: "",
  lastFinalReelRunId: "",
  lastFinalReelRow: 0,
  lastVidsVoiceoverExport: "",
  lastVoiceoverPreviewUrl: "",
  lastVoiceoverPreviewName: "",
  currentRow: 0,
  currentInput: "",
  latestArtifacts: null,
  artifactCheckTimer: null,
  artifactCheckToken: 0,
  assetEventSource: null,
  hookAvatarEventSource: null,
  finalReelEventSource: null,
  hookProfiles: [],
  hookAvatarOptions: [],
  terminalWidth: 340,
  isResizingTerminal: false,
  resizeStartX: 0,
  resizeMoved: false
};

const TERMINAL_LAYOUT_KEY = "toolReelFactory.terminalWidth.v2";
const THEME_KEY = "toolReelFactory.theme.v2";
const DEFAULT_TERMINAL_WIDTH = 340;
const MIN_TERMINAL_WIDTH = 280;
const MAX_TERMINAL_WIDTH = 720;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function timeLabel(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function readSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || "";
  } catch {
    return "";
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore storage failures; the live theme still updates.
  }
}

function currentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  const isDark = nextTheme === "dark";
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme;
  if (els.themeToggleBtn) {
    els.themeToggleBtn.setAttribute("aria-pressed", String(isDark));
    els.themeToggleBtn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  }
  if (els.themeToggleIcon) {
    els.themeToggleIcon.textContent = isDark ? "L" : "D";
  }
  if (els.themeToggleText) {
    els.themeToggleText.textContent = isDark ? "Light" : "Dark";
  }
}

function hookCharacterLabel(value) {
  const selected = state.hookAvatarOptions.find((option) => option.value === value);
  if (selected) return selected.label;
  if (value === "auto_by_reel") return "Auto by reel";
  if (value === "auto") return "Google Vids auto";
  return value || "Auto by reel";
}

function renderHookCharacterOptions(options = [], preferred = "") {
  if (!els.hookCharacterSelect) return;
  const normalized = [
    { label: "Auto by reel", value: "auto_by_reel" },
    ...options.filter((option) => option?.value && option.value !== "auto_by_reel")
  ];
  const seen = new Set();
  state.hookAvatarOptions = normalized.filter((option) => {
    const key = String(option.value || "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const current = preferred || els.hookCharacterSelect.value || "auto_by_reel";
  els.hookCharacterSelect.innerHTML = state.hookAvatarOptions.map((option) => (
    `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label || option.value)}</option>`
  )).join("");
  els.hookCharacterSelect.value = state.hookAvatarOptions.some((option) => option.value === current)
    ? current
    : "auto_by_reel";
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

function hookProfileIdentity(profile = {}, index = 0) {
  return profile.email || profile.googleName || profile.profileName || profile.label || `Profile ${index + 1}`;
}

function hookProfileStatus(profile = {}) {
  if (profile.statusLabel && profile.status) {
    const tone = profile.status === "available"
      ? "success"
      : profile.status === "limit_used"
        ? "error"
        : "warn";
    return { label: profile.statusLabel, tone };
  }
  if (quotaLimitUsed(profile.quota)) {
    return { label: "Limit used", tone: "error" };
  }
  if (!profile.exists) {
    return { label: "Folder missing", tone: "warn" };
  }
  if (!profile.loggedIn) {
    return { label: "Login needed", tone: "warn" };
  }
  return { label: "Available", tone: "success" };
}

function hookProfileUsage(profile = {}) {
  const quota = profile.quota || {};
  const avatarLimit = Number(quota.avatarMonthlyLimit || 0);
  const avatarUsed = Number(quota.avatarUsed || 0);
  const aiLimit = Number(quota.aiVideoMonthlyLimit || 0);
  const aiUsed = Number(quota.aiVideoUsed || 0);
  const avatarText = avatarLimit > 0 ? `Avatar ${avatarUsed}/${avatarLimit}` : `Avatar ${avatarUsed}/manual`;
  const aiText = aiLimit > 0 ? `AI ${aiUsed}/${aiLimit}` : `AI ${aiUsed}/manual`;
  return `${avatarText} | ${aiText}`;
}

function profileNameFromPath(profilePath = "") {
  return String(profilePath || "").split(/[\\/]+/).filter(Boolean).pop() || "";
}

function setProfileState(label, tone = "idle") {
  if (els.profileState) {
    els.profileState.textContent = label;
    els.profileState.dataset.tone = tone;
  }
  if (els.profileStepMeta) {
    els.profileStepMeta.textContent = label;
  }
  if (els.profileStepLink) {
    els.profileStepLink.classList.toggle("busy", tone === "busy");
    els.profileStepLink.classList.toggle("done", tone === "success");
  }
}

function isHookProfileReady(profile = {}) {
  return !quotaLimitUsed(profile.quota) && Boolean(profile.loggedIn || profile.status === "available");
}

function hookProfileOptionLabel(profile = {}, index = 0) {
  const status = hookProfileStatus(profile).label;
  return `${hookProfileIdentity(profile, index)} - ${profile.path || ""} - ${hookProfileUsage(profile)} - ${status}`;
}

function renderHookProfileOptions(preferred = {}) {
  if (!els.hookPrimaryProfileSelect || !els.hookFallbackProfileSelect) return;
  const profiles = state.hookProfiles.length
    ? state.hookProfiles
    : [{ path: "work/google-vids-profile", label: "work/google-vids-profile", quota: {} }];
  const primaryPrevious = preferred.primary || els.hookPrimaryProfileSelect.value || "work/google-vids-profile";
  const fallbackPrevious = preferred.fallback || els.hookFallbackProfileSelect.value || "";
  const options = profiles.map((profile, index) => (
    `<option value="${escapeHtml(profile.path)}">${escapeHtml(hookProfileOptionLabel(profile, index))}</option>`
  )).join("");
  els.hookPrimaryProfileSelect.innerHTML = options;
  els.hookFallbackProfileSelect.innerHTML = `<option value="">No fallback</option>${options}`;

  const hasPrimary = profiles.some((profile) => profile.path === primaryPrevious);
  els.hookPrimaryProfileSelect.value = hasPrimary ? primaryPrevious : (profiles[0]?.path || "");
  const selectedPrimary = els.hookPrimaryProfileSelect.value;
  const fallbackCandidate = fallbackPrevious && profiles.some((profile) => profile.path === fallbackPrevious)
    ? fallbackPrevious
    : profiles.find((profile) => profile.path !== selectedPrimary && isHookProfileReady(profile))?.path
      || profiles.find((profile) => profile.path !== selectedPrimary && !quotaLimitUsed(profile.quota))?.path
      || profiles.find((profile) => profile.path !== selectedPrimary)?.path
      || "";
  els.hookFallbackProfileSelect.value = fallbackCandidate;
  els.hookFallbackProfileSelect.disabled = !els.hookFallbackEnabled?.checked;
}

function selectedHookProfiles() {
  const primary = els.hookPrimaryProfileSelect?.value || "work/google-vids-profile";
  const fallback = els.hookFallbackEnabled?.checked ? (els.hookFallbackProfileSelect?.value || "") : "";
  return [primary, fallback].filter(Boolean);
}

function renderHookProfileStatus() {
  if (!els.hookProfileStatus) return;
  const profiles = state.hookProfiles || [];
  if (!profiles.length) {
    els.hookProfileStatus.innerHTML = `<span data-tone="warn">No profiles loaded</span>`;
    return;
  }
  const selected = new Set(selectedHookProfiles());
  const chips = profiles.map((profile, index) => {
    const status = hookProfileStatus(profile);
    const role = profile.path === els.hookPrimaryProfileSelect?.value
      ? "Primary"
      : profile.path === els.hookFallbackProfileSelect?.value && els.hookFallbackEnabled?.checked
        ? "Fallback"
        : selected.has(profile.path)
          ? "Selected"
          : "";
    const identity = hookProfileIdentity(profile, index);
    const label = [role, identity, status.label, hookProfileUsage(profile)].filter(Boolean).join(" | ");
    return `<span data-tone="${escapeHtml(status.tone)}" title="${escapeHtml(profile.path || "")}">${escapeHtml(label)}</span>`;
  }).join("");
  const fallbackText = els.hookFallbackEnabled?.checked
    ? `Fallback enabled: ${els.hookFallbackProfileSelect?.value || "not selected"}`
    : "Fallback disabled";
  els.hookProfileStatus.innerHTML = `${chips}<span>${escapeHtml(fallbackText)}</span>`;
}

function profileCounts() {
  const profiles = state.hookProfiles || [];
  return {
    total: profiles.length,
    available: profiles.filter(isHookProfileReady).length,
    limitUsed: profiles.filter((profile) => quotaLimitUsed(profile.quota)).length,
    loginNeeded: profiles.filter((profile) => profile.status === "login_needed" || (!profile.loggedIn && !quotaLimitUsed(profile.quota))).length
  };
}

function renderProfileManager() {
  if (!els.profileManagerSummary || !els.profileManagerList) return;
  const profiles = state.hookProfiles || [];
  const counts = profileCounts();
  setProfileState(`${counts.available}/${counts.total} available`, profiles.length ? "success" : "idle");
  els.profileManagerSummary.innerHTML = [
    ["Total", counts.total],
    ["Available", counts.available],
    ["Limit used", counts.limitUsed],
    ["Login needed", counts.loginNeeded]
  ].map(([label, value]) => (
    `<span><strong>${escapeHtml(value)}</strong>${escapeHtml(label)}</span>`
  )).join("");

  if (!profiles.length) {
    els.profileManagerList.innerHTML = `<span class="muted">No profiles found. Add Profile se naya Google Vids browser profile create karo.</span>`;
    return;
  }

  const primary = els.hookPrimaryProfileSelect?.value || "";
  const fallback = els.hookFallbackEnabled?.checked ? (els.hookFallbackProfileSelect?.value || "") : "";
  els.profileManagerList.innerHTML = profiles.map((profile, index) => {
    const status = hookProfileStatus(profile);
    const identity = hookProfileIdentity(profile, index);
    const rowLabel = `P${String(index + 1).padStart(2, "0")}`;
    const roleBadges = [
      profile.path === primary ? `<span data-tone="primary">Primary</span>` : "",
      profile.path === fallback ? `<span data-tone="fallback">Fallback</span>` : ""
    ].filter(Boolean).join("");
    const noteParts = [
      profile.browserProfile ? `Chrome: ${profile.browserProfile}` : "",
      profile.quota?.lastQuotaHitAt ? `Last limit hit: ${shortDateTime(profile.quota.lastQuotaHitAt)}` : "",
      profile.quota?.quotaNote || ""
    ].filter(Boolean);
    const metaText = [hookProfileUsage(profile), ...noteParts].filter(Boolean).join(" | ");
    return `
      <article class="profile-card" data-profile="${escapeHtml(profile.path)}">
        <div class="profile-card-main">
          <span class="profile-index">${escapeHtml(rowLabel)}</span>
          <div class="profile-card-name">
            <h3>${escapeHtml(identity)}</h3>
            <p title="${escapeHtml(profile.path || "")}">${escapeHtml(profile.path || "")}</p>
          </div>
        </div>
        <div class="profile-card-meta">
          <div class="profile-card-badges">
            <span data-tone="${escapeHtml(status.tone)}">${escapeHtml(status.label)}</span>
            ${roleBadges}
          </div>
          <span title="${escapeHtml(metaText)}">${escapeHtml(metaText)}</span>
        </div>
        <div class="profile-card-actions">
          <button class="secondary-action" data-profile-action="primary" data-profile="${escapeHtml(profile.path)}" type="button">Primary</button>
          <button class="secondary-action" data-profile-action="fallback" data-profile="${escapeHtml(profile.path)}" type="button">Fallback</button>
          <button class="secondary-action" data-profile-action="login" data-profile="${escapeHtml(profile.path)}" type="button">Login</button>
          <button class="secondary-action" data-profile-action="rename" data-profile="${escapeHtml(profile.path)}" type="button">Rename</button>
          <button class="secondary-action danger-action" data-profile-action="remove" data-profile="${escapeHtml(profile.path)}" type="button">Remove</button>
        </div>
      </article>
    `;
  }).join("");
}

async function loadHookProfiles(preferred = {}) {
  if (!els.hookProfileStatus) return [];
  els.hookProfileStatus.innerHTML = `<span>Profiles loading...</span>`;
  setProfileState("Loading", "busy");
  appendTerminal("GET /api/profiles");
  const response = await fetch("/api/profiles");
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Profiles failed: ${response.status}`);
  }
  state.hookProfiles = data.profiles || [];
  renderHookProfileOptions(preferred);
  renderHookProfileStatus();
  renderProfileManager();
  return state.hookProfiles;
}

async function addHookProfile(options = {}) {
  const profileName = String(options.profileName ?? els.newHookProfileName?.value ?? "").trim();
  setTask("Adding Vids profile", "New browser profile folder create ho raha hai", "busy");
  setTerminalStatus("Adding Google Vids profile");
  setProfileState("Adding", "busy");
  appendTerminal("POST /api/profiles");
  const response = await fetch("/api/profiles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ profile: profileName })
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Profile add failed: ${response.status}`);
  }
  state.hookProfiles = data.profiles || [];
  renderHookProfileOptions({ primary: data.profile?.path, fallback: els.hookFallbackProfileSelect?.value || "" });
  renderHookProfileStatus();
  renderProfileManager();
  if (els.newHookProfileName) {
    els.newHookProfileName.value = "";
  }
  appendTerminal(`Profile added: ${data.profile?.path || "new profile"}`, "stdout");
  setTask("Profile added", data.profile?.path || "New profile ready", "success");
  setTerminalStatus("Profile added");
  activeStep("profile");
  return data.profile;
}

async function renameHookProfile(profilePath = "") {
  const profile = String(profilePath || "").trim();
  if (!profile) {
    throw new Error("Profile path missing.");
  }
  const currentName = profileNameFromPath(profile);
  const newName = window.prompt(
    "New profile name likho. Example: prathak-google-vids",
    currentName
  );
  if (newName === null) {
    return;
  }
  const cleanName = String(newName || "").trim();
  if (!cleanName) {
    throw new Error("New profile name empty nahi ho sakta.");
  }

  const currentPrimary = els.hookPrimaryProfileSelect?.value || "";
  const currentFallback = els.hookFallbackProfileSelect?.value || "";
  setTask("Renaming Vids profile", `${profile} -> ${cleanName}`, "busy");
  setTerminalStatus("Renaming Google Vids profile");
  setProfileState("Renaming", "busy");
  appendTerminal(`POST /api/profiles/rename ${profile} -> ${cleanName}`);
  const response = await fetch("/api/profiles/rename", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ profile, name: cleanName })
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Profile rename failed: ${response.status}`);
  }

  const renamedPath = data.profile || profile;
  state.hookProfiles = data.profiles || [];
  const primary = currentPrimary === profile ? renamedPath : currentPrimary;
  const fallback = currentFallback === profile ? renamedPath : currentFallback;
  renderHookProfileOptions({ primary, fallback });
  renderHookProfileStatus();
  renderProfileManager();
  appendTerminal(`Profile renamed: ${profile} -> ${renamedPath}`, "stdout");
  setTask("Profile renamed", renamedPath, "success");
  setTerminalStatus("Profile renamed");
  activeStep("profile");
}

async function removeHookProfile(profilePath = "") {
  const profile = String(profilePath || "").trim();
  if (!profile) {
    throw new Error("Profile path missing.");
  }
  const confirmed = window.confirm(
    `Remove this Google Vids profile?\n\n${profile}\n\nThis deletes local browser login/profile data for this project.`
  );
  if (!confirmed) {
    return;
  }

  setTask("Removing Vids profile", profile, "busy");
  setTerminalStatus("Removing Google Vids profile");
  setProfileState("Removing", "busy");
  appendTerminal(`POST /api/profiles/remove ${profile}`);
  const response = await fetch("/api/profiles/remove", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ profile })
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Profile remove failed: ${response.status}`);
  }

  state.hookProfiles = data.profiles || [];
  const currentPrimary = els.hookPrimaryProfileSelect?.value || "";
  const currentFallback = els.hookFallbackProfileSelect?.value || "";
  const primary = currentPrimary === profile
    ? (state.hookProfiles.find(isHookProfileReady)?.path || state.hookProfiles[0]?.path || "")
    : currentPrimary;
  const fallback = currentFallback === profile ? "" : currentFallback;
  renderHookProfileOptions({ primary, fallback });
  renderHookProfileStatus();
  renderProfileManager();
  appendTerminal(`Profile removed: ${data.profile || profile}${data.deletedFolder ? " | folder deleted" : ""}`, "stdout");
  setTask("Profile removed", data.profile || profile, "success");
  setTerminalStatus("Profile removed");
  activeStep("profile");
}

async function loginHookProfile(profilePath = "") {
  const profile = profilePath || els.hookPrimaryProfileSelect?.value || selectedHookProfiles()[0] || "work/google-vids-profile";
  setTask("Opening profile login", profile, "busy");
  setTerminalStatus("Opening Google Vids login");
  setProfileState("Login open", "busy");
  appendTerminal(`POST /api/profile-login profile=${profile}`);
  const response = await fetch("/api/profile-login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ profile })
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Profile login failed: ${response.status}`);
  }
  appendTerminal(`Login run started: ${data.run?.id || profile}`, "stdout");
  setTask("Login window opened", "Browser me Google Vids login complete karo, phir Refresh Profiles dabao.", "success");
  setTerminalStatus("Login started");
  activeStep("profile");
  return data.run;
}

async function loginSelectedHookProfile() {
  return loginHookProfile();
}

function setTask(name, detail = "", tone = "idle") {
  els.taskName.textContent = name;
  els.taskDetail.textContent = detail || "Working...";
  els.taskNotice.dataset.tone = tone;
}

function setTerminalStatus(label) {
  els.terminalStatus.textContent = label;
}

function appendTerminal(text, stream = "system") {
  const prefix = stream === "stderr" ? "ERR" : stream === "stdout" ? "OUT" : "SYS";
  const line = `[${timeLabel()}] ${prefix} ${text}`;
  const current = els.terminalOutput.textContent || "";
  els.terminalOutput.textContent = `${current}${current.endsWith("\n") ? "" : "\n"}${line}\n`;
  els.terminalOutput.scrollTop = els.terminalOutput.scrollHeight;
}

function getTerminalResizeBounds() {
  const workspaceRect = els.workspace?.getBoundingClientRect();
  const sidebarRect = document.querySelector(".step-sidebar")?.getBoundingClientRect();
  if (!workspaceRect || !sidebarRect) {
    return { min: MIN_TERMINAL_WIDTH, max: MAX_TERMINAL_WIDTH };
  }
  const middleMinimum = 340;
  const resizerWidth = 8;
  const totalGaps = 30;
  const maxByWorkspace = workspaceRect.width - sidebarRect.width - middleMinimum - resizerWidth - totalGaps;
  return {
    min: MIN_TERMINAL_WIDTH,
    max: Math.max(MIN_TERMINAL_WIDTH, Math.min(MAX_TERMINAL_WIDTH, maxByWorkspace))
  };
}

function applyTerminalWidth(width, options = {}) {
  if (!els.workspace || !Number.isFinite(width)) return;
  const bounds = getTerminalResizeBounds();
  const nextWidth = clampNumber(Math.round(width), bounds.min, bounds.max);
  state.terminalWidth = nextWidth;
  els.workspace.style.setProperty("--terminal-width", `${nextWidth}px`);
  if (els.workspaceResizer) {
    els.workspaceResizer.setAttribute("aria-valuemin", String(bounds.min));
    els.workspaceResizer.setAttribute("aria-valuemax", String(bounds.max));
    els.workspaceResizer.setAttribute("aria-valuenow", String(nextWidth));
  }
  if (options.persist) {
    localStorage.setItem(TERMINAL_LAYOUT_KEY, String(nextWidth));
  }
}

function getTerminalWidthFromPointer(clientX) {
  const workspaceRect = els.workspace?.getBoundingClientRect();
  if (!workspaceRect) return state.terminalWidth;
  return workspaceRect.right - clientX - 10;
}

function finishTerminalResize() {
  if (!state.isResizingTerminal) return;
  state.isResizingTerminal = false;
  document.body.classList.remove("resizing-terminal");
  els.workspaceResizer?.classList.remove("is-dragging");
  if (state.resizeMoved) {
    applyTerminalWidth(state.terminalWidth, { persist: true });
    setTerminalStatus(`Terminal width ${state.terminalWidth}px`);
    appendTerminal(`Layout resized: terminal ${state.terminalWidth}px`);
  }
  state.resizeMoved = false;
}

function initWorkspaceResizer() {
  if (!els.workspace || !els.workspaceResizer) return;
  const savedWidth = Number(localStorage.getItem(TERMINAL_LAYOUT_KEY));
  applyTerminalWidth(Number.isFinite(savedWidth) && savedWidth > 0 ? savedWidth : DEFAULT_TERMINAL_WIDTH);

  els.workspaceResizer.addEventListener("pointerdown", (event) => {
    if (window.matchMedia("(max-width: 1120px)").matches || document.body.classList.contains("terminal-fullscreen")) {
      return;
    }
    state.isResizingTerminal = true;
    state.resizeStartX = event.clientX;
    state.resizeMoved = false;
    els.workspaceResizer.classList.add("is-dragging");
    document.body.classList.add("resizing-terminal");
    els.workspaceResizer.setPointerCapture?.(event.pointerId);
    setTerminalStatus("Resizing terminal");
    event.preventDefault();
  });

  window.addEventListener("pointermove", (event) => {
    if (!state.isResizingTerminal) return;
    if (Math.abs(event.clientX - state.resizeStartX) < 3) return;
    state.resizeMoved = true;
    applyTerminalWidth(getTerminalWidthFromPointer(event.clientX));
  });

  window.addEventListener("pointerup", finishTerminalResize);
  window.addEventListener("pointercancel", finishTerminalResize);

  els.workspaceResizer.addEventListener("dblclick", () => {
    applyTerminalWidth(DEFAULT_TERMINAL_WIDTH, { persist: true });
    setTerminalStatus("Terminal width reset");
    appendTerminal(`Layout reset: terminal ${DEFAULT_TERMINAL_WIDTH}px`);
  });

  els.workspaceResizer.addEventListener("keydown", (event) => {
    const bounds = getTerminalResizeBounds();
    const step = event.shiftKey ? 60 : 24;
    let nextWidth = state.terminalWidth;
    if (event.key === "ArrowLeft") nextWidth += step;
    if (event.key === "ArrowRight") nextWidth -= step;
    if (event.key === "Home") nextWidth = bounds.min;
    if (event.key === "End") nextWidth = bounds.max;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    applyTerminalWidth(nextWidth, { persist: true });
    setTerminalStatus(`Terminal width ${state.terminalWidth}px`);
    event.preventDefault();
  });

  window.addEventListener("resize", () => {
    applyTerminalWidth(state.terminalWidth);
  });
}

function setState(label, tone = "idle") {
  els.analysisState.textContent = label;
  els.analysisState.dataset.tone = tone;
  els.loadStepMeta.textContent = label;
  els.loadStepLink.classList.toggle("busy", tone === "busy");
  els.loadStepLink.classList.toggle("done", tone === "success");
}

function setAssetState(label, tone = "idle") {
  els.assetState.textContent = label;
  els.assetState.dataset.tone = tone;
  els.assetStepMeta.textContent = label;
  els.assetStepLink.classList.toggle("busy", tone === "busy");
  els.assetStepLink.classList.toggle("done", tone === "success");
}

function setScriptState(label, tone = "idle") {
  els.scriptState.textContent = label;
  els.scriptState.dataset.tone = tone;
  els.scriptStepMeta.textContent = label;
  els.scriptStepLink.classList.toggle("busy", tone === "busy");
  els.scriptStepLink.classList.toggle("done", tone === "success");
}

function setHookState(label, tone = "idle") {
  els.hookState.textContent = label;
  els.hookState.dataset.tone = tone;
  els.hookStepMeta.textContent = label;
  els.hookStepLink.classList.toggle("busy", tone === "busy");
  els.hookStepLink.classList.toggle("done", tone === "success");
}

function setFinalState(label, tone = "idle") {
  if (!els.finalState) return;
  els.finalState.textContent = label;
  els.finalState.dataset.tone = tone;
  els.finalStepMeta.textContent = label;
  els.finalStepLink.classList.toggle("busy", tone === "busy");
  els.finalStepLink.classList.toggle("done", tone === "success");
}

function setBusy(isBusy) {
  els.importBtn.disabled = isBusy || !els.fileInput.files?.[0];
  els.defaultBtn.disabled = isBusy;
  els.openTrackerExcelBtn.disabled = isBusy;
  els.importBtn.textContent = isBusy ? "Importing..." : "Import";
  els.defaultBtn.textContent = isBusy ? "Loading..." : "Default Excel";
  els.openTrackerExcelBtn.textContent = isBusy ? "Wait..." : "Open Tracker";
}

function setAssetBusy(isBusy) {
  els.buildAssetsBtn.disabled = isBusy || !state.inputPath || !Number(els.assetRowInput.value || 0);
  els.viewAssetsBtn.disabled = isBusy || !state.lastAssetFolder;
  els.buildAssetsBtn.textContent = isBusy ? "Building..." : "Build Assets";
}

function setScriptBusy(isBusy) {
  const hasRow = Boolean(state.inputPath && Number(els.assetRowInput.value || 0));
  els.generateScriptBtn.disabled = isBusy || !hasRow;
  els.viewScriptFolderBtn.disabled = isBusy || !state.lastScriptFolder;
  els.generateScriptBtn.textContent = isBusy ? "Generating..." : "Generate Script";
}

function setHookBusy(isBusy) {
  const hasRow = Boolean(state.inputPath && Number(els.assetRowInput.value || 0));
  els.prepareHookAvatarBtn.disabled = isBusy || !hasRow;
  els.generateHookAvatarBtn.disabled = isBusy || !hasRow;
  els.viewHookAvatarBtn.disabled = isBusy || !state.lastHookAvatarFolder;
  els.prepareHookAvatarBtn.textContent = isBusy ? "Preparing..." : "Prepare Avatar Pack";
  els.generateHookAvatarBtn.textContent = isBusy ? "Generating..." : "Generate Avatar Pack";
}

function setFinalBusy(isBusy) {
  const hasRow = Boolean(state.inputPath && Number(els.assetRowInput.value || 0));
  if (els.generateRemainingVidsBtn) {
    els.generateRemainingVidsBtn.disabled = isBusy || !hasRow;
    els.generateRemainingVidsBtn.textContent = isBusy ? "Working..." : "Generate Vids Voiceover";
  }
  if (els.playVoiceoverBtn) {
    els.playVoiceoverBtn.disabled = isBusy || !state.lastVoiceoverPreviewUrl;
  }
  if (els.renderFinalReelBtn) {
    els.renderFinalReelBtn.disabled = isBusy || !hasRow;
    els.renderFinalReelBtn.textContent = isBusy ? "Rendering..." : "Render Final Reel";
  }
  if (els.viewFinalFolderBtn) {
    els.viewFinalFolderBtn.disabled = isBusy || !state.lastFinalReelFolder;
  }
}

function shortDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function selectedToolForRow(row = Number(els.assetRowInput.value || 0)) {
  return state.tools.find((item) => Number(item.row || item.source_row_number) === Number(row));
}

function resetRowOutputs(row) {
  const input = state.inputPath || "";
  if (state.currentRow === row && state.currentInput === input) return;
  state.currentRow = row;
  state.currentInput = input;
  state.lastAssetFolder = "";
  state.lastAssetRow = 0;
  state.lastAssetInput = "";
  state.lastScriptFolder = "";
  state.lastHookAvatarFolder = "";
  state.lastHookAvatarVideo = "";
  state.lastHookAvatarRunId = "";
  state.lastFinalReelFolder = "";
  state.lastFinalReelVideo = "";
  state.lastFinalReelRunId = "";
  state.lastFinalReelRow = 0;
  state.lastVoiceoverPreviewUrl = "";
  state.lastVoiceoverPreviewName = "";
  state.latestArtifacts = null;
  els.assetResult.classList.add("is-hidden");
  els.scriptResult.classList.add("is-hidden");
  els.hookResult.classList.add("is-hidden");
  els.hookVideoPreview.classList.add("is-hidden");
  els.hookVideoPreview.removeAttribute("src");
  els.finalResult?.classList.add("is-hidden");
  els.finalVideoPreview?.classList.add("is-hidden");
  els.finalVideoPreview?.removeAttribute("src");
  els.voiceoverPreviewBox?.classList.add("is-hidden");
  els.voiceoverAudioPreview?.pause();
  els.voiceoverAudioPreview?.removeAttribute("src");
  els.voiceoverAudioPreview?.load?.();
  if (els.voiceoverPreviewInfo) els.voiceoverPreviewInfo.textContent = "";
  if (els.playVoiceoverBtn) {
    els.playVoiceoverBtn.disabled = true;
    els.playVoiceoverBtn.textContent = "Play Voiceover";
  }
  setAssetState("Ready", "idle");
  setScriptState("Ready", "idle");
  setHookState("Ready", "idle");
  setFinalState("Ready", "idle");
  renderFinalPipeline([]);
  setArtifactNotice("", "", "idle", true);
}

function setArtifactNotice(title, detail = "", tone = "idle", hidden = false) {
  els.artifactNoticeTitle.textContent = title || "Checking existing work";
  els.artifactNoticeDetail.textContent = detail || "";
  els.artifactNotice.dataset.tone = tone;
  els.artifactNotice.classList.toggle("is-hidden", Boolean(hidden));
}

function renderFinalPipeline(steps = []) {
  if (!els.finalPipeline) return;
  if (!steps.length) {
    els.finalPipeline.innerHTML = '<span data-status="idle">Waiting for final render.</span>';
    return;
  }
  els.finalPipeline.innerHTML = steps.map((step) => `
    <span data-status="${escapeHtml(step.status || "idle")}">
      <strong>${escapeHtml(step.label || step.id || "Step")}</strong>
      ${step.detail ? `<small>${escapeHtml(step.detail)}</small>` : ""}
    </span>
  `).join("");
}

function finalVideoUrl(filePath) {
  return filePath ? `/file?path=${encodeURIComponent(filePath)}` : "";
}

function fileUrl(file = {}) {
  return file.url || (file.path ? finalVideoUrl(file.path) : "");
}

function pickVoiceoverPreviewFile(finalReel = {}) {
  const files = Array.isArray(finalReel.files) ? finalReel.files : [];
  const candidates = files.map((file) => {
    const name = String(file.name || file.path || file.relativePath || "").toLowerCase();
    const kind = String(file.kind || "").toLowerCase();
    const pathText = String(file.path || file.relativePath || "").toLowerCase();
    const text = `${name} ${pathText}`;
    let score = 0;
    if (/\.(mp3|m4a|wav|aac|ogg)$/i.test(name)) score += 100;
    if (kind === "audio") score += 100;
    if (/voiceover-full|full.*voiceover/i.test(text)) score += 80;
    if (/voiceover|narration|audio|scene-\d+/i.test(text)) score += 45;
    if (/voiceover-source\.mp4|google-vids-voiceover/i.test(text)) score += 35;
    if (/\.(mp4|webm|mov)$/i.test(name) && /voiceover|narration/i.test(text)) score += 20;
    if (!fileUrl(file)) score = 0;
    return { file, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  return candidates[0]?.file || null;
}

function renderArtifactNotice(artifacts) {
  state.latestArtifacts = artifacts || null;
  const asset = artifacts?.latestAssets || null;
  const script = artifacts?.latestScript || null;
  const hook = artifacts?.latestHookAvatar || null;
  const hasAsset = Boolean(asset?.assetBuild);
  const hasScript = Boolean(script?.scriptBuild);
  const hasHook = Boolean(hook?.hookAvatar);
  els.useExistingAssetsBtn.disabled = !hasAsset;
  els.generateNewAssetsBtn.disabled = !state.inputPath || !Number(els.assetRowInput.value || 0);
  els.useExistingScriptBtn.disabled = !hasScript;
  if (hasAsset && !state.lastAssetFolder) {
    els.assetStepMeta.textContent = "Old assets found";
  }
  if (hasScript && !state.lastScriptFolder) {
    els.scriptStepMeta.textContent = "Old script found";
  }
  if (hasHook && !state.lastHookAvatarFolder) {
    els.hookStepMeta.textContent = "Old hook found";
    renderHookAvatarResult(hook.hookAvatar);
  }
  if (hasAsset && hasScript && !state.lastFinalReelFolder) {
    setFinalState(hasHook ? "Ready after hook" : "Ready, hook optional", "idle");
    setFinalBusy(false);
  }

  if (!hasAsset && !hasScript && !hasHook) {
    setArtifactNotice(
      "No old work found",
      "Fresh assets, script aur avatar pack generate kar sakte ho.",
      "missing",
      false
    );
    return;
  }

  const parts = [];
  if (hasAsset) {
    parts.push(`Assets: ${asset.fileCount || asset.assetBuild?.files?.length || 0} files${asset.generatedAt ? `, ${shortDateTime(asset.generatedAt)}` : ""}`);
  }
  if (hasScript) {
    parts.push(`Script: ${script.duration || 0}s${script.generatedAt ? `, ${shortDateTime(script.generatedAt)}` : ""}`);
  }
  if (hasHook) {
    parts.push(`Hook: ${hook.status || hook.hookAvatar?.status || "ready"}${hook.generatedAt ? `, ${shortDateTime(hook.generatedAt)}` : ""}`);
  }
  setArtifactNotice(
    "Existing work found",
    `${parts.join(" | ")}. Old use karna hai ya new generate karna hai?`,
    "found",
    false
  );
}

async function checkExistingArtifacts(row) {
  if (!state.inputPath || !Number(row || 0)) {
    setArtifactNotice("", "", "idle", true);
    return;
  }
  const token = ++state.artifactCheckToken;
  const tool = selectedToolForRow(row) || {};
  const params = new URLSearchParams({
    input: state.inputPath,
    row: String(row),
    toolName: tool.name || tool.tool_name || "",
    toolUrl: tool.url || tool.tool_url || ""
  });
  setArtifactNotice("Checking existing work", "Assets aur script folders scan ho rahe hain.", "checking", false);
  appendTerminal(`GET /api/tool-artifacts row=${row}`);
  try {
    const response = await fetch(`/api/tool-artifacts?${params.toString()}`);
    const data = await response.json();
    if (token !== state.artifactCheckToken) return;
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `Artifact check failed: ${response.status}`);
    }
    renderArtifactNotice(data.artifacts || {});
  } catch (error) {
    if (token !== state.artifactCheckToken) return;
    setArtifactNotice("Existing work check failed", error.message, "missing", false);
    appendTerminal(error.message, "stderr");
  }
}

function scheduleArtifactCheck(row) {
  if (state.artifactCheckTimer) {
    clearTimeout(state.artifactCheckTimer);
  }
  state.artifactCheckTimer = setTimeout(() => {
    checkExistingArtifacts(row);
  }, 250);
}

function renderWarnings(warnings = []) {
  if (!warnings.length) {
    els.warningList.innerHTML = '<span class="good-note">No major issue found.</span>';
    return;
  }
  els.warningList.innerHTML = warnings
    .map((warning) => `<span>${escapeHtml(warning)}</span>`)
    .join("");
}

function activeStep(step) {
  for (const link of [els.loadStepLink, els.selectStepLink, els.assetStepLink, els.scriptStepLink, els.hookStepLink, els.finalStepLink, els.profileStepLink].filter(Boolean)) {
    link.classList.remove("active");
  }
  const order = ["load", "select", "asset", "script", "hook", "final", "profile"];
  const activeIndex = Math.max(0, order.indexOf(step));
  for (const item of els.flowSteps) {
    const itemIndex = order.indexOf(item.dataset.flowStep || "");
    item.classList.toggle("active", itemIndex === activeIndex);
    item.classList.toggle("done", itemIndex > -1 && itemIndex < activeIndex);
  }
  if (step === "select") {
    els.selectStepLink.classList.add("active");
  } else if (step === "asset") {
    els.assetStepLink.classList.add("active");
  } else if (step === "script") {
    els.scriptStepLink.classList.add("active");
  } else if (step === "hook") {
    els.hookStepLink.classList.add("active");
  } else if (step === "final") {
    els.finalStepLink?.classList.add("active");
  } else if (step === "profile") {
    els.profileStepLink?.classList.add("active");
  } else {
    els.loadStepLink.classList.add("active");
  }
}

function renderAnalysis(upload) {
  const analysis = upload.analysis || {};
  const preview = analysis.preview || [];
  const previewTools = preview.map((row) => ({
    row: row.row,
    name: row.name,
    url: row.url,
    status: row.status,
    category: row.category
  }));
  const availableTools = upload.tools?.length ? upload.tools : previewTools;
  state.inputPath = upload.input || analysis.input || upload.relativePath || state.inputPath;
  state.tools = availableTools;
  state.filteredTools = availableTools;
  if (preview[0]?.row) {
    els.assetRowInput.value = preview[0].row;
  }
  els.analysisResults.classList.remove("is-hidden");
  els.toolRows.textContent = analysis.detectedToolRows ?? upload.tools?.length ?? 0;
  els.columnCount.textContent = analysis.columnCount ?? 0;
  els.urlCount.textContent = analysis.withUrl ?? 0;
  els.scriptCount.textContent = analysis.withScript ?? 0;
  els.headerList.innerHTML = (analysis.headers || [])
    .map((header) => `<span>${escapeHtml(header || "Blank")}</span>`)
    .join("") || '<span>No columns detected</span>';
  renderWarnings(analysis.warnings || []);
  els.previewTitle.textContent = `${preview.length} preview row(s)`;
  els.savedPath.textContent = upload.relativePath || analysis.fileName || "";
  els.previewBody.innerHTML = preview.map((row) => `
    <tr>
      <td><button class="row-pick" type="button" data-row="${escapeHtml(row.row)}">${escapeHtml(row.row)}</button></td>
      <td>${escapeHtml(row.name)}</td>
      <td>${row.url ? `<a href="${escapeHtml(row.url)}" target="_blank" rel="noreferrer">Open</a>` : '<span class="muted">Missing</span>'}</td>
      <td>${escapeHtml(row.description || "No description")}</td>
      <td>${escapeHtml(row.status || "Blank")}</td>
    </tr>
  `).join("") || '<tr><td colspan="5">No usable tool rows detected.</td></tr>';
  els.toolOptionCount.textContent = `${availableTools.length || analysis.detectedToolRows || 0} tools`;
  renderToolOptions(filterTools(els.toolSearchInput.value));
  setAssetBusy(false);
  setScriptBusy(false);
  setHookBusy(false);
  updateSelectedTool();
  els.selectStepMeta.textContent = `${availableTools.length || analysis.detectedToolRows || 0} tools loaded`;
  els.selectStepLink.classList.add("done");
  activeStep("select");
}

function renderIdeaList(data) {
  const tools = data.tools || data.toolOptions || [];
  const analysis = data.analysis || {};
  state.inputPath = data.input || analysis.input || state.inputPath;
  state.tools = tools;
  state.filteredTools = tools;

  const firstRow = tools[0]?.row || 2;
  els.assetRowInput.value = firstRow;
  els.analysisResults.classList.remove("is-hidden");
  els.toolRows.textContent = tools.length || analysis.detectedToolRows || 0;
  els.columnCount.textContent = "-";
  els.urlCount.textContent = "-";
  els.scriptCount.textContent = "-";
  els.headerList.innerHTML = '<span>Idea Name</span><span>Excel Row</span>';
  renderWarnings(analysis.warnings || data.warnings || ["Only idea names were loaded."]);
  els.previewTitle.textContent = "Preview skipped";
  els.savedPath.textContent = data.input || analysis.input || "";
  els.previewBody.innerHTML = '<tr><td colspan="5">Full Excel preview skipped. Select idea name above and build assets for that row.</td></tr>';
  els.toolOptionCount.textContent = `${tools.length} tools`;
  renderToolOptions(filterTools(els.toolSearchInput.value));
  setAssetBusy(false);
  setScriptBusy(false);
  setHookBusy(false);
  updateSelectedTool();
  els.selectStepMeta.textContent = `${tools.length} idea names loaded`;
  els.selectStepLink.classList.add("done");
  appendTerminal(`Loaded ${tools.length} idea names from ${data.fileName || analysis.fileName || "workbook"}.`, "stdout");
  setTask("Idea names loaded", `${tools.length} tools ready to select`, "success");
  setTerminalStatus(`${tools.length} idea names loaded`);
  activeStep("select");
}

async function uploadAndAnalyze(file) {
  if (!file) return;
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
    throw new Error("Please choose an .xlsx, .xls, or .csv file.");
  }
  setState("Uploading", "busy");
  setTask("Uploading Excel", file.name, "busy");
  setTerminalStatus("Uploading Excel");
  appendTerminal(`POST /api/input-upload?mode=save-only (${file.name})`);
  setBusy(true);
  const response = await fetch("/api/input-upload?mode=save-only", {
    method: "POST",
    headers: {
      "content-type": "application/octet-stream",
      "x-file-name": encodeURIComponent(file.name)
    },
    body: await file.arrayBuffer()
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Upload failed: ${response.status}`);
  }
  await loadToolIdeas(data.upload?.input || data.upload?.relativePath || state.inputPath);
  setState("Analyzed", "success");
  els.fileName.textContent = data.upload?.savedName || file.name;
  els.fileHint.textContent = `${formatBytes(file.size)} saved. Idea names loaded only.`;
}

async function loadToolIdeas(inputPath) {
  appendTerminal(`GET /api/tool-ideas?input=${inputPath}`);
  setTerminalStatus("Loading idea names");
  const response = await fetch(`/api/tool-ideas?input=${encodeURIComponent(inputPath)}`);
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Idea names failed: ${response.status}`);
  }
  renderIdeaList(data);
  return data;
}

async function loadDashboardDefaults() {
  appendTerminal("GET /api/defaults");
  const response = await fetch("/api/defaults");
  const defaults = await response.json();
  if (!response.ok || defaults.ok === false) {
    throw new Error(defaults.error || `Defaults failed: ${response.status}`);
  }
  renderHookCharacterOptions(
    defaults.googleVids?.avatarOptions || [{ label: "Google Vids auto", value: "auto" }],
    defaults.settings?.hookAvatarCharacter || "auto_by_reel"
  );
  if (els.hookPresenterSelect && defaults.settings?.hookAvatarStyle) {
    els.hookPresenterSelect.value = defaults.settings.hookAvatarStyle;
  }
  return defaults;
}

async function saveHookSettings() {
  if (!els.hookPresenterSelect || !els.hookCharacterSelect) return;
  const response = await fetch("/api/settings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      hookAvatarStyle: els.hookPresenterSelect.value || "female",
      hookAvatarCharacter: els.hookCharacterSelect.value || "auto_by_reel"
    })
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Settings save failed: ${response.status}`);
  }
}

async function loadDefaultAndAnalyze() {
  setState("Loading default", "busy");
  setTask("Loading default Excel", "Only idea names will be loaded", "busy");
  setTerminalStatus("Loading default Excel");
  setBusy(true);
  const defaults = await loadDashboardDefaults();
  const inputPath = defaults.defaultInput || defaults.input || defaults.settings?.inputPath || "";
  if (!inputPath) {
    throw new Error("Default Excel path is not configured.");
  }
  const data = await loadToolIdeas(inputPath);
  els.fileName.textContent = data.fileName || data.analysis?.fileName || "Default workbook";
  els.fileHint.textContent = "Default Excel loaded. Only idea names are loaded.";
  setState("Analyzed", "success");
}

async function openTrackerExcel() {
  setTask("Opening tracker Excel", "Generated workbook open ho raha hai", "busy");
  setTerminalStatus("Opening tracker Excel");
  appendTerminal("POST /api/work-tracker/open");
  els.openTrackerExcelBtn.disabled = true;
  els.openTrackerExcelBtn.textContent = "Opening...";
  try {
    const response = await fetch("/api/work-tracker/open", { method: "POST" });
    const data = await response.json();
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `Tracker open failed: ${response.status}`);
    }
    appendTerminal(`Tracker Excel opened: ${data.path}`, "stdout");
    setTask("Tracker Excel opened", data.path || "Workbook opened", "success");
    setTerminalStatus("Tracker Excel opened");
  } finally {
    els.openTrackerExcelBtn.disabled = false;
    els.openTrackerExcelBtn.textContent = "Open Tracker";
  }
}

function renderToolOptions(tools = []) {
  state.filteredTools = tools;
  if (!tools.length) {
    els.toolSelect.innerHTML = '<option value="">No matching tool rows</option>';
    return;
  }
  els.toolSelect.innerHTML = [
    '<option value="">Choose tool idea name</option>',
    ...tools.map((tool) => {
      const label = `Row ${tool.row || tool.source_row_number} - ${tool.name || tool.tool_name || "Tool"}`;
      return `<option value="${escapeHtml(tool.row || tool.source_row_number)}">${escapeHtml(label)}</option>`;
    })
  ].join("");
  const selectedRow = String(els.assetRowInput.value || "");
  if (selectedRow && tools.some((tool) => String(tool.row || tool.source_row_number) === selectedRow)) {
    els.toolSelect.value = selectedRow;
  }
}

function filterTools(query) {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) {
    return state.tools;
  }
  return state.tools.filter((tool) => {
    const haystack = [
      tool.name || tool.tool_name || "",
      tool.url || tool.tool_url || "",
      tool.category || "",
      tool.status || "",
      tool.row || tool.source_row_number || ""
    ].join(" ").toLowerCase();
    return haystack.includes(needle);
  });
}

function updateSelectedTool() {
  const selectedRow = Number(els.assetRowInput.value || 0);
  if (selectedRow) {
    resetRowOutputs(selectedRow);
  }
  const tool = state.tools.find((item) => Number(item.row || item.source_row_number) === selectedRow);
  if (!selectedRow) {
    els.selectedToolName.textContent = "No row selected yet.";
    setArtifactNotice("", "", "idle", true);
  } else if (tool) {
    const meta = [tool.category, tool.status].filter(Boolean).join(" | ");
    els.selectedToolName.textContent = `Selected Row ${selectedRow}: ${tool.name || tool.tool_name || "Tool"}${meta ? ` - ${meta}` : ""}`;
    setTask("Tool selected", `Row ${selectedRow}: ${tool.name || tool.tool_name || "Tool"}`, "idle");
    setTerminalStatus(`Selected row ${selectedRow}`);
    els.selectStepMeta.textContent = `Row ${selectedRow} selected`;
    els.selectStepLink.classList.add("done");
    els.assetStepMeta.textContent = state.lastAssetFolder ? "Assets ready" : "Ready";
    els.scriptStepMeta.textContent = "Ready";
    els.hookStepMeta.textContent = state.lastHookAvatarFolder ? "Avatar pack ready" : "After script";
    els.finalStepMeta.textContent = state.lastFinalReelFolder ? "Final ready" : "After hook";
    if (state.filteredTools.some((item) => Number(item.row || item.source_row_number) === selectedRow)) {
      els.toolSelect.value = String(selectedRow);
    }
  } else {
    els.selectedToolName.textContent = `Selected Row ${selectedRow}. Details will be loaded from Excel during asset build.`;
    setTask("Tool row selected", `Row ${selectedRow}`, "idle");
    setTerminalStatus(`Selected row ${selectedRow}`);
    els.selectStepMeta.textContent = `Row ${selectedRow} selected`;
  }
  setAssetBusy(false);
  setScriptBusy(false);
  setHookBusy(false);
  setFinalBusy(false);
  if (selectedRow && state.inputPath) {
    scheduleArtifactCheck(selectedRow);
  }
}

function renderAssetBuild(assetBuild) {
  state.lastAssetFolder = assetBuild.assetsDir || "";
  state.lastAssetRow = Number(assetBuild.row || 0);
  state.lastAssetInput = assetBuild.input || "";
  els.assetResult.classList.remove("is-hidden");
  els.assetToolName.textContent = assetBuild.tool?.tool_name || assetBuild.tool?.name || "Tool assets ready";
  els.assetFileCount.textContent = `${assetBuild.files?.length || 0} file(s)`;
  els.assetFolderPath.textContent = assetBuild.assetsDir || "";
  els.assetSummary.textContent = assetBuild.capture?.summary || "";
  const mediaFiles = (assetBuild.files || []).slice(0, 16);
  els.assetFileList.innerHTML = mediaFiles.map((file) => (
    `<a href="${escapeHtml(file.url)}" target="_blank" rel="noreferrer">${escapeHtml(file.kind)}: ${escapeHtml(file.name)}</a>`
  )).join("") || '<span class="muted">No files found.</span>';
  els.assetStepMeta.textContent = `${assetBuild.files?.length || 0} files ready`;
  els.assetStepLink.classList.add("done");
  setTask("Assets ready", `${assetBuild.files?.length || 0} files saved`, "success");
  setTerminalStatus("Asset build complete");
  setScriptState("Ready", "idle");
  activeStep("asset");
  setAssetBusy(false);
  setScriptBusy(false);
  setFinalBusy(false);
}

function renderScriptResult(scriptBuild) {
  const pkg = scriptBuild.scriptPackage || {};
  const seo = scriptBuild.seo || {};
  const scenes = scriptBuild.plan?.scenes || [];
  state.lastScriptFolder = scriptBuild.scriptDir || "";
  els.scriptResult.classList.remove("is-hidden");
  els.scriptToolName.textContent = scriptBuild.tool?.tool_name || scriptBuild.tool?.name || "Reel script ready";
  els.scriptDuration.textContent = `${scriptBuild.totalDurationSeconds || scenes.length * 10 || 0} sec`;
  els.scriptFolderPath.textContent = scriptBuild.markdownPath || scriptBuild.scriptDir || "";
  const hookOptions = (pkg.hook_options || seo.hook_options || [])
    .slice(0, 5)
    .map((hook, index) => `${index + 1}. ${hook.voiceover || hook}`)
    .join("\n");
  const parts = [
    ["Script Type", scriptBuild.scriptLanguage || pkg.script_language || pkg.language || "Hinglish"],
    ["Hook", pkg.hook || scenes[0]?.voiceover || ""],
    ["Hook Options", hookOptions],
    ["Body", pkg.body || scenes.slice(1, -1).map((scene) => scene.voiceover).join(" ")],
    ["CTA", pkg.cta || scenes.at(-1)?.voiceover || ""],
    ["Engagement CTA", pkg.engagement_cta || seo.engagement_cta || ""],
    ["Caption", seo.instagram_caption || ""],
    ["Hashtags", (seo.hashtags || []).join(" ")]
  ].filter(([, value]) => value);
  els.scriptParts.innerHTML = parts.map(([label, value]) => `
    <article class="script-part-card">
      <span>${escapeHtml(label)}</span>
      <p>${escapeHtml(value)}</p>
    </article>
  `).join("");
  els.scriptSceneCountLabel.textContent = `${scenes.length} scene(s)`;
  els.scriptSceneList.innerHTML = scenes.map((scene) => `
    <article class="script-scene-item">
      <strong>Scene ${escapeHtml(scene.scene_number)} - ${escapeHtml(scene.duration)} sec</strong>
      <span>${escapeHtml(scene.onscreen_text)}</span>
      <p>${escapeHtml(scene.voiceover)}</p>
    </article>
  `).join("") || '<span class="muted">No scene script generated.</span>';
  setScriptState("Script ready", "success");
  setTask("Script ready", `${scriptBuild.totalDurationSeconds || 0} sec Reel script`, "success");
  setTerminalStatus("Script generation complete");
  appendTerminal(`Script saved: ${scriptBuild.markdownPath || scriptBuild.scriptDir}`, "stdout");
  activeStep("script");
  setScriptBusy(false);
  setHookState("Ready", "idle");
  setHookBusy(false);
  setFinalState("Ready after hook", "idle");
  setFinalBusy(false);
}

async function generateReelScript() {
  if (!state.inputPath) {
    throw new Error("Excel file pehle load karo.");
  }
  const row = Number(els.assetRowInput.value || 0);
  if (!Number.isFinite(row) || row < 2) {
    throw new Error("Valid Excel row number select karo.");
  }
  const sceneCount = Number(els.scriptSceneCount.value || 5);
  const scriptLanguage = els.scriptLanguageSelect.value || "Hinglish";
  setScriptState("Generating", "busy");
  setTask("Generating script", `Row ${row} | ${sceneCount * 10} sec | ${scriptLanguage}`, "busy");
  setTerminalStatus(`Generating ${scriptLanguage} reel script for row ${row}`);
  appendTerminal(`POST /api/scripts/generate row=${row} scenes=${sceneCount} language=${scriptLanguage}`);
  activeStep("script");
  setScriptBusy(true);
  const response = await fetch("/api/scripts/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      input: state.inputPath,
      row,
      sceneCount,
      scriptLanguage,
      assetsDir: Number(state.lastAssetRow || 0) === row ? state.lastAssetFolder : ""
    })
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Script generation failed: ${response.status}`);
  }
  renderScriptResult(data.scriptBuild || {});
  scheduleArtifactCheck(row);
}

function hookAvatarPayload(extra = {}) {
  const row = Number(els.assetRowInput.value || 0);
  if (!state.inputPath) {
    throw new Error("Excel file pehle load karo.");
  }
  if (!Number.isFinite(row) || row < 2) {
    throw new Error("Valid Excel row number select karo.");
  }
  const primaryProfile = els.hookPrimaryProfileSelect?.value || "work/google-vids-profile";
  const fallbackProfile = els.hookFallbackEnabled?.checked ? (els.hookFallbackProfileSelect?.value || "") : "";
  const profiles = [primaryProfile, fallbackProfile].filter(Boolean);
  return {
    input: state.inputPath,
    row,
    presenter: els.hookPresenterSelect.value || "female",
    avatar: els.hookCharacterSelect?.value || "auto_by_reel",
    avatarLabel: hookCharacterLabel(els.hookCharacterSelect?.value || "auto_by_reel"),
    tone: els.hookToneSelect.value || "energetic",
    durationSeconds: Number(els.hookDurationSelect.value || 10),
    includeMiddleAvatar: true,
    middleAvatarScenes: "2",
    focusDurationSeconds: Number(els.hookDurationSelect.value || 10),
    includeCtaAvatar: true,
    ctaDurationSeconds: Number(els.hookDurationSelect.value || 10),
    profile: primaryProfile,
    primaryProfile,
    fallbackProfile,
    fallbackEnabled: Boolean(els.hookFallbackEnabled?.checked && fallbackProfile),
    profiles,
    scriptLanguage: els.scriptLanguageSelect.value || "Hinglish",
    assetsDir: Number(state.lastAssetRow || 0) === row ? state.lastAssetFolder : "",
    ...extra
  };
}

function hookVideoUrl(filePath) {
  return filePath ? `/file?path=${encodeURIComponent(filePath)}` : "";
}

function renderHookAvatarResult(hookAvatar = {}) {
  const status = hookAvatar.status || hookAvatar.hookAvatar?.status || "prepared";
  const videoPath = hookAvatar.videoPath || hookAvatar.hookAvatar?.videoPath || "";
  state.lastHookAvatarFolder = hookAvatar.hookDir || hookAvatar.folder || "";
  state.lastHookAvatarVideo = videoPath;
  els.hookResult.classList.remove("is-hidden");
  els.hookToolName.textContent = hookAvatar.tool?.tool_name || hookAvatar.tool?.name || "Avatar clips ready";
  const activeProfile = hookAvatar.activeProfile || hookAvatar.hookAvatar?.activeProfile || "";
  const avatarChoice = hookAvatar.avatarChoice || hookAvatar.hookAvatar?.avatarChoice || {};
  const avatarText = avatarChoice.label || hookAvatar.googleVidsAvatar || "";
  els.hookStatusText.textContent = [status, activeProfile, avatarText].filter(Boolean).join(" | ");
  els.hookFolderPath.textContent = hookAvatar.hookDir || hookAvatar.folder || "";
  const hookScript = hookAvatar.hookScript || hookAvatar.hookAvatar?.hookScript || "";
  const ctaScript = hookAvatar.ctaScript || hookAvatar.ctaAvatar?.ctaScript || "";
  const middleScripts = hookAvatar.middleAvatarScripts || {};
  const middlePrompts = hookAvatar.googleVidsMiddlePrompts || {};
  els.hookScriptText.textContent = [
    hookScript ? `HOOK: ${hookScript}` : "",
    ...Object.entries(middleScripts).map(([sceneNumber, script]) => `FOCUS S${sceneNumber}: ${script}`),
    ctaScript ? `CTA: ${ctaScript}` : ""
  ].filter(Boolean).join("\n\n");
  els.hookPromptText.textContent = [
    avatarText ? `Character: ${avatarText}` : "",
    avatarChoice.reason ? `Reason: ${avatarChoice.reason}` : "",
    hookAvatar.googleVidsPrompt ? `HOOK PROMPT:\n${hookAvatar.googleVidsPrompt}` : "",
    ...Object.entries(middlePrompts).map(([sceneNumber, prompt]) => `FOCUS S${sceneNumber} PROMPT:\n${prompt}`),
    hookAvatar.googleVidsCtaPrompt ? `CTA PROMPT:\n${hookAvatar.googleVidsCtaPrompt}` : ""
  ].filter(Boolean).join("\n\n");
  const files = (hookAvatar.files || []).slice(0, 14);
  const attempts = hookAvatar.attempts || hookAvatar.hookAvatar?.attempts || [];
  const safetyNotes = attempts
    .filter((attempt) => attempt.requiresManualAction || attempt.manualAction || attempt.loginNeeded || attempt.quotaHit)
    .map((attempt) => [
      attempt.profile || "Profile",
      attempt.quotaHit ? "Quota/limit hit" : "",
      attempt.loginNeeded ? "Login needed" : "",
      attempt.manualAction || ""
    ].filter(Boolean).join(" | "));
  const safetyHtml = safetyNotes.length
    ? `<span class="safety-note">${escapeHtml(safetyNotes.join(" || "))}</span>`
    : "";
  els.hookFileList.innerHTML = `${safetyHtml}${files.map((file) => (
    `<a href="${escapeHtml(file.url)}" target="_blank" rel="noreferrer">${escapeHtml(file.kind)}: ${escapeHtml(file.name)}</a>`
  )).join("") || '<span class="muted">Hook files will appear here.</span>'}`;
  if (videoPath) {
    els.hookVideoPreview.src = hookVideoUrl(videoPath);
    els.hookVideoPreview.classList.remove("is-hidden");
  } else {
    els.hookVideoPreview.classList.add("is-hidden");
    els.hookVideoPreview.removeAttribute("src");
  }
  const ctaVideoPath = hookAvatar.ctaVideoPath || hookAvatar.ctaAvatar?.videoPath || "";
  const middleVideoPaths = Object.values(hookAvatar.middleAvatarVideos || {});
  const success = status === "complete" || Boolean(videoPath || ctaVideoPath || middleVideoPaths.length);
  setHookState(success ? (middleVideoPaths.length || ctaVideoPath ? "Avatar pack ready" : "Hook video ready") : "Avatar pack prepared", "success");
  setTask(success ? "Avatar clips ready" : "Avatar pack ready", ctaVideoPath || middleVideoPaths[0] || videoPath || hookAvatar.hookDir || "", "success");
  setTerminalStatus(success ? "Avatar clip flow complete" : "Hook+Focus+CTA prompt pack prepared");
  appendTerminal(`Hook+Focus+CTA avatar ${status}${avatarText ? ` | ${avatarText}` : ""}: ${hookAvatar.hookDir || ""}`, "stdout");
  loadHookProfiles({ primary: activeProfile || undefined }).catch((error) => {
    appendTerminal(error.message, "stderr");
  });
  activeStep("hook");
  setHookBusy(false);
  setFinalState("Ready to render", "idle");
  setFinalBusy(false);
}

async function prepareHookAvatar() {
  const payload = hookAvatarPayload();
  setHookState("Preparing", "busy");
  setTask("Preparing avatar pack", `Row ${payload.row} | ${payload.presenter} | ${payload.avatarLabel} | ${payload.tone}`, "busy");
  setTerminalStatus("Preparing hook+focus+CTA avatar prompt pack");
  appendTerminal(`POST /api/hook-avatar/prepare row=${payload.row}`);
  activeStep("hook");
  setHookBusy(true);
  const response = await fetch("/api/hook-avatar/prepare", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Hook prepare failed: ${response.status}`);
  }
  renderHookAvatarResult(data.hookAvatar || {});
  scheduleArtifactCheck(payload.row);
}

function connectHookAvatarRun(runId) {
  if (state.hookAvatarEventSource) {
    state.hookAvatarEventSource.close();
  }
  const source = new EventSource(`/api/hook-avatar/runs/${encodeURIComponent(runId)}/events`);
  state.hookAvatarEventSource = source;
  source.addEventListener("log", (event) => {
    const entry = JSON.parse(event.data);
    appendTerminal(entry.text, entry.stream);
    setTask("Generating avatar pack", entry.text, entry.stream === "stderr" ? "error" : "busy");
    setTerminalStatus(entry.text);
  });
  source.addEventListener("status", (event) => {
    const run = JSON.parse(event.data);
    if (run.status === "running") {
      setTask("Generating avatar pack", `Run ${run.id}`, "busy");
      setTerminalStatus(`Running: ${run.id}`);
      return;
    }
    source.close();
    state.hookAvatarEventSource = null;
    if (run.status === "complete") {
      renderHookAvatarResult(run.result || {});
      appendTerminal(`Avatar pack run complete: ${run.id}`, "stdout");
      scheduleArtifactCheck(Number(run.result?.row || els.assetRowInput.value || 0));
      return;
    }
    const message = run.error || "Avatar pack generation failed.";
    setHookState("Failed", "error");
    setTask("Avatar pack failed", message, "error");
    setTerminalStatus("Avatar pack generation failed");
    appendTerminal(message, "stderr");
    if (run.result) {
      renderHookAvatarResult(run.result);
      setHookState("Failed", "error");
    }
    setHookBusy(false);
  });
  source.onerror = () => {
    appendTerminal(`Avatar pack event stream interrupted for ${runId}.`, "stderr");
  };
}

async function generateHookAvatar() {
  const payload = hookAvatarPayload({ prepareOnly: false });
  setHookState("Generating", "busy");
  setTask("Generating avatar pack", `Google Vids | Row ${payload.row} | ${payload.profiles.join(" -> ")}`, "busy");
  setTerminalStatus("Starting Google Vids hook+focus+CTA avatar run");
  appendTerminal(`POST /api/hook-avatar/runs row=${payload.row} profiles=${payload.profiles.join(", ")}`);
  activeStep("hook");
  setHookBusy(true);
  const response = await fetch("/api/hook-avatar/runs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Avatar pack run failed: ${response.status}`);
  }
  state.lastHookAvatarRunId = data.run?.id || "";
  connectHookAvatarRun(state.lastHookAvatarRunId);
}

function connectAssetRun(runId) {
  if (state.assetEventSource) {
    state.assetEventSource.close();
  }
  const source = new EventSource(`/api/assets/runs/${encodeURIComponent(runId)}/events`);
  state.assetEventSource = source;
  source.addEventListener("log", (event) => {
    const entry = JSON.parse(event.data);
    appendTerminal(entry.text, entry.stream);
    setTask("Building assets", entry.text, entry.stream === "stderr" ? "error" : "busy");
    setTerminalStatus(entry.text);
  });
  source.addEventListener("status", (event) => {
    const run = JSON.parse(event.data);
    if (run.status === "running") {
      setTask("Building assets", `Run ${run.id}`, "busy");
      setTerminalStatus(`Running: ${run.id}`);
      return;
    }
    source.close();
    state.assetEventSource = null;
    if (run.status === "complete") {
      renderAssetBuild(run.result || {});
      setAssetState("Assets ready", "success");
      appendTerminal(`Asset run complete: ${run.id}`, "stdout");
      scheduleArtifactCheck(Number(run.result?.row || els.assetRowInput.value || 0));
      return;
    }
    const message = run.error || "Asset run failed.";
    setAssetState("Failed", "error");
    setTask("Asset build failed", message, "error");
    setTerminalStatus("Asset build failed");
    appendTerminal(message, "stderr");
    els.assetSummary.textContent = message;
    els.assetResult.classList.remove("is-hidden");
    setAssetBusy(false);
  });
  source.onerror = () => {
    appendTerminal(`Event stream interrupted for ${runId}.`, "stderr");
  };
}

async function buildAssets() {
  if (!state.inputPath) {
    throw new Error("Excel file pehle load karo.");
  }
  const row = Number(els.assetRowInput.value || 0);
  if (!Number.isFinite(row) || row < 2) {
    throw new Error("Valid Excel row number select karo.");
  }
  setAssetState("Building", "busy");
  setTask("Building assets", `Row ${row}`, "busy");
  setTerminalStatus(`Starting asset build for row ${row}`);
  appendTerminal(`POST /api/assets/build-run row=${row}`);
  activeStep("asset");
  setAssetBusy(true);
  const response = await fetch("/api/assets/build-run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input: state.inputPath, row })
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Asset build failed: ${response.status}`);
  }
  connectAssetRun(data.run?.id);
}

async function runAssetBuildFromUi() {
  try {
    await buildAssets();
  } catch (error) {
    setAssetState("Failed", "error");
    setTask("Asset build failed", error.message, "error");
    appendTerminal(error.message, "stderr");
    els.assetSummary.textContent = error.message;
    els.assetResult.classList.remove("is-hidden");
    setAssetBusy(false);
  }
}

async function openLatestAssets() {
  if (!state.lastAssetFolder) return;
  appendTerminal(`POST /api/open ${state.lastAssetFolder}`);
  const response = await fetch("/api/open", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path: state.lastAssetFolder })
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Open folder failed: ${response.status}`);
  }
}

async function openLatestScriptFolder() {
  if (!state.lastScriptFolder) return;
  appendTerminal(`POST /api/open ${state.lastScriptFolder}`);
  const response = await fetch("/api/open", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path: state.lastScriptFolder })
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Open script folder failed: ${response.status}`);
  }
}

async function openLatestHookAvatarFolder() {
  if (!state.lastHookAvatarFolder) return;
  appendTerminal(`POST /api/open ${state.lastHookAvatarFolder}`);
  const response = await fetch("/api/open", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path: state.lastHookAvatarFolder })
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Open hook folder failed: ${response.status}`);
  }
}

function finalReelPayload(extra = {}) {
  const row = Number(els.assetRowInput.value || 0);
  if (!state.inputPath) {
    throw new Error("Excel file pehle load karo.");
  }
  if (!Number.isFinite(row) || row < 2) {
    throw new Error("Valid Excel row number select karo.");
  }
  const tool = selectedToolForRow(row) || {};
  const primaryProfile = els.hookPrimaryProfileSelect?.value || "work/google-vids-profile";
  const fallbackProfile = els.hookFallbackEnabled?.checked ? (els.hookFallbackProfileSelect?.value || "") : "";
  const profiles = [primaryProfile, fallbackProfile].filter(Boolean);
  return {
    input: state.inputPath,
    row,
    toolName: tool.name || tool.tool_name || "",
    toolUrl: tool.url || tool.tool_url || "",
    scriptLanguage: els.scriptLanguageSelect?.value || "Hinglish",
    presenter: els.hookPresenterSelect?.value || "female",
    hookAvatarCharacter: els.hookCharacterSelect?.value || "auto_by_reel",
    hookAvatarCharacterLabel: hookCharacterLabel(els.hookCharacterSelect?.value || "auto_by_reel"),
    voiceoverProvider: els.finalVoiceProviderSelect?.value || "free",
    assetsDir: Number(state.lastAssetRow || 0) === row ? state.lastAssetFolder : "",
    scriptDir: state.lastScriptFolder || "",
    hookAvatarFolder: state.lastHookAvatarFolder || "",
    hookAvatarVideo: state.lastHookAvatarVideo || "",
    voiceoverDir: Number(state.lastFinalReelRow || 0) === row && state.lastFinalReelFolder
      ? `${state.lastFinalReelFolder}/voiceovers`
      : "",
    voiceoverSourceVideo: state.lastVidsVoiceoverExport || "",
    profile: primaryProfile,
    primaryProfile,
    fallbackProfile,
    fallbackEnabled: Boolean(els.hookFallbackEnabled?.checked && fallbackProfile),
    profiles,
    ...extra
  };
}

function renderFinalReelResult(finalReel = {}) {
  const videoPath = finalReel.videoPath || finalReel.outputPath || "";
  state.lastFinalReelFolder = finalReel.finalDir || finalReel.folder || "";
  state.lastFinalReelVideo = videoPath;
  state.lastFinalReelRow = Number(finalReel.row || els.assetRowInput.value || 0);
  state.lastVidsVoiceoverExport = finalReel.vidsVoiceover?.exportedPath
    || finalReel.voiceoverSourceVideo
    || finalReel.mp4Path
    || state.lastVidsVoiceoverExport
    || "";
  els.finalResult?.classList.remove("is-hidden");
  if (els.finalToolName) {
    els.finalToolName.textContent = finalReel.tool?.tool_name || finalReel.tool?.name || "Final reel ready";
  }
  if (els.finalStatusText) {
    const score = Number(finalReel.qualityScore || 0);
    els.finalStatusText.textContent = score ? `Quality ${score}/100` : (finalReel.status || "Ready");
  }
  if (els.finalFolderPath) {
    els.finalFolderPath.textContent = state.lastFinalReelFolder || "";
  }
  if (els.finalSummary) {
    const decision = finalReel.decisions
      ? [finalReel.decisions.hook, finalReel.decisions.body, finalReel.decisions.cta].filter(Boolean).join(" ")
      : "";
    els.finalSummary.textContent = finalReel.summary || decision || "Final reel rendered. Human review before posting.";
  }
  if (videoPath && els.finalVideoPreview) {
    els.finalVideoPreview.src = finalVideoUrl(videoPath);
    els.finalVideoPreview.classList.remove("is-hidden");
  } else if (els.finalVideoPreview) {
    els.finalVideoPreview.classList.add("is-hidden");
    els.finalVideoPreview.removeAttribute("src");
  }
  const voiceoverFile = pickVoiceoverPreviewFile(finalReel);
  const voiceoverUrl = voiceoverFile ? fileUrl(voiceoverFile) : "";
  state.lastVoiceoverPreviewUrl = voiceoverUrl;
  state.lastVoiceoverPreviewName = voiceoverFile?.name || "";
  if (voiceoverUrl && els.voiceoverAudioPreview) {
    els.voiceoverAudioPreview.src = voiceoverUrl;
    els.voiceoverAudioPreview.load();
    els.voiceoverPreviewBox?.classList.remove("is-hidden");
    if (els.voiceoverPreviewInfo) {
      els.voiceoverPreviewInfo.textContent = `${voiceoverFile?.kind || "voiceover"}: ${voiceoverFile?.name || "preview"}`;
    }
  } else if (els.voiceoverAudioPreview) {
    els.voiceoverAudioPreview.pause();
    els.voiceoverAudioPreview.removeAttribute("src");
    els.voiceoverAudioPreview.load();
    els.voiceoverPreviewBox?.classList.add("is-hidden");
    if (els.voiceoverPreviewInfo) {
      els.voiceoverPreviewInfo.textContent = "Voiceover preview will appear after Vids voiceover/export.";
    }
  }
  if (els.playVoiceoverBtn) {
    els.playVoiceoverBtn.disabled = !voiceoverUrl;
    els.playVoiceoverBtn.textContent = "Play Voiceover";
  }
  if (els.finalFileList) {
    const files = (finalReel.files || []).slice(0, 16);
    els.finalFileList.innerHTML = files.map((file) => (
      `<a href="${escapeHtml(file.url)}" target="_blank" rel="noreferrer">${escapeHtml(file.kind)}: ${escapeHtml(file.name)}</a>`
    )).join("") || '<span class="muted">Final files will appear here.</span>';
  }
  setFinalState(videoPath ? "Final ready" : "Prepared", "success");
  setTask(videoPath ? "Final reel ready" : "Final reel prepared", videoPath || state.lastFinalReelFolder || "", "success");
  setTerminalStatus(videoPath ? "Final MP4 ready" : "Final render prepared");
  appendTerminal(`Final reel ${finalReel.status || "ready"}: ${videoPath || state.lastFinalReelFolder}`, "stdout");
  activeStep("final");
  setFinalBusy(false);
}

async function toggleVoiceoverPlayback() {
  const audio = els.voiceoverAudioPreview;
  if (!audio || !state.lastVoiceoverPreviewUrl) {
    setTask("No voiceover preview", "Generate Vids Voiceover first.", "idle");
    return;
  }
  if (!audio.src) {
    audio.src = state.lastVoiceoverPreviewUrl;
    audio.load();
  }
  if (audio.paused) {
    await audio.play();
    if (els.playVoiceoverBtn) els.playVoiceoverBtn.textContent = "Pause Voiceover";
    setTask("Playing voiceover", state.lastVoiceoverPreviewName || "Voiceover preview", "success");
    setTerminalStatus("Voiceover preview playing");
  } else {
    audio.pause();
    if (els.playVoiceoverBtn) els.playVoiceoverBtn.textContent = "Play Voiceover";
    setTerminalStatus("Voiceover preview paused");
  }
}

function connectFinalReelRun(runId) {
  if (state.finalReelEventSource) {
    state.finalReelEventSource.close();
  }
  const source = new EventSource(`/api/final-reel/runs/${encodeURIComponent(runId)}/events`);
  state.finalReelEventSource = source;
  source.addEventListener("log", (event) => {
    const entry = JSON.parse(event.data);
    appendTerminal(entry.text, entry.stream);
    setTerminalStatus(entry.text);
  });
  source.addEventListener("progress", (event) => {
    const progress = JSON.parse(event.data);
    renderFinalPipeline(progress.steps || []);
    const active = progress.active || {};
    if (active.label) {
      const tone = active.status === "failed" ? "error" : active.status === "complete" ? "success" : "busy";
      setTask(active.label, active.detail || "Final reel workflow", tone);
      setFinalState(active.label, tone);
    }
  });
  source.addEventListener("status", (event) => {
    const run = JSON.parse(event.data);
    if (run.status === "running") {
      setTask("Rendering final reel", `Run ${run.id}`, "busy");
      setTerminalStatus(`Running: ${run.id}`);
      renderFinalPipeline(run.steps || []);
      return;
    }
    source.close();
    state.finalReelEventSource = null;
    renderFinalPipeline(run.steps || []);
    if (run.status === "complete") {
      renderFinalReelResult(run.result || {});
      appendTerminal(`Final reel run complete: ${run.id}`, "stdout");
      scheduleArtifactCheck(Number(run.result?.row || els.assetRowInput.value || 0));
      return;
    }
    const message = run.error || "Final reel render failed.";
    setFinalState("Failed", "error");
    setTask("Final reel failed", message, "error");
    setTerminalStatus("Final reel render failed");
    appendTerminal(message, "stderr");
    if (run.result) {
      renderFinalReelResult(run.result);
      setFinalState("Failed", "error");
    }
    setFinalBusy(false);
  });
  source.onerror = () => {
    appendTerminal(`Final reel event stream interrupted for ${runId}.`, "stderr");
  };
}

async function renderFinalReel() {
  const payload = finalReelPayload();
  setFinalState("Rendering", "busy");
  setTask("Rendering final reel", `Row ${payload.row} | ${payload.voiceoverProvider}`, "busy");
  setTerminalStatus("Starting final reel render");
  appendTerminal(`POST /api/final-reel/runs row=${payload.row} voice=${payload.voiceoverProvider}`);
  renderFinalPipeline([{ id: "start", label: "Final Reel", status: "running", detail: "Starting render." }]);
  activeStep("final");
  setFinalBusy(true);
  const response = await fetch("/api/final-reel/runs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Final render failed: ${response.status}`);
  }
  state.lastFinalReelRunId = data.run?.id || "";
  connectFinalReelRun(state.lastFinalReelRunId);
}

async function generateVidsVoiceover() {
  const payload = finalReelPayload({
    fromScene: 2,
    remainingFromScene: 2,
    voiceoverProvider: "google-vids-voiceover"
  });
  setFinalState("Generating voice", "busy");
  setTask("Generating Vids voiceover", `Hook skipped | Row ${payload.row} | ${payload.profiles.join(" -> ")}`, "busy");
  setTerminalStatus("Starting Google Vids Voiceover tab run");
  appendTerminal(`POST /api/final-reel/vids-voiceover/runs row=${payload.row} fromScene=2 profiles=${payload.profiles.join(", ")}`);
  renderFinalPipeline([{ id: "start", label: "Vids Voiceover", status: "running", detail: "Skipping hook and generating narration from the Voiceover tab." }]);
  activeStep("final");
  setFinalBusy(true);
  const response = await fetch("/api/final-reel/vids-voiceover/runs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Vids voiceover run failed: ${response.status}`);
  }
  state.lastFinalReelRunId = data.run?.id || "";
  connectFinalReelRun(state.lastFinalReelRunId);
}

async function openLatestFinalFolder() {
  if (!state.lastFinalReelFolder) return;
  appendTerminal(`POST /api/open ${state.lastFinalReelFolder}`);
  const response = await fetch("/api/open", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path: state.lastFinalReelFolder })
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Open final folder failed: ${response.status}`);
  }
}

els.fileInput.addEventListener("change", () => {
  const file = els.fileInput.files?.[0];
  els.fileName.textContent = file?.name || "No file selected";
  els.fileHint.textContent = file ? `${formatBytes(file.size)} ready to import.` : "Choose .xlsx, .xls, or .csv file.";
  setState(file ? "Ready" : "Waiting", file ? "ready" : "idle");
  setBusy(false);
  activeStep("load");
});

els.defaultBtn.addEventListener("click", async () => {
  try {
    await loadDefaultAndAnalyze();
  } catch (error) {
    setState("Failed", "error");
    els.fileHint.textContent = error.message;
  } finally {
    setBusy(false);
  }
});

els.openTrackerExcelBtn.addEventListener("click", async () => {
  try {
    await openTrackerExcel();
  } catch (error) {
    setTask("Tracker open failed", error.message, "error");
    setTerminalStatus("Tracker open failed");
    appendTerminal(error.message, "stderr");
  }
});

els.importBtn.addEventListener("click", async () => {
  try {
    await uploadAndAnalyze(els.fileInput.files?.[0]);
  } catch (error) {
    setState("Failed", "error");
    els.fileHint.textContent = error.message;
  } finally {
    setBusy(false);
  }
});

els.previewBody.addEventListener("click", (event) => {
  const button = event.target.closest(".row-pick");
  if (!button) return;
  els.assetRowInput.value = button.dataset.row || "2";
  els.toolSelect.value = button.dataset.row || "";
  updateSelectedTool();
  activeStep("select");
});

els.toolSelect.addEventListener("change", () => {
  if (els.toolSelect.value) {
    els.assetRowInput.value = els.toolSelect.value;
  }
  updateSelectedTool();
  activeStep("select");
});

els.toolSearchInput.addEventListener("input", () => {
  const matches = filterTools(els.toolSearchInput.value);
  renderToolOptions(matches);
  els.toolOptionCount.textContent = `${matches.length} match${matches.length === 1 ? "" : "es"}`;
  setTerminalStatus(`${matches.length} tool match${matches.length === 1 ? "" : "es"}`);
});

els.assetRowInput.addEventListener("input", () => {
  updateSelectedTool();
  activeStep("select");
});

els.scriptSceneCount.addEventListener("change", () => {
  const seconds = Number(els.scriptSceneCount.value || 5) * 10;
  setScriptState(`Ready ${seconds}s`, "idle");
  setScriptBusy(false);
});

els.scriptLanguageSelect.addEventListener("change", () => {
  setScriptState(`${els.scriptLanguageSelect.value} ready`, "idle");
  setTerminalStatus(`Script type: ${els.scriptLanguageSelect.value}`);
  setFinalBusy(false);
});

els.finalVoiceProviderSelect?.addEventListener("change", () => {
  setFinalState(`${els.finalVoiceProviderSelect.value} voice`, "idle");
  setTerminalStatus(`Final voice provider: ${els.finalVoiceProviderSelect.value}`);
});

for (const control of [
  els.hookPresenterSelect,
  els.hookCharacterSelect,
  els.hookToneSelect,
  els.hookDurationSelect,
  els.hookPrimaryProfileSelect,
  els.hookFallbackProfileSelect,
  els.hookFallbackEnabled
].filter(Boolean)) {
  control.addEventListener("change", () => {
    setHookState("Ready", "idle");
    setHookBusy(false);
    renderHookProfileStatus();
    renderProfileManager();
    setTerminalStatus(`Hook setup: ${els.hookPresenterSelect.value}, ${hookCharacterLabel(els.hookCharacterSelect?.value)}, ${els.hookToneSelect.value}, ${els.hookDurationSelect.value}s`);
    saveHookSettings().catch((error) => {
      appendTerminal(error.message, "stderr");
    });
  });
}

els.hookFallbackEnabled?.addEventListener("change", () => {
  if (els.hookFallbackProfileSelect) {
    els.hookFallbackProfileSelect.disabled = !els.hookFallbackEnabled.checked;
  }
  renderHookProfileStatus();
  renderProfileManager();
});

els.refreshHookProfilesBtn?.addEventListener("click", async () => {
  try {
    setTerminalStatus("Refreshing profiles");
    await loadHookProfiles();
  } catch (error) {
    setTask("Profile refresh failed", error.message, "error");
    setTerminalStatus("Profile refresh failed");
    appendTerminal(error.message, "stderr");
    if (els.hookProfileStatus) {
      els.hookProfileStatus.innerHTML = `<span data-tone="error">${escapeHtml(error.message)}</span>`;
    }
  }
});

els.addHookProfileBtn?.addEventListener("click", async () => {
  try {
    await addHookProfile();
  } catch (error) {
    setTask("Profile add failed", error.message, "error");
    setTerminalStatus("Profile add failed");
    appendTerminal(error.message, "stderr");
    if (els.hookProfileStatus) {
      els.hookProfileStatus.innerHTML = `<span data-tone="error">${escapeHtml(error.message)}</span>`;
    }
  }
});

els.loginHookProfileBtn?.addEventListener("click", async () => {
  try {
    await loginSelectedHookProfile();
  } catch (error) {
    setTask("Profile login failed", error.message, "error");
    setTerminalStatus("Profile login failed");
    appendTerminal(error.message, "stderr");
    if (els.hookProfileStatus) {
      els.hookProfileStatus.innerHTML = `<span data-tone="error">${escapeHtml(error.message)}</span>`;
    }
  }
});

els.profileRefreshBtn?.addEventListener("click", async () => {
  try {
    activeStep("profile");
    setTerminalStatus("Refreshing profile manager");
    await loadHookProfiles();
  } catch (error) {
    setProfileState("Refresh failed", "error");
    setTask("Profile refresh failed", error.message, "error");
    setTerminalStatus("Profile refresh failed");
    appendTerminal(error.message, "stderr");
  }
});

els.profileAddBtn?.addEventListener("click", async () => {
  try {
    await addHookProfile();
  } catch (error) {
    setProfileState("Add failed", "error");
    setTask("Profile add failed", error.message, "error");
    setTerminalStatus("Profile add failed");
    appendTerminal(error.message, "stderr");
  }
});

els.profileAddLoginBtn?.addEventListener("click", async () => {
  try {
    const profile = await addHookProfile();
    if (profile?.path) {
      await loginHookProfile(profile.path);
    }
  } catch (error) {
    setProfileState("Login failed", "error");
    setTask("Profile login failed", error.message, "error");
    setTerminalStatus("Profile login failed");
    appendTerminal(error.message, "stderr");
  }
});

els.profileLoginSelectedBtn?.addEventListener("click", async () => {
  try {
    await loginSelectedHookProfile();
  } catch (error) {
    setProfileState("Login failed", "error");
    setTask("Profile login failed", error.message, "error");
    setTerminalStatus("Profile login failed");
    appendTerminal(error.message, "stderr");
  }
});

els.profileManagerList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-profile-action]");
  if (!button) return;
  const profile = button.dataset.profile || "";
  const action = button.dataset.profileAction || "";
  if (!profile) return;
  try {
    if (action === "primary") {
      els.hookPrimaryProfileSelect.value = profile;
      renderHookProfileOptions({ primary: profile, fallback: els.hookFallbackProfileSelect?.value || "" });
      renderHookProfileStatus();
      renderProfileManager();
      setTerminalStatus(`Primary profile: ${profile}`);
      activeStep("profile");
      return;
    }
    if (action === "fallback") {
      if (els.hookFallbackEnabled) {
        els.hookFallbackEnabled.checked = true;
      }
      if (els.hookFallbackProfileSelect) {
        els.hookFallbackProfileSelect.disabled = false;
        els.hookFallbackProfileSelect.value = profile;
      }
      renderHookProfileStatus();
      renderProfileManager();
      setTerminalStatus(`Fallback profile: ${profile}`);
      activeStep("profile");
      return;
    }
    if (action === "login") {
      await loginHookProfile(profile);
      return;
    }
    if (action === "rename") {
      await renameHookProfile(profile);
      return;
    }
    if (action === "remove") {
      await removeHookProfile(profile);
    }
  } catch (error) {
    setProfileState("Action failed", "error");
    setTask("Profile action failed", error.message, "error");
    setTerminalStatus("Profile action failed");
    appendTerminal(error.message, "stderr");
  }
});

els.buildAssetsBtn.addEventListener("click", runAssetBuildFromUi);

els.useExistingAssetsBtn.addEventListener("click", () => {
  const asset = state.latestArtifacts?.latestAssets;
  if (!asset?.assetBuild) return;
  appendTerminal(`Using existing assets: ${asset.folder}`, "stdout");
  renderAssetBuild(asset.assetBuild);
  setAssetState("Old assets ready", "success");
  setTask("Old assets selected", asset.folder || "Existing assets selected", "success");
});

els.generateNewAssetsBtn.addEventListener("click", runAssetBuildFromUi);

els.useExistingScriptBtn.addEventListener("click", () => {
  const script = state.latestArtifacts?.latestScript;
  if (!script?.scriptBuild) return;
  appendTerminal(`Using existing script: ${script.folder}`, "stdout");
  renderScriptResult(script.scriptBuild);
  setScriptState("Old script ready", "success");
  setTask("Old script selected", script.folder || "Existing script selected", "success");
});

els.generateScriptBtn.addEventListener("click", async () => {
  try {
    await generateReelScript();
  } catch (error) {
    setScriptState("Failed", "error");
    setTask("Script failed", error.message, "error");
    setTerminalStatus("Script generation failed");
    appendTerminal(error.message, "stderr");
    els.scriptResult.classList.remove("is-hidden");
    setScriptBusy(false);
  }
});

els.prepareHookAvatarBtn.addEventListener("click", async () => {
  try {
    await prepareHookAvatar();
  } catch (error) {
    setHookState("Failed", "error");
    setTask("Hook prepare failed", error.message, "error");
    setTerminalStatus("Hook prepare failed");
    appendTerminal(error.message, "stderr");
    els.hookResult.classList.remove("is-hidden");
    setHookBusy(false);
  }
});

els.generateHookAvatarBtn.addEventListener("click", async () => {
  try {
    await generateHookAvatar();
  } catch (error) {
    setHookState("Failed", "error");
    setTask("Avatar pack failed", error.message, "error");
    setTerminalStatus("Avatar pack generation failed");
    appendTerminal(error.message, "stderr");
    els.hookResult.classList.remove("is-hidden");
    setHookBusy(false);
  }
});

els.generateRemainingVidsBtn?.addEventListener("click", async () => {
  try {
    await generateVidsVoiceover();
  } catch (error) {
    setFinalState("Failed", "error");
    setTask("Vids voiceover failed", error.message, "error");
    setTerminalStatus("Vids voiceover generation failed");
    appendTerminal(error.message, "stderr");
    els.finalResult?.classList.remove("is-hidden");
    setFinalBusy(false);
  }
});

els.playVoiceoverBtn?.addEventListener("click", async () => {
  try {
    await toggleVoiceoverPlayback();
  } catch (error) {
    setTask("Voiceover play failed", error.message, "error");
    setTerminalStatus("Voiceover preview failed");
    appendTerminal(error.message, "stderr");
  }
});

els.voiceoverAudioPreview?.addEventListener("pause", () => {
  if (els.playVoiceoverBtn) els.playVoiceoverBtn.textContent = "Play Voiceover";
});

els.voiceoverAudioPreview?.addEventListener("ended", () => {
  if (els.playVoiceoverBtn) els.playVoiceoverBtn.textContent = "Play Voiceover";
  setTerminalStatus("Voiceover preview ended");
});

els.renderFinalReelBtn?.addEventListener("click", async () => {
  try {
    await renderFinalReel();
  } catch (error) {
    setFinalState("Failed", "error");
    setTask("Final reel failed", error.message, "error");
    setTerminalStatus("Final reel render failed");
    appendTerminal(error.message, "stderr");
    els.finalResult?.classList.remove("is-hidden");
    setFinalBusy(false);
  }
});

els.clearTerminalBtn.addEventListener("click", () => {
  els.terminalOutput.textContent = "Terminal cleared.\n";
  setTerminalStatus("Cleared");
});

els.terminalFullscreenBtn.addEventListener("click", () => {
  document.body.classList.toggle("terminal-fullscreen");
  els.terminalFullscreenBtn.textContent = document.body.classList.contains("terminal-fullscreen") ? "Exit" : "Full";
});

els.themeToggleBtn?.addEventListener("click", () => {
  const nextTheme = currentTheme() === "dark" ? "light" : "dark";
  saveTheme(nextTheme);
  applyTheme(nextTheme);
  setTask(`${nextTheme === "dark" ? "Dark" : "Light"} theme`, "Dashboard theme updated", "success");
  setTerminalStatus(`Theme: ${nextTheme}`);
  appendTerminal(`Theme changed: ${nextTheme}`);
});

els.viewAssetsBtn.addEventListener("click", async () => {
  try {
    await openLatestAssets();
  } catch (error) {
    setAssetState("Open failed", "error");
    els.assetSummary.textContent = error.message;
    els.assetResult.classList.remove("is-hidden");
  }
});

els.viewScriptFolderBtn.addEventListener("click", async () => {
  try {
    await openLatestScriptFolder();
  } catch (error) {
    setScriptState("Open failed", "error");
    setTerminalStatus("Open script folder failed");
    appendTerminal(error.message, "stderr");
  }
});

els.viewHookAvatarBtn.addEventListener("click", async () => {
  try {
    await openLatestHookAvatarFolder();
  } catch (error) {
    setHookState("Open failed", "error");
    setTerminalStatus("Open hook folder failed");
    appendTerminal(error.message, "stderr");
  }
});

els.viewFinalFolderBtn?.addEventListener("click", async () => {
  try {
    await openLatestFinalFolder();
  } catch (error) {
    setFinalState("Open failed", "error");
    setTerminalStatus("Open final folder failed");
    appendTerminal(error.message, "stderr");
  }
});

activeStep("load");
applyTheme(readSavedTheme());
renderFinalPipeline([]);
renderHookCharacterOptions([{ label: "Google Vids auto", value: "auto" }], "auto_by_reel");
initWorkspaceResizer();
loadDashboardDefaults().catch((error) => {
  appendTerminal(error.message, "stderr");
});
loadHookProfiles().catch((error) => {
  appendTerminal(error.message, "stderr");
  setProfileState("Load failed", "error");
  if (els.profileManagerSummary) {
    els.profileManagerSummary.innerHTML = `<span><strong>!</strong>${escapeHtml(error.message)}</span>`;
  }
  if (els.hookProfileStatus) {
    els.hookProfileStatus.innerHTML = `<span data-tone="error">${escapeHtml(error.message)}</span>`;
  }
});
