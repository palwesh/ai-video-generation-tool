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
  workspaceTabButtons: [...document.querySelectorAll("[data-workspace-tab-button]")],
  workspacePanels: [...document.querySelectorAll("[data-workspace-panel]")],
  globalProfileStrip: document.getElementById("globalProfileStrip"),
  globalProfileSummary: document.getElementById("globalProfileSummary"),
  globalPrimaryProfileLabel: document.getElementById("globalPrimaryProfileLabel"),
  globalFallbackProfileLabel: document.getElementById("globalFallbackProfileLabel"),
  manageProfilesTabBtn: document.getElementById("manageProfilesTabBtn"),
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
  scriptVideoStepLink: document.getElementById("scriptVideoStepLink"),
  profileStepLink: document.getElementById("profileStepLink"),
  mainStepSections: [...document.querySelectorAll("[data-main-step-section]")],
  docsStepLink: document.getElementById("docsStepLink"),
  loadStepMeta: document.getElementById("loadStepMeta"),
  selectStepMeta: document.getElementById("selectStepMeta"),
  assetStepMeta: document.getElementById("assetStepMeta"),
  scriptStepMeta: document.getElementById("scriptStepMeta"),
  hookStepMeta: document.getElementById("hookStepMeta"),
  finalStepMeta: document.getElementById("finalStepMeta"),
  scriptVideoStepMeta: document.getElementById("scriptVideoStepMeta"),
  profileStepMeta: document.getElementById("profileStepMeta"),
  docsStepMeta: document.getElementById("docsStepMeta"),
  docState: document.getElementById("docState"),
  docTitle: document.getElementById("docTitle"),
  docStats: document.getElementById("docStats"),
  docScopeSelect: document.getElementById("docScopeSelect"),
  docSelect: document.getElementById("docSelect"),
  docSearchInput: document.getElementById("docSearchInput"),
  docMatchCount: document.getElementById("docMatchCount"),
  docToc: document.getElementById("docToc"),
  docContent: document.getElementById("docContent"),
  refreshDocsBtn: document.getElementById("refreshDocsBtn"),
  toolSearchInput: document.getElementById("toolSearchInput"),
  toolOptionCount: document.getElementById("toolOptionCount"),
  toolReadyOnlyFilter: document.getElementById("toolReadyOnlyFilter"),
  toolNoVideoFilter: document.getElementById("toolNoVideoFilter"),
  toolP0Filter: document.getElementById("toolP0Filter"),
  toolFilterSummary: document.getElementById("toolFilterSummary"),
  toolIdeaDropdown: document.getElementById("toolIdeaDropdown"),
  toolDropdownLabel: document.getElementById("toolDropdownLabel"),
  toolDropdownHint: document.getElementById("toolDropdownHint"),
  artifactNotice: document.getElementById("artifactNotice"),
  artifactNoticeTitle: document.getElementById("artifactNoticeTitle"),
  artifactNoticeDetail: document.getElementById("artifactNoticeDetail"),
  resumeVersionsPanel: document.getElementById("resumeVersionsPanel"),
  resumeArtifactSelect: document.getElementById("resumeArtifactSelect"),
  loadResumeArtifactBtn: document.getElementById("loadResumeArtifactBtn"),
  openResumeArtifactBtn: document.getElementById("openResumeArtifactBtn"),
  useExistingAssetsBtn: document.getElementById("useExistingAssetsBtn"),
  generateNewAssetsBtn: document.getElementById("generateNewAssetsBtn"),
  useExistingScriptBtn: document.getElementById("useExistingScriptBtn"),
  useExistingHookBtn: document.getElementById("useExistingHookBtn"),
  jumpToAvatarStepBtn: document.getElementById("jumpToAvatarStepBtn"),
  jumpToFinalStepBtn: document.getElementById("jumpToFinalStepBtn"),
  stepFlowState: document.getElementById("stepFlowState"),
  stepFlowStatus: document.getElementById("stepFlowStatus"),
  stepFlowTimeline: document.getElementById("stepFlowTimeline"),
  runStepFlowBtn: document.getElementById("runStepFlowBtn"),
  stopStepFlowBtn: document.getElementById("stopStepFlowBtn"),
  flowRunAssets: document.getElementById("flowRunAssets"),
  flowRunScript: document.getElementById("flowRunScript"),
  flowRunAvatar: document.getElementById("flowRunAvatar"),
  flowUseVidsAvatar: document.getElementById("flowUseVidsAvatar"),
  flowRunVidsVoiceover: document.getElementById("flowRunVidsVoiceover"),
  flowRunFinal: document.getElementById("flowRunFinal"),
  autoQueueState: document.getElementById("autoQueueState"),
  autoVideoCount: document.getElementById("autoVideoCount"),
  autoRowsInput: document.getElementById("autoRowsInput"),
  autoStartSelectedRow: document.getElementById("autoStartSelectedRow"),
  autoUseVidsHook: document.getElementById("autoUseVidsHook"),
  autoUseVidsHookLabel: document.getElementById("autoUseVidsHookLabel"),
  autoUpdateWorkbook: document.getElementById("autoUpdateWorkbook"),
  creditSafeMode: document.getElementById("creditSafeMode"),
  lowCreditVidsMode: document.getElementById("lowCreditVidsMode"),
  creditGuardNotice: document.getElementById("creditGuardNotice"),
  lowCreditVidsNotice: document.getElementById("lowCreditVidsNotice"),
  campaignCreditEstimate: document.getElementById("campaignCreditEstimate"),
  autoRunQueueBtn: document.getElementById("autoRunQueueBtn"),
  autoStopQueueBtn: document.getElementById("autoStopQueueBtn"),
  autoOpenProgressBtn: document.getElementById("autoOpenProgressBtn"),
  autoQueueMeta: document.getElementById("autoQueueMeta"),
  autoRunTimeline: document.getElementById("autoRunTimeline"),
  autoQueueList: document.getElementById("autoQueueList"),
  selectedRowsCount: document.getElementById("selectedRowsCount"),
  loadMoreToolRowsBtn: document.getElementById("loadMoreToolRowsBtn"),
  toolRowChecklist: document.getElementById("toolRowChecklist"),
  autoProfileCount: document.getElementById("autoProfileCount"),
  autoProfileList: document.getElementById("autoProfileList"),
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
  editScriptBtn: document.getElementById("editScriptBtn"),
  saveScriptBtn: document.getElementById("saveScriptBtn"),
  viewScriptFolderBtn: document.getElementById("viewScriptFolderBtn"),
  scriptEditorPanel: document.getElementById("scriptEditorPanel"),
  scriptEditorMeta: document.getElementById("scriptEditorMeta"),
  scriptHookEditor: document.getElementById("scriptHookEditor"),
  scriptBodyEditor: document.getElementById("scriptBodyEditor"),
  scriptCtaEditor: document.getElementById("scriptCtaEditor"),
  scriptCaptionEditor: document.getElementById("scriptCaptionEditor"),
  scriptHashtagsEditor: document.getElementById("scriptHashtagsEditor"),
  resetScriptEditorBtn: document.getElementById("resetScriptEditorBtn"),
  scriptSceneEditorList: document.getElementById("scriptSceneEditorList"),
  hookPresenterSelect: document.getElementById("hookPresenterSelect"),
  hookCharacterSelect: document.getElementById("hookCharacterSelect"),
  hookAvatarPhotoInput: document.getElementById("hookAvatarPhotoInput"),
  hookAvatarPhotoPreview: document.getElementById("hookAvatarPhotoPreview"),
  hookAvatarPhotoTitle: document.getElementById("hookAvatarPhotoTitle"),
  hookAvatarPhotoStatus: document.getElementById("hookAvatarPhotoStatus"),
  useFemaleAvatarPhotoBtn: document.getElementById("useFemaleAvatarPhotoBtn"),
  useMaleAvatarPhotoBtn: document.getElementById("useMaleAvatarPhotoBtn"),
  clearAvatarPhotoBtn: document.getElementById("clearAvatarPhotoBtn"),
  hookToneSelect: document.getElementById("hookToneSelect"),
  hookDurationSelect: document.getElementById("hookDurationSelect"),
  hookVideoSizeSelect: document.getElementById("hookVideoSizeSelect"),
  hookPrimaryProfileSelect: document.getElementById("hookPrimaryProfileSelect"),
  hookFallbackEnabled: document.getElementById("hookFallbackEnabled"),
  hookFallbackProfileSelect: document.getElementById("hookFallbackProfileSelect"),
  hookProfileStatus: document.getElementById("hookProfileStatus"),
  hookCreditGuardNotice: document.getElementById("hookCreditGuardNotice"),
  refreshHookProfilesBtn: document.getElementById("refreshHookProfilesBtn"),
  addHookProfileBtn: document.getElementById("addHookProfileBtn"),
  loginHookProfileBtn: document.getElementById("loginHookProfileBtn"),
  profileManager: document.getElementById("profileManager"),
  profileState: document.getElementById("profileState"),
  profileManagerSummary: document.getElementById("profileManagerSummary"),
  profileManagerList: document.getElementById("profileManagerList"),
  newHookProfileName: document.getElementById("newHookProfileName"),
  newHookProfileEmail: document.getElementById("newHookProfileEmail"),
  newHookProfilePriority: document.getElementById("newHookProfilePriority"),
  profileRefreshBtn: document.getElementById("profileRefreshBtn"),
  openProfileRegistryBtn: document.getElementById("openProfileRegistryBtn"),
  profileAddBtn: document.getElementById("profileAddBtn"),
  profileAddLoginBtn: document.getElementById("profileAddLoginBtn"),
  profileLoginSelectedBtn: document.getElementById("profileLoginSelectedBtn"),
  prepareHookAvatarBtn: document.getElementById("prepareHookAvatarBtn"),
  generateHookAvatarBtn: document.getElementById("generateHookAvatarBtn"),
  viewHookAvatarBtn: document.getElementById("viewHookAvatarBtn"),
  hookAvatarScriptEditorPanel: document.getElementById("hookAvatarScriptEditorPanel"),
  hookAvatarScriptEditorMeta: document.getElementById("hookAvatarScriptEditorMeta"),
  hookAvatarHookScriptEditor: document.getElementById("hookAvatarHookScriptEditor"),
  hookAvatarFocusScriptEditor: document.getElementById("hookAvatarFocusScriptEditor"),
  hookAvatarCtaScriptEditor: document.getElementById("hookAvatarCtaScriptEditor"),
  hookAvatarScriptReviewStatus: document.getElementById("hookAvatarScriptReviewStatus"),
  resetHookAvatarScriptBtn: document.getElementById("resetHookAvatarScriptBtn"),
  finalVoiceProviderSelect: document.getElementById("finalVoiceProviderSelect"),
  generateRemainingVidsBtn: document.getElementById("generateRemainingVidsBtn"),
  playVoiceoverBtn: document.getElementById("playVoiceoverBtn"),
  previewFinalReelBtn: document.getElementById("previewFinalReelBtn"),
  renderFinalReelBtn: document.getElementById("renderFinalReelBtn"),
  viewFinalFolderBtn: document.getElementById("viewFinalFolderBtn"),
  finalReviewPanel: document.getElementById("finalReviewPanel"),
  finalReviewMeta: document.getElementById("finalReviewMeta"),
  finalReviewChecklist: document.getElementById("finalReviewChecklist"),
  assetResult: document.getElementById("assetResult"),
  assetToolName: document.getElementById("assetToolName"),
  assetFileCount: document.getElementById("assetFileCount"),
  assetFolderPath: document.getElementById("assetFolderPath"),
  assetSummary: document.getElementById("assetSummary"),
  assetQualityPanel: document.getElementById("assetQualityPanel"),
  assetQualityScore: document.getElementById("assetQualityScore"),
  assetQualityList: document.getElementById("assetQualityList"),
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
  finalFileList: document.getElementById("finalFileList"),
  scriptVideoState: document.getElementById("scriptVideoState"),
  customScriptTitleInput: document.getElementById("customScriptTitleInput"),
  customScriptLanguageSelect: document.getElementById("customScriptLanguageSelect"),
  customScriptDurationSelect: document.getElementById("customScriptDurationSelect"),
  customScriptVideoSizeSelect: document.getElementById("customScriptVideoSizeSelect"),
  customScriptPresenterSelect: document.getElementById("customScriptPresenterSelect"),
  customScriptAvatarSelect: document.getElementById("customScriptAvatarSelect"),
  customScriptPrimaryProfileSelect: document.getElementById("customScriptPrimaryProfileSelect"),
  customScriptFallbackEnabled: document.getElementById("customScriptFallbackEnabled"),
  customScriptFallbackProfileSelect: document.getElementById("customScriptFallbackProfileSelect"),
  customScriptInput: document.getElementById("customScriptInput"),
  scriptVideoCreditGuardNotice: document.getElementById("scriptVideoCreditGuardNotice"),
  customScriptOptimizeBtn: document.getElementById("customScriptOptimizeBtn"),
  customScriptGenerateBtn: document.getElementById("customScriptGenerateBtn"),
  customScriptOpenFolderBtn: document.getElementById("customScriptOpenFolderBtn"),
  scriptVideoPipeline: document.getElementById("scriptVideoPipeline"),
  scriptVideoResult: document.getElementById("scriptVideoResult"),
  scriptVideoResultTitle: document.getElementById("scriptVideoResultTitle"),
  scriptVideoResultStatus: document.getElementById("scriptVideoResultStatus"),
  scriptVideoFolderPath: document.getElementById("scriptVideoFolderPath"),
  scriptVideoSummary: document.getElementById("scriptVideoSummary"),
  scriptVideoPreview: document.getElementById("scriptVideoPreview"),
  scriptVideoParts: document.getElementById("scriptVideoParts"),
  scriptVideoSceneList: document.getElementById("scriptVideoSceneList"),
  scriptVideoFileList: document.getElementById("scriptVideoFileList")
};

const state = {
  inputPath: "",
  tools: [],
  filteredTools: [],
  lastAssetFolder: "",
  lastAssetRow: 0,
  lastAssetInput: "",
  lastScriptFolder: "",
  lastScriptRow: 0,
  currentScriptBuild: null,
  scriptEditorOriginal: null,
  scriptEditorDirty: false,
  lastHookAvatarFolder: "",
  lastHookAvatarVideo: "",
  lastHookAvatarRunId: "",
  lastHookAvatarRow: 0,
  avatarScriptDraft: null,
  avatarScriptPreparedDraft: null,
  avatarScriptPreparedRow: 0,
  avatarScriptUserEdited: false,
  lastFinalReelFolder: "",
  lastFinalReelVideo: "",
  lastFinalReelRunId: "",
  lastFinalReelRow: 0,
  lastPreviewReelFolder: "",
  lastPreviewReelVideo: "",
  lastPreviewReelRow: 0,
  finalBusyMode: "",
  lastVidsVoiceoverFolder: "",
  lastVidsVoiceoverExport: "",
  lastVidsVoiceoverRow: 0,
  lastVoiceoverPreviewUrl: "",
  lastVoiceoverPreviewName: "",
  currentRow: 0,
  currentInput: "",
  latestArtifacts: null,
  resumeArtifacts: [],
  toolVideoStatusByRow: new Map(),
  toolVideoStatusLoading: false,
  artifactCheckTimer: null,
  artifactCheckToken: 0,
  assetEventSource: null,
  hookAvatarEventSource: null,
  finalReelEventSource: null,
  scriptVideoEventSource: null,
  currentScriptVideo: null,
  lastScriptVideoFolder: "",
  lastScriptVideoVideo: "",
  lastScriptVideoRunId: "",
  hookProfiles: [],
  profileRegistry: null,
  hookAvatarOptions: [],
  defaultAvatarPhotos: {},
  avatarHostImage: "",
  avatarHostLabel: "",
  dashboardDefaults: null,
  activeAutoQueueId: "",
  activeAutoQueueRunId: "",
  autoQueueTimer: null,
  autoQueueRunning: false,
  autoQueueProgressWorkbook: "",
  autoQueueLogCursors: new Map(),
  selectedAutoProfiles: new Set(),
  autoProfilesTouched: false,
  activeWorkspaceTab: "tool-promo",
  toolFilters: {
    readyOnly: true,
    noVideo: false,
    p0: false
  },
  toolRowRenderLimit: 500,
  docs: [],
  docCache: new Map(),
  terminalWidth: 340,
  isResizingTerminal: false,
  resizeStartX: 0,
  resizeMoved: false,
  stepFlowRunning: false,
  stepFlowStopRequested: false,
  stepFlowSteps: []
};

const TERMINAL_LAYOUT_KEY = "toolReelFactory.terminalWidth.v2";
const THEME_KEY = "toolReelFactory.theme.v2";
const WORKSPACE_TAB_KEY = "toolReelFactory.workspaceTab.v2";
const DEFAULT_TERMINAL_WIDTH = 340;
const MIN_TERMINAL_WIDTH = 280;
const MAX_TERMINAL_WIDTH = 720;
const TOOL_ROW_RENDER_BATCH = 500;
const AUTO_PROFILE_LIMIT = 4;
const CREDIT_SPEND_CONFIRM_WORD = "VIDS";
const STEP_FLOW_RUN_TIMEOUT_MS = 45 * 60 * 1000;
const DEFAULT_PRIMARY_PROFILE = "work/hr-anslation.com";
const DEFAULT_FALLBACK_PROFILE = "work/shejal.sahu-anslation.com-profile";
const DEFAULT_AVATAR_PHOTOS = {
  female: "public/avatar/altftool-female-host-custom.png",
  male: "public/avatar/altftool-male-host-main.png"
};

function currentDefaultAvatarPhotos() {
  return {
    ...DEFAULT_AVATAR_PHOTOS,
    ...(state.defaultAvatarPhotos || {})
  };
}

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

async function readJsonApi(path, options = {}) {
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

function timeLabel(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function finiteClamp(value, fallback, min, max) {
  const number = Number(value);
  return clampNumber(Number.isFinite(number) ? number : fallback, min, max);
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

function validWorkspaceTab(tab = "") {
  return ["tool-promo", "script-video", "profiles"].includes(tab) ? tab : "tool-promo";
}

function workspaceTabForHash(hash = window.location.hash || "") {
  if (hash === "#scriptVideo") return "script-video";
  if (hash === "#profileManager") return "profiles";
  if (["#loadExcel", "#selectTool", "#buildAssets", "#generateScript", "#hookAvatar", "#finalReel", "#analysisResults"].includes(hash)) {
    return "tool-promo";
  }
  return "";
}

function readSavedWorkspaceTab() {
  try {
    return localStorage.getItem(WORKSPACE_TAB_KEY) || "";
  } catch {
    return "";
  }
}

function saveWorkspaceTab(tab) {
  try {
    localStorage.setItem(WORKSPACE_TAB_KEY, tab);
  } catch {
    // Ignore storage failures; the live tab still changes.
  }
  fetch("/api/settings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ workspaceTab: tab })
  }).catch((error) => {
    appendTerminal(error.message, "stderr");
  });
}

function setWorkspaceTab(tab = "tool-promo", options = {}) {
  const nextTab = validWorkspaceTab(tab);
  state.activeWorkspaceTab = nextTab;
  document.documentElement.dataset.workspaceTab = nextTab;

  for (const button of els.workspaceTabButtons || []) {
    const active = button.dataset.workspaceTabButton === nextTab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  }

  for (const panel of els.workspacePanels || []) {
    panel.classList.toggle("is-tab-hidden", panel.dataset.workspacePanel !== nextTab);
  }

  if (options.persist !== false) {
    saveWorkspaceTab(nextTab);
  }
}

function workspaceTabFromStep(step = "") {
  if (step === "script-video") return "script-video";
  if (step === "profile") return "profiles";
  return "tool-promo";
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function docSearchTerms(query) {
  return String(query || "")
    .trim()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function highlightDocText(value, query) {
  let html = escapeHtml(value);
  const terms = docSearchTerms(query).map((term) => escapeRegExp(escapeHtml(term)));
  if (!terms.length) {
    return html;
  }
  return html.replace(new RegExp(`(${terms.join("|")})`, "gi"), "<mark>$1</mark>");
}

function countDocMatches(content, query) {
  const text = String(content || "").toLowerCase();
  return docSearchTerms(query).reduce((count, term) => {
    const needle = term.toLowerCase();
    if (!needle) return count;
    let matches = 0;
    let index = text.indexOf(needle);
    while (index !== -1) {
      matches += 1;
      index = text.indexOf(needle, index + needle.length);
    }
    return count + matches;
  }, 0);
}

function slugifyDocHeading(value, used = new Map()) {
  const base = String(value || "section")
    .toLowerCase()
    .replace(/`+/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "section";
  const count = used.get(base) || 0;
  used.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
}

function markdownToDocHtml(content, query = "") {
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
    if (/^```/.test(line)) {
      closeList();
      html += inCode ? "</code></pre>" : "<pre><code>";
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      html += `${highlightDocText(line, query)}\n`;
      continue;
    }

    if (!line.trim()) {
      closeList();
      html += '<div class="doc-gap"></div>';
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = Math.min(4, heading[1].length);
      const text = heading[2].trim();
      const id = slugifyDocHeading(text, usedHeadings);
      headings.push({ id, level, text });
      html += `<h${level} id="${id}">${highlightDocText(text, query)}</h${level}>`;
      continue;
    }

    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (bullet) {
      if (listType !== "ul") {
        closeList();
        html += "<ul>";
        listType = "ul";
      }
      html += `<li>${highlightDocText(bullet[1], query)}</li>`;
      continue;
    }

    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ordered) {
      if (listType !== "ol") {
        closeList();
        html += "<ol>";
        listType = "ol";
      }
      html += `<li>${highlightDocText(ordered[1], query)}</li>`;
      continue;
    }

    closeList();
    html += `<p>${highlightDocText(line, query)}</p>`;
  }

  closeList();
  if (inCode) {
    html += "</code></pre>";
  }
  return { html, headings };
}

function setDocState(label, tone = "idle") {
  if (!els.docState) return;
  els.docState.textContent = label;
  els.docState.dataset.tone = tone;
  if (els.docsStepMeta) {
    els.docsStepMeta.textContent = label;
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
  const optionsHtml = state.hookAvatarOptions.map((option) => (
    `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label || option.value)}</option>`
  )).join("");
  for (const select of [els.hookCharacterSelect, els.customScriptAvatarSelect].filter(Boolean)) {
    const current = preferred || select.value || "auto_by_reel";
    select.innerHTML = optionsHtml;
    select.value = state.hookAvatarOptions.some((option) => option.value === current)
      ? current
      : "auto_by_reel";
  }
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
  const alias = {
    "work/hr-anslation.com": "HR profile",
    "work/shejal.sahu-anslation.com-profile": "Sejal profile"
  }[profile.path];
  if (alias) {
    const identity = profile.email || profile.expectedEmail || profile.googleName || profile.displayName || profile.profileName || "";
    return identity ? `${alias} (${identity})` : alias;
  }
  return profile.email || profile.expectedEmail || profile.googleName || profile.displayName || profile.profileName || profile.label || `Profile ${index + 1}`;
}

function hookProfileStatus(profile = {}) {
  if (profile.statusLabel && profile.status) {
    const tone = profile.status === "available"
      ? "success"
      : profile.status === "limit_used"
        ? "error"
        : profile.status === "disabled"
          ? "idle"
          : "warn";
    return { label: profile.statusLabel, tone };
  }
  if (profile.enabled === false) {
    return { label: "Disabled", tone: "idle" };
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

function profileByPath(profilePath = "") {
  return (state.hookProfiles || []).find((profile) => profile.path === profilePath) || null;
}

function profileFriendlyName(profilePath = "", fallback = "Not selected") {
  const profile = profileByPath(profilePath);
  if (!profile) {
    return profilePath || fallback;
  }
  const index = Math.max(0, (state.hookProfiles || []).findIndex((item) => item.path === profilePath));
  return hookProfileIdentity(profile, index);
}

function currentGlobalProfiles(source = "hook") {
  const useScript = source === "script-video";
  const primarySelect = useScript ? els.customScriptPrimaryProfileSelect : els.hookPrimaryProfileSelect;
  const fallbackSelect = useScript ? els.customScriptFallbackProfileSelect : els.hookFallbackProfileSelect;
  const fallbackToggle = useScript ? els.customScriptFallbackEnabled : els.hookFallbackEnabled;
  const profiles = state.hookProfiles || [];
  const fallbackEnabled = Boolean(fallbackToggle?.checked);
  const primary = resolvePrimaryProfile(profiles, primarySelect?.value || DEFAULT_PRIMARY_PROFILE);
  const fallback = fallbackEnabled ? resolveFallbackProfile(profiles, fallbackSelect?.value || "", primary) : "";
  const cleanFallback = fallback && fallback !== primary ? fallback : "";
  return {
    primary,
    fallback: cleanFallback,
    fallbackEnabled: fallbackEnabled && Boolean(cleanFallback)
  };
}

function applyGlobalProfileSelection(selection = {}) {
  const profiles = state.hookProfiles || [];
  const primary = resolvePrimaryProfile(profiles, selection.primary || DEFAULT_PRIMARY_PROFILE);
  const fallbackEnabled = Boolean(selection.fallbackEnabled);
  const fallback = fallbackEnabled ? resolveFallbackProfile(profiles, selection.fallback || "", primary) : "";
  for (const primarySelect of [els.hookPrimaryProfileSelect, els.customScriptPrimaryProfileSelect].filter(Boolean)) {
    if ([...primarySelect.options].some((option) => option.value === primary)) {
      primarySelect.value = primary;
    }
  }
  for (const fallbackToggle of [els.hookFallbackEnabled, els.customScriptFallbackEnabled].filter(Boolean)) {
    fallbackToggle.checked = fallbackEnabled && Boolean(fallback);
  }
  for (const fallbackSelect of [els.hookFallbackProfileSelect, els.customScriptFallbackProfileSelect].filter(Boolean)) {
    fallbackSelect.disabled = !fallbackEnabled || !fallback;
    if ([...fallbackSelect.options].some((option) => option.value === fallback)) {
      fallbackSelect.value = fallback;
    } else if (!fallbackEnabled) {
      fallbackSelect.value = "";
    }
  }
}

function renderGlobalProfileStrip() {
  const counts = profileCounts();
  const selection = currentGlobalProfiles("hook");
  const hasReadyFallback = Boolean(resolveFallbackProfile(state.hookProfiles || [], "", selection.primary));
  if (els.globalProfileSummary) {
    els.globalProfileSummary.textContent = `${counts.available}/${counts.total} available | ${counts.limitUsed} limit used | ${counts.loginNeeded} login needed`;
  }
  if (els.globalPrimaryProfileLabel) {
    els.globalPrimaryProfileLabel.textContent = selection.primary
      ? `Primary: ${profileFriendlyName(selection.primary, "Not selected")}`
      : "Primary: no selectable profile";
    els.globalPrimaryProfileLabel.title = selection.primary || "";
  }
  if (els.globalFallbackProfileLabel) {
    els.globalFallbackProfileLabel.textContent = selection.fallbackEnabled && selection.fallback
      ? `Fallback: ${profileFriendlyName(selection.fallback, "Not selected")}`
      : hasReadyFallback ? "Fallback: off" : "Fallback: no second selectable profile";
    els.globalFallbackProfileLabel.title = selection.fallback || "";
  }
}

function syncGlobalProfiles(source = "hook", options = {}) {
  const selection = currentGlobalProfiles(source);
  applyGlobalProfileSelection(selection);
  renderHookProfileStatus();
  renderProfileManager();
  renderGlobalProfileStrip();
  if (options.persist !== false) {
    saveHookSettings().catch((error) => {
      appendTerminal(error.message, "stderr");
    });
  }
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
  return isHookProfileSelectable(profile) && Boolean(profile.loggedIn || profile.status === "available");
}

function isHookProfileSelectable(profile = {}) {
  return Boolean(profile.path)
    && profile.enabled !== false
    && profile.status !== "disabled"
    && profile.status !== "limit_used"
    && !quotaLimitUsed(profile.quota);
}

function resolvePrimaryProfile(profiles = [], preferredPath = "") {
  if (preferredPath) {
    const preferred = profiles.find((profile) => profile.path === preferredPath);
    if (preferred && isHookProfileSelectable(preferred)) {
      return preferred.path;
    }
  }
  return profiles.find(isHookProfileReady)?.path || profiles.find(isHookProfileSelectable)?.path || "";
}

function resolveFallbackProfile(profiles = [], preferredPath = "", primaryPath = "") {
  if (preferredPath && preferredPath !== primaryPath) {
    const preferred = profiles.find((profile) => profile.path === preferredPath);
    if (preferred && isHookProfileSelectable(preferred)) {
      return preferred.path;
    }
  }
  return profiles.find((profile) => profile.path !== primaryPath && isHookProfileReady(profile))?.path
    || profiles.find((profile) => profile.path !== primaryPath && isHookProfileSelectable(profile))?.path
    || "";
}

function uniqueProfilePaths(paths = []) {
  const seen = new Set();
  return paths.filter((profilePath) => {
    if (!profilePath || seen.has(profilePath)) return false;
    seen.add(profilePath);
    return true;
  });
}

function hookProfileOptionLabel(profile = {}, index = 0) {
  const status = hookProfileStatus(profile).label;
  return `${hookProfileIdentity(profile, index)} - ${profile.path || ""} - ${hookProfileUsage(profile)} - ${status}`;
}

function renderHookProfileOptions(preferred = {}) {
  const profiles = state.hookProfiles.length
    ? state.hookProfiles
    : [{ path: DEFAULT_PRIMARY_PROFILE, label: "HR profile", quota: {}, loggedIn: true, status: "available" }];
  const hasSelectableProfile = profiles.some(isHookProfileSelectable);
  const options = profiles.map((profile, index) => (
    `<option value="${escapeHtml(profile.path)}" ${isHookProfileSelectable(profile) ? "" : "disabled"}>${escapeHtml(hookProfileOptionLabel(profile, index))}</option>`
  )).join("");
  const primaryOptions = `${hasSelectableProfile ? "" : '<option value="">No selectable profile - add/login or wait for limit reset</option>'}${options}`;
  const applyProfileSelects = (primarySelect, fallbackSelect, fallbackToggle) => {
    if (!primarySelect || !fallbackSelect) return;
    const settings = state.dashboardDefaults?.settings || {};
    const primaryPrevious = preferred.primary
      || settings.hookPrimaryProfile
      || settings.globalPrimaryProfile
      || primarySelect.value
      || DEFAULT_PRIMARY_PROFILE;
    const fallbackPrevious = preferred.fallback
      || settings.hookFallbackProfile
      || settings.globalFallbackProfile
      || fallbackSelect.value
      || DEFAULT_FALLBACK_PROFILE;
    const fallbackEnabled = typeof preferred.fallbackEnabled === "boolean"
      ? preferred.fallbackEnabled
      : typeof settings.hookFallbackEnabled === "boolean"
        ? settings.hookFallbackEnabled
        : Boolean(fallbackToggle?.checked ?? true);
    primarySelect.innerHTML = primaryOptions;
    fallbackSelect.innerHTML = `<option value="">No fallback</option>${options}`;
    primarySelect.value = resolvePrimaryProfile(profiles, primaryPrevious);
    const selectedPrimary = primarySelect.value;
    const fallbackCandidate = fallbackEnabled
      ? resolveFallbackProfile(profiles, fallbackPrevious, selectedPrimary)
      : "";
    fallbackSelect.value = fallbackCandidate;
    if (fallbackToggle) {
      fallbackToggle.checked = fallbackEnabled && Boolean(fallbackCandidate);
    }
    fallbackSelect.disabled = !fallbackEnabled || !fallbackCandidate;
  };
  applyProfileSelects(els.hookPrimaryProfileSelect, els.hookFallbackProfileSelect, els.hookFallbackEnabled);
  applyProfileSelects(els.customScriptPrimaryProfileSelect, els.customScriptFallbackProfileSelect, els.customScriptFallbackEnabled);
  renderAutoProfileChecklist();
  renderGlobalProfileStrip();
}

function selectedHookProfiles() {
  return selectedGenerationProfiles("hook");
}

function selectedGenerationProfiles(source = "hook") {
  const useScript = source === "script-video";
  const profiles = state.hookProfiles || [];
  const primarySelect = useScript ? els.customScriptPrimaryProfileSelect : els.hookPrimaryProfileSelect;
  const fallbackSelect = useScript ? els.customScriptFallbackProfileSelect : els.hookFallbackProfileSelect;
  const fallbackToggle = useScript ? els.customScriptFallbackEnabled : els.hookFallbackEnabled;
  const primary = resolvePrimaryProfile(profiles, primarySelect?.value || DEFAULT_PRIMARY_PROFILE);
  const fallback = fallbackToggle?.checked
    ? resolveFallbackProfile(profiles, fallbackSelect?.value || "", primary)
    : "";
  const selected = uniqueProfilePaths([primary, fallback])
    .filter((profilePath) => {
      if (!profiles.length) return Boolean(profilePath);
      const profile = profiles.find((item) => item.path === profilePath);
      return profile ? isHookProfileSelectable(profile) : false;
    });
  if (selected.length) {
    return selected;
  }
  return profiles.filter(isHookProfileSelectable).map((profile) => profile.path).slice(0, 2);
}

function requireGenerationProfiles(source = "hook") {
  const profiles = selectedGenerationProfiles(source);
  if (!profiles.length) {
    throw new Error("Koi selectable Google Vids profile nahi hai. Profiles tab me profile add karo, disabled profile enable karo, ya limit-used profile ke bajay doosra profile select karo.");
  }
  return profiles;
}

function defaultAutomationProfilePaths() {
  const profiles = state.hookProfiles || [];
  const selected = selectedHookProfiles()
    .filter((profilePath) => {
      const profile = profiles.find((item) => item.path === profilePath);
      return profile ? isHookProfileSelectable(profile) : true;
    });
  const ready = profiles
    .filter(isHookProfileReady)
    .map((profile) => profile.path);
  const selectable = profiles
    .filter(isHookProfileSelectable)
    .map((profile) => profile.path);
  const combined = [...selected, ...ready, ...selectable]
    .filter((profilePath, index, list) => profilePath && list.indexOf(profilePath) === index)
    .slice(0, AUTO_PROFILE_LIMIT);
  if (combined.length) {
    return combined;
  }
  return selected.slice(0, AUTO_PROFILE_LIMIT);
}

function selectedAutomationProfiles() {
  const profiles = state.hookProfiles || [];
  const explicit = [...state.selectedAutoProfiles]
    .filter((profilePath) => {
      const profile = profiles.find((item) => item.path === profilePath);
      return profile ? isHookProfileSelectable(profile) : true;
    })
    .slice(0, AUTO_PROFILE_LIMIT);
  const selected = explicit.length ? explicit : defaultAutomationProfilePaths();
  return selected.length ? selected : [DEFAULT_PRIMARY_PROFILE, DEFAULT_FALLBACK_PROFILE].filter(Boolean);
}

function updateAutoProfileCount() {
  if (!els.autoProfileCount) return;
  const selected = selectedAutomationProfiles();
  els.autoProfileCount.textContent = `${selected.length} selected`;
  els.autoProfileCount.dataset.tone = selected.length >= 2 ? "success" : "busy";
}

function renderAutoProfileChecklist() {
  if (!els.autoProfileList) return;
  const profiles = state.hookProfiles || [];
  updateAutoProfileCount();
  if (!profiles.length) {
    els.autoProfileList.innerHTML = '<span class="muted">Profiles loading...</span>';
    return;
  }
  const selectedSet = state.selectedAutoProfiles.size
    ? new Set(selectedAutomationProfiles())
    : new Set(defaultAutomationProfilePaths());
  const selectedOrder = [...selectedSet];
  els.autoProfileList.innerHTML = profiles.map((profile, index) => {
    const status = hookProfileStatus(profile);
    const disabled = state.autoQueueRunning || !isHookProfileSelectable(profile);
    const checked = selectedSet.has(profile.path) && !disabled;
    const selectedIndex = selectedOrder.indexOf(profile.path);
    const role = selectedIndex === 0
      ? "Primary"
      : selectedIndex > 0
        ? `Fallback ${selectedIndex}`
        : `Profile ${index + 1}`;
    return `
      <label class="auto-profile-option ${checked ? "is-selected" : ""}" title="${escapeHtml(profile.path || "")}">
        <input type="checkbox" data-auto-profile="${escapeHtml(profile.path)}" data-locked="${disabled && !state.autoQueueRunning ? "true" : "false"}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
        <span><strong>${escapeHtml(role)}</strong> - ${escapeHtml(hookProfileIdentity(profile, index))} | ${escapeHtml(status.label)} | ${escapeHtml(hookProfileUsage(profile))}</span>
      </label>
    `;
  }).join("");
  updateAutoProfileCount();
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
  const readyFallback = resolveFallbackProfile(profiles, "", els.hookPrimaryProfileSelect?.value || "");
  const fallbackText = els.hookFallbackEnabled?.checked
    ? `Fallback enabled: ${els.hookFallbackProfileSelect?.value || "not selected"}`
    : readyFallback ? "Fallback disabled" : "Fallback disabled: no second selectable profile";
  els.hookProfileStatus.innerHTML = `${chips}<span>${escapeHtml(fallbackText)}</span>`;
  renderAutoProfileChecklist();
  renderFinalReview();
}

function profileCounts() {
  const profiles = state.hookProfiles || [];
  return {
    total: profiles.length,
    available: profiles.filter(isHookProfileReady).length,
    limitUsed: profiles.filter((profile) => quotaLimitUsed(profile.quota)).length,
    disabled: profiles.filter((profile) => profile.enabled === false).length,
    loginNeeded: profiles.filter((profile) => profile.enabled !== false && (profile.status === "login_needed" || (!profile.loggedIn && !quotaLimitUsed(profile.quota)))).length
  };
}

function renderProfileManager() {
  if (!els.profileManagerSummary || !els.profileManagerList) return;
  const profiles = state.hookProfiles || [];
  const counts = profileCounts();
  setProfileState(`${counts.available}/${counts.total} available`, profiles.length ? (counts.available ? "success" : "error") : "idle");
  renderGlobalProfileStrip();
  els.profileManagerSummary.innerHTML = [
    ["Total", counts.total],
    ["Available", counts.available],
    ["Limit used", counts.limitUsed],
    ["Disabled", counts.disabled],
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
    const canUseForGeneration = isHookProfileSelectable(profile);
    const canSetPrimary = canUseForGeneration && profile.path !== primary;
    const canSetFallback = canUseForGeneration && profile.path !== primary;
    const rowLabel = `P${String(index + 1).padStart(2, "0")}`;
    const roleBadges = [
      profile.path === primary ? `<span data-tone="primary">Primary</span>` : "",
      profile.path === fallback ? `<span data-tone="fallback">Fallback</span>` : ""
    ].filter(Boolean).join("");
    const noteParts = [
      profile.expectedEmail ? `Expected: ${profile.expectedEmail}` : "",
      Number.isFinite(Number(profile.priority)) ? `Priority: ${profile.priority}` : "",
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
          <button class="secondary-action" data-profile-action="primary" data-profile="${escapeHtml(profile.path)}" type="button" ${canSetPrimary ? "" : "disabled"}>Primary</button>
          <button class="secondary-action" data-profile-action="fallback" data-profile="${escapeHtml(profile.path)}" type="button" ${canSetFallback ? "" : "disabled"}>Fallback</button>
          <button class="secondary-action" data-profile-action="login" data-profile="${escapeHtml(profile.path)}" type="button">Login</button>
          <button class="secondary-action" data-profile-action="toggle" data-enabled="${profile.enabled === false ? "true" : "false"}" data-profile="${escapeHtml(profile.path)}" type="button">${profile.enabled === false ? "Enable" : "Disable"}</button>
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
  state.profileRegistry = data.registry || state.profileRegistry || null;
  renderHookProfileOptions(preferred);
  renderHookProfileStatus();
  renderProfileManager();
  return state.hookProfiles;
}

async function addHookProfile(options = {}) {
  const profileName = String(options.profileName ?? els.newHookProfileName?.value ?? "").trim();
  const email = String(options.email ?? els.newHookProfileEmail?.value ?? "").trim();
  const priority = String(options.priority ?? els.newHookProfilePriority?.value ?? "").trim();
  setTask("Adding Vids profile", "New browser profile folder create ho raha hai", "busy");
  setTerminalStatus("Adding Google Vids profile");
  setProfileState("Adding", "busy");
  appendTerminal("POST /api/profiles");
  const response = await fetch("/api/profiles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ profile: profileName, email, priority })
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Profile add failed: ${response.status}`);
  }
  state.hookProfiles = data.profiles || [];
  renderHookProfileOptions({ primary: data.profile?.path, fallback: els.hookFallbackProfileSelect?.value || "" });
  syncGlobalProfiles("hook");
  if (els.newHookProfileName) {
    els.newHookProfileName.value = "";
  }
  if (els.newHookProfileEmail) {
    els.newHookProfileEmail.value = "";
  }
  if (els.newHookProfilePriority) {
    els.newHookProfilePriority.value = "";
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
  syncGlobalProfiles("hook");
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
  renderHookProfileOptions({ primary, fallback, fallbackEnabled: Boolean(fallback) });
  syncGlobalProfiles("hook");
  appendTerminal(`Profile removed: ${data.profile || profile}${data.deletedFolder ? " | folder deleted" : ""}`, "stdout");
  setTask("Profile removed", data.profile || profile, "success");
  setTerminalStatus("Profile removed");
  activeStep("profile");
}

async function openProfileRegistryExcel() {
  setTask("Opening Profile Excel", "Profile registry sync ho raha hai", "busy");
  setTerminalStatus("Opening profile Excel");
  appendTerminal("GET /api/profiles/registry");
  const registry = await readJsonApi("/api/profiles/registry");
  state.profileRegistry = registry.registry || state.profileRegistry;
  const registryPath = state.profileRegistry?.path || state.profileRegistry?.absolutePath || "";
  if (!registryPath) {
    throw new Error("Profile Excel path not available.");
  }
  appendTerminal(`POST /api/open ${registryPath}`);
  await readJsonApi("/api/open", {
    method: "POST",
    body: JSON.stringify({ path: registryPath })
  });
  setTask("Profile Excel opened", registryPath, "success");
  setTerminalStatus("Profile Excel opened");
  activeStep("profile");
}

async function toggleHookProfile(profilePath = "", enabled = true) {
  const profile = String(profilePath || "").trim();
  if (!profile) {
    throw new Error("Profile path missing.");
  }

  setTask(enabled ? "Enabling Vids profile" : "Disabling Vids profile", profile, "busy");
  setTerminalStatus(enabled ? "Enabling profile" : "Disabling profile");
  setProfileState("Updating", "busy");
  appendTerminal(`POST /api/profiles/toggle ${profile} enabled=${enabled}`);
  const response = await fetch("/api/profiles/toggle", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ profile, enabled })
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Profile toggle failed: ${response.status}`);
  }

  state.hookProfiles = data.profiles || [];
  renderHookProfileOptions({
    primary: els.hookPrimaryProfileSelect?.value || "",
    fallback: els.hookFallbackProfileSelect?.value || ""
  });
  syncGlobalProfiles("hook");
  appendTerminal(`Profile ${enabled ? "enabled" : "disabled"}: ${data.profile || profile}`, "stdout");
  setTask(enabled ? "Profile enabled" : "Profile disabled", data.profile || profile, "success");
  setTerminalStatus(enabled ? "Profile enabled" : "Profile disabled");
  activeStep("profile");
}

async function loginHookProfile(profilePath = "") {
  const profile = profilePath || els.hookPrimaryProfileSelect?.value || selectedHookProfiles()[0] || "work/google-vids-profile";
  const profileInfo = profileByPath(profile);
  setTask("Opening profile login", profile, "busy");
  setTerminalStatus("Opening Google Vids login");
  setProfileState("Login open", "busy");
  appendTerminal(`POST /api/profile-login profile=${profile}`);
  const response = await fetch("/api/profile-login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ profile, email: profileInfo?.expectedEmail || "" })
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
  els.openTrackerExcelBtn.textContent = isBusy ? "Wait..." : "Open Tracker Excel";
}

function setAssetBusy(isBusy) {
  els.buildAssetsBtn.disabled = isBusy || !state.inputPath || !Number(els.assetRowInput.value || 0);
  els.viewAssetsBtn.disabled = isBusy || !state.lastAssetFolder;
  els.buildAssetsBtn.textContent = isBusy ? "Building..." : "Build Assets";
}

function setScriptBusy(isBusy) {
  const hasRow = Boolean(state.inputPath && Number(els.assetRowInput.value || 0));
  const hasScript = Boolean(state.currentScriptBuild && state.lastScriptFolder);
  els.generateScriptBtn.disabled = isBusy || !hasRow;
  if (els.editScriptBtn) {
    els.editScriptBtn.disabled = isBusy || !hasScript;
  }
  if (els.saveScriptBtn) {
    els.saveScriptBtn.disabled = isBusy || !hasScript;
  }
  if (els.resetScriptEditorBtn) {
    els.resetScriptEditorBtn.disabled = isBusy || !hasScript;
  }
  els.viewScriptFolderBtn.disabled = isBusy || !state.lastScriptFolder;
  els.generateScriptBtn.textContent = isBusy ? "Generating..." : "Generate Script";
  if (els.saveScriptBtn) {
    els.saveScriptBtn.textContent = isBusy ? "Saving..." : "Save Update";
  }
}

function creditSafeEnabled() {
  return els.creditSafeMode ? els.creditSafeMode.checked : true;
}

function lowCreditVidsEnabled() {
  return els.lowCreditVidsMode ? els.lowCreditVidsMode.checked : true;
}

function plannedAutoQueueRows() {
  const requestedCount = Math.floor(finiteClamp(els.autoVideoCount?.value, 1, 1, 50));
  const explicitRows = parseAutoRows(els.autoRowsInput?.value || "").slice(0, requestedCount);
  if (explicitRows.length) return explicitRows;
  const selectedRow = Number(els.assetRowInput?.value || 2);
  const startRow = els.autoStartSelectedRow?.checked && Number.isFinite(selectedRow) && selectedRow >= 2 ? selectedRow : 2;
  return Array.from({ length: requestedCount }, (_, index) => startRow + index);
}

function campaignCreditEstimate() {
  const rows = plannedAutoQueueRows();
  const safe = creditSafeEnabled();
  const lowCredit = lowCreditVidsEnabled();
  const useVidsHook = Boolean(els.autoUseVidsHook?.checked) && !safe;
  const stepFlowVidsAvatar = Boolean(els.flowRunAvatar?.checked && els.flowUseVidsAvatar?.checked) && !safe;
  const stepFlowVidsVoiceover = Boolean(els.flowRunVidsVoiceover?.checked) && !safe;
  const stepAvatarClips = lowCredit ? 1 : 3;
  const queueClips = useVidsHook ? rows.length : 0;
  const currentRowClips = (stepFlowVidsAvatar ? stepAvatarClips : 0) + (stepFlowVidsVoiceover ? 1 : 0);
  return {
    rows,
    safe,
    lowCredit,
    queueClips,
    currentRowClips,
    totalClips: queueClips + currentRowClips,
    availableProfiles: (state.hookProfiles || []).filter(isHookProfileReady).length,
    selectableProfiles: selectedAutomationProfiles().length
  };
}

function renderCampaignCreditEstimate() {
  if (!els.campaignCreditEstimate) return;
  const estimate = campaignCreditEstimate();
  const rowLabel = estimate.rows.length ? `Rows ${estimate.rows.slice(0, 8).join(", ")}${estimate.rows.length > 8 ? "..." : ""}` : "No rows";
  const mode = estimate.safe ? "Credit Safe local mode" : estimate.lowCredit ? "Low-credit Vids" : "Full Vids pack";
  const profileText = estimate.safe
    ? "No Vids profile required for safe local queue."
    : estimate.availableProfiles
      ? `${estimate.availableProfiles} ready profile(s), ${estimate.selectableProfiles} selected for fallback.`
      : `${estimate.selectableProfiles} selected profile(s). Login may open before generation.`;
  const clipPlan = !estimate.safe && estimate.lowCredit
    ? "Hook avatar only; body/final stays local real demo."
    : !estimate.safe
      ? "Hook, focus, CTA clips may use quota."
      : "No Vids clips planned unless unlocked.";
  els.campaignCreditEstimate.dataset.tone = estimate.safe
    ? "safe"
    : estimate.totalClips
      ? "armed"
      : "warn";
  els.campaignCreditEstimate.textContent = `${mode}: approx ${estimate.totalClips} Google Vids clip(s). ${clipPlan} ${rowLabel}. ${profileText}`;
}

function creditGuardSummary() {
  const safe = creditSafeEnabled();
  const useVidsHook = Boolean(els.autoUseVidsHook?.checked);
  const lowCredit = lowCreditVidsEnabled();
  if (safe) {
    return {
      tone: "safe",
      title: "Credit Safe ON",
      detail: "Google Vids generation locked. Use local/free steps without spending credits."
    };
  }
  if (useVidsHook) {
    return {
      tone: "armed",
      title: lowCredit ? "Low-Credit Vids" : "Vids Unlocked",
      detail: lowCredit
        ? "Only hook avatar generation is planned; body uses real demo assets and local edit."
        : "Google Vids actions are unlocked. You will confirm before any avatar or voiceover generation starts."
    };
  }
  return {
    tone: "warn",
    title: lowCredit ? "Low-Credit Ready" : "Vids Unlocked",
    detail: lowCredit
      ? "Avatar pack generation will use hook-only by default to save credits."
      : "Google Vids avatar/voice buttons can spend credits after confirmation."
  };
}

function renderCreditGuard() {
  const summary = creditGuardSummary();
  const lowCredit = lowCreditVidsEnabled();
  for (const notice of [els.creditGuardNotice, els.hookCreditGuardNotice, els.scriptVideoCreditGuardNotice].filter(Boolean)) {
    notice.dataset.tone = summary.tone;
    notice.innerHTML = `<strong>${escapeHtml(summary.title)}</strong><span>${escapeHtml(summary.detail)}</span>`;
  }
  if (els.lowCreditVidsNotice) {
    els.lowCreditVidsNotice.dataset.tone = lowCredit ? "safe" : "full";
    els.lowCreditVidsNotice.textContent = lowCredit
      ? "Low-credit ON: Google Vids hook only. Body uses real tool demo, local voice, captions, and final edit."
      : "Full pack ON: hook, focus, and CTA avatar clips can be generated when Vids is unlocked.";
  }
  if (els.autoUseVidsHookLabel) {
    els.autoUseVidsHookLabel.textContent = creditSafeEnabled()
      ? "Hook Vids + Local (locked)"
      : lowCredit
        ? "Hook-only Vids + Local"
        : "Hook Vids + Local";
  }
  renderCampaignCreditEstimate();
  if (creditSafeEnabled() && ["openai", "elevenlabs"].includes(els.finalVoiceProviderSelect?.value || "")) {
    els.finalVoiceProviderSelect.value = "free";
    setTerminalStatus("Credit Safe: voice switched to free");
  }
}

function confirmCreditSpend(title, detail) {
  if (creditSafeEnabled()) {
    renderCreditGuard();
    setTask("Credit Safe is ON", "Turn Credit Safe off only when you intentionally want Google Vids generation.", "error");
    setTerminalStatus("Blocked by Credit Safe");
    appendTerminal(`${title} blocked by Credit Safe Mode.`, "stderr");
    return false;
  }
  const typed = window.prompt(
    `${title}\n\n${detail}\n\nThis can use Google Vids/API credits. Type ${CREDIT_SPEND_CONFIRM_WORD} to continue.`
  );
  const allowed = String(typed || "").trim().toUpperCase() === CREDIT_SPEND_CONFIRM_WORD;
  if (!allowed) {
    setTask("Credit action canceled", "No generation started, credits safe.", "idle");
    setTerminalStatus("Credit action canceled");
    appendTerminal(`${title} canceled before spending credits.`);
  }
  return allowed;
}

function setHookBusy(isBusy) {
  const hasRow = Boolean(state.inputPath && Number(els.assetRowInput.value || 0));
  const safe = creditSafeEnabled();
  const lowCredit = lowCreditVidsEnabled();
  els.prepareHookAvatarBtn.disabled = isBusy || !hasRow;
  els.generateHookAvatarBtn.disabled = isBusy || !hasRow || safe;
  els.viewHookAvatarBtn.disabled = isBusy || !state.lastHookAvatarFolder;
  els.prepareHookAvatarBtn.textContent = isBusy ? "Preparing..." : lowCredit ? "Prepare Hook Prompt" : "Prepare Avatar Pack";
  els.generateHookAvatarBtn.textContent = isBusy
    ? "Generating..."
    : safe
      ? "Unlock Vids to Generate"
      : lowCredit
        ? "Generate Hook Only"
        : "Generate Avatar Pack";
  renderCreditGuard();
}

function setFinalBusy(isBusy) {
  const hasRow = Boolean(state.inputPath && Number(els.assetRowInput.value || 0));
  const safe = creditSafeEnabled();
  const previewBusy = isBusy && state.finalBusyMode === "preview";
  const renderBusy = isBusy && state.finalBusyMode !== "preview";
  if (els.generateRemainingVidsBtn) {
    els.generateRemainingVidsBtn.disabled = isBusy || !hasRow || safe;
    els.generateRemainingVidsBtn.textContent = isBusy ? "Working..." : safe ? "Unlock Vids Voiceover" : "Generate Vids Voiceover";
  }
  if (els.playVoiceoverBtn) {
    els.playVoiceoverBtn.disabled = isBusy || !state.lastVoiceoverPreviewUrl;
  }
  if (els.previewFinalReelBtn) {
    els.previewFinalReelBtn.disabled = isBusy || !hasRow;
    els.previewFinalReelBtn.textContent = previewBusy ? "Previewing..." : "Quick Preview";
  }
  if (els.renderFinalReelBtn) {
    els.renderFinalReelBtn.disabled = isBusy || !hasRow;
    els.renderFinalReelBtn.textContent = renderBusy ? "Rendering..." : "Render Final Reel";
  }
  if (els.viewFinalFolderBtn) {
    els.viewFinalFolderBtn.disabled = isBusy || !(state.lastFinalReelFolder || state.lastPreviewReelFolder);
  }
  if (!isBusy) {
    state.finalBusyMode = "";
  }
  renderCreditGuard();
}

function setScriptVideoState(label, tone = "idle") {
  if (els.scriptVideoState) {
    els.scriptVideoState.textContent = label;
    els.scriptVideoState.dataset.tone = tone;
  }
  if (els.scriptVideoStepMeta) {
    els.scriptVideoStepMeta.textContent = label;
  }
  if (els.scriptVideoStepLink) {
    els.scriptVideoStepLink.classList.toggle("busy", tone === "busy");
    els.scriptVideoStepLink.classList.toggle("done", tone === "success");
  }
}

function setScriptVideoBusy(isBusy) {
  const hasScript = Boolean(els.customScriptInput?.value.trim());
  const safe = creditSafeEnabled();
  if (els.customScriptOptimizeBtn) {
    els.customScriptOptimizeBtn.disabled = isBusy || !hasScript;
    els.customScriptOptimizeBtn.textContent = isBusy ? "Working..." : "Optimize Script";
  }
  if (els.customScriptGenerateBtn) {
    els.customScriptGenerateBtn.disabled = isBusy || !hasScript || safe;
    els.customScriptGenerateBtn.textContent = isBusy ? "Generating..." : safe ? "Unlock Vids to Generate" : "Generate in Google Vids";
  }
  if (els.customScriptOpenFolderBtn) {
    els.customScriptOpenFolderBtn.disabled = isBusy || !state.lastScriptVideoFolder;
  }
  renderCreditGuard();
}

function setStepFlowState(label, tone = "idle") {
  if (!els.stepFlowState) return;
  els.stepFlowState.textContent = label;
  els.stepFlowState.dataset.tone = tone;
}

function stepFlowHasRow() {
  const row = Number(els.assetRowInput?.value || 0);
  return Boolean(state.inputPath && Number.isFinite(row) && row >= 2);
}

function selectedStepFlowOptions() {
  return {
    assets: Boolean(els.flowRunAssets?.checked),
    script: Boolean(els.flowRunScript?.checked),
    avatar: Boolean(els.flowRunAvatar?.checked),
    vidsAvatar: Boolean(els.flowUseVidsAvatar?.checked),
    vidsVoiceover: Boolean(els.flowRunVidsVoiceover?.checked),
    final: Boolean(els.flowRunFinal?.checked)
  };
}

function stepFlowPlan() {
  const options = selectedStepFlowOptions();
  const steps = [];
  if (options.assets) steps.push({ key: "asset", label: "Assets" });
  if (options.script) steps.push({ key: "script", label: "Script" });
  if (options.avatar) {
    const useVidsAvatar = options.vidsAvatar && !creditSafeEnabled();
    steps.push({
      key: useVidsAvatar ? "vids-avatar" : "avatar",
      label: useVidsAvatar
        ? (lowCreditVidsEnabled() ? "Vids Hook" : "Vids Avatar")
        : (lowCreditVidsEnabled() ? "Hook Prompt" : "Avatar Prompt")
    });
  }
  if (options.vidsVoiceover) {
    steps.push({ key: "vids-voiceover", label: "Vids Voiceover" });
  }
  if (options.final) steps.push({ key: "final", label: "Final Reel" });
  return steps;
}

function renderStepFlowTimeline(steps = state.stepFlowSteps) {
  if (!els.stepFlowTimeline) return;
  if (!steps.length) {
    els.stepFlowTimeline.innerHTML = '<span data-status="idle">Select at least one step.</span>';
    return;
  }
  els.stepFlowTimeline.innerHTML = steps.map((step) => (
    `<span data-status="${escapeHtml(step.status || "pending")}" title="${escapeHtml(step.detail || step.label)}">${escapeHtml(step.label)}</span>`
  )).join("");
}

function updateStepFlowStep(key, status, detail = "") {
  state.stepFlowSteps = state.stepFlowSteps.map((step) => (
    step.key === key ? { ...step, status, detail } : step
  ));
  renderStepFlowTimeline();
}

function refreshStepFlowControls() {
  const busy = Boolean(state.stepFlowRunning);
  const hasRow = stepFlowHasRow();
  const plan = stepFlowPlan();
  if (els.runStepFlowBtn) {
    els.runStepFlowBtn.disabled = busy || !hasRow || !plan.length;
    els.runStepFlowBtn.textContent = busy ? "Running Step Flow..." : "Run Selected Steps";
  }
  if (els.stopStepFlowBtn) {
    els.stopStepFlowBtn.disabled = !busy || state.stepFlowStopRequested;
    els.stopStepFlowBtn.textContent = state.stepFlowStopRequested ? "Stopping..." : "Stop After Current";
  }
  for (const input of [
    els.flowRunAssets,
    els.flowRunScript,
    els.flowRunAvatar,
    els.flowUseVidsAvatar,
    els.flowRunVidsVoiceover,
    els.flowRunFinal
  ].filter(Boolean)) {
    input.disabled = busy;
  }
  if (els.stepFlowStatus && !busy) {
    if (!state.inputPath) {
      els.stepFlowStatus.textContent = "Excel load karo, row select karo, phir selected steps run honge.";
    } else if (!hasRow) {
      els.stepFlowStatus.textContent = "Valid tool row select karo.";
    } else {
      const row = Number(els.assetRowInput.value || 0);
      els.stepFlowStatus.textContent = `${plan.length || 0} step(s) ready for row ${row}. Current settings use honge.`;
    }
  }
  if (!busy) {
    setStepFlowState(hasRow && plan.length ? "Ready" : "Waiting", hasRow && plan.length ? "success" : "idle");
    if (!state.stepFlowSteps.length) {
      state.stepFlowSteps = plan.map((step) => ({ ...step, status: "pending" }));
      renderStepFlowTimeline();
    }
  }
}

function setStepFlowBusy(isBusy) {
  state.stepFlowRunning = Boolean(isBusy);
  if (!isBusy) {
    state.stepFlowStopRequested = false;
  }
  refreshStepFlowControls();
}

function scrollStepIntoView(stepKey) {
  const targets = {
    asset: "buildAssets",
    script: "generateScript",
    avatar: "hookAvatar",
    "vids-avatar": "hookAvatar",
    "vids-voiceover": "finalReel",
    final: "finalReel"
  };
  const id = targets[stepKey] || "selectTool";
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setAutoQueueState(label, tone = "idle") {
  if (!els.autoQueueState) return;
  els.autoQueueState.textContent = label;
  els.autoQueueState.dataset.tone = tone;
}

function refreshAutoQueueControls() {
  if (!els.autoRunQueueBtn) return;
  const busy = Boolean(state.autoQueueRunning);
  const hasInput = Boolean(state.inputPath);
  const safe = creditSafeEnabled();
  els.autoRunQueueBtn.disabled = busy || !hasInput;
  els.autoStopQueueBtn.disabled = !busy || !state.activeAutoQueueId;
  els.autoOpenProgressBtn.disabled = !state.autoQueueProgressWorkbook;
  els.autoRunQueueBtn.textContent = busy ? "Running..." : safe ? "Run Safe Auto" : "Run Auto";
  for (const input of [
    els.autoVideoCount,
    els.autoRowsInput,
    els.autoStartSelectedRow,
    els.autoUseVidsHook,
    els.autoUpdateWorkbook,
    els.creditSafeMode,
    els.lowCreditVidsMode
  ].filter(Boolean)) {
    input.disabled = busy;
  }
  for (const input of document.querySelectorAll("[data-auto-profile]")) {
    input.disabled = busy || input.dataset.locked === "true";
  }
  updateSelectedRowsCount();
  updateAutoProfileCount();
  renderCreditGuard();
}

function setAutoQueueBusy(isBusy) {
  state.autoQueueRunning = Boolean(isBusy);
  refreshAutoQueueControls();
}

function updateAutoQueueHint() {
  if (!els.autoQueueMeta || state.autoQueueRunning || state.activeAutoQueueId) return;
  const creditHint = creditSafeEnabled()
    ? "Credit Safe: local only."
    : lowCreditVidsEnabled()
      ? "Low-credit Vids: hook-only avatar."
      : "Full Vids pack unlocked.";
  if (!state.inputPath) {
    els.autoQueueMeta.textContent = "Load Excel, select tool row, then run automation.";
    renderCreditGuard();
    return;
  }
  const count = Math.floor(finiteClamp(els.autoVideoCount?.value, 1, 1, 50));
  const explicitRows = parseAutoRows(els.autoRowsInput?.value || "");
  const selectedRow = Number(els.assetRowInput?.value || 0);
  if (explicitRows.length) {
    els.autoQueueMeta.textContent = `Ready: ${Math.min(count, explicitRows.length)} video(s) for rows ${explicitRows.slice(0, count).join(", ")}. ${creditHint}`;
    renderCreditGuard();
    return;
  }
  els.autoQueueMeta.textContent = `Ready: ${count} video(s) ${els.autoStartSelectedRow?.checked ? `from selected row ${selectedRow || 2}` : "from row 2"}. ${creditHint}`;
  renderCreditGuard();
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

function selectedWorkflowRow() {
  return Number(els.assetRowInput?.value || state.currentRow || 0);
}

function artifactRowValue(artifact = {}) {
  return Number(
    artifact.row
    || artifact.assetBuild?.row
    || artifact.scriptBuild?.row
    || artifact.hookAvatar?.row
    || artifact.finalReel?.row
    || artifact.voiceover?.row
    || 0
  );
}

function artifactMatchesWorkflowRow(artifact = {}, row = selectedWorkflowRow()) {
  const artifactRow = artifactRowValue(artifact);
  return !artifactRow || !row || artifactRow === Number(row);
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
  state.lastScriptRow = 0;
  state.lastHookAvatarFolder = "";
  state.lastHookAvatarVideo = "";
  state.lastHookAvatarRunId = "";
  state.lastHookAvatarRow = 0;
  state.lastFinalReelFolder = "";
  state.lastFinalReelVideo = "";
  state.lastFinalReelRunId = "";
  state.lastFinalReelRow = 0;
  state.lastPreviewReelFolder = "";
  state.lastPreviewReelVideo = "";
  state.lastPreviewReelRow = 0;
  state.lastVidsVoiceoverFolder = "";
  state.lastVidsVoiceoverExport = "";
  state.lastVidsVoiceoverRow = 0;
  state.lastVoiceoverPreviewUrl = "";
  state.lastVoiceoverPreviewName = "";
  state.currentScriptBuild = null;
  state.scriptEditorOriginal = null;
  state.latestArtifacts = null;
  state.resumeArtifacts = [];
  if (els.resumeVersionsPanel) {
    els.resumeVersionsPanel.classList.add("is-hidden");
  }
  if (els.resumeArtifactSelect) {
    els.resumeArtifactSelect.innerHTML = "";
  }
  state.stepFlowSteps = [];
  els.assetResult.classList.add("is-hidden");
  els.scriptResult.classList.add("is-hidden");
  if (els.scriptEditorPanel) els.scriptEditorPanel.open = false;
  if (els.scriptSceneEditorList) {
    els.scriptSceneEditorList.innerHTML = '<span class="muted">Generate script to edit scene-wise voiceover.</span>';
  }
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
  renderFinalReview();
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

function finalReviewItem(label, ok, detail = "", status = "") {
  const finalStatus = status || (ok ? "complete" : "pending");
  return `
    <span data-status="${escapeHtml(finalStatus)}" title="${escapeHtml(detail || label)}">
      <strong>${escapeHtml(label)}</strong>
      ${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
    </span>
  `;
}

function renderFinalReview(finalReel = {}) {
  if (!els.finalReviewChecklist) return;
  const row = Number(els.assetRowInput?.value || 0);
  const tool = selectedToolForRow(row) || {};
  const resultIsPreview = Boolean(finalReel.preview);
  const assetsReady = Boolean(Number(state.lastAssetRow || 0) === row && state.lastAssetFolder);
  const scriptReady = Boolean(Number(state.lastScriptRow || 0) === row && state.lastScriptFolder && state.currentScriptBuild);
  const hookPrepared = Boolean(Number(state.lastHookAvatarRow || 0) === row && state.lastHookAvatarFolder);
  const hookVideoReady = Boolean(Number(state.lastHookAvatarRow || 0) === row && state.lastHookAvatarVideo);
  const previewVideo = resultIsPreview
    ? (finalReel.videoPath || finalReel.outputPath || "")
    : Number(state.lastPreviewReelRow || 0) === row ? state.lastPreviewReelVideo || "" : "";
  const finalVideo = resultIsPreview
    ? (Number(state.lastFinalReelRow || 0) === row ? state.lastFinalReelVideo : "")
    : (finalReel.videoPath || finalReel.outputPath || (Number(state.lastFinalReelRow || 0) === row ? state.lastFinalReelVideo || "" : ""));
  const qualityScore = resultIsPreview ? 0 : Number(finalReel.qualityScore || finalReel.quality?.score || 0);
  const warnings = resultIsPreview ? [] : (finalReel.qualityWarnings || finalReel.quality?.warnings || []);
  const safe = creditSafeEnabled();
  const lowCredit = lowCreditVidsEnabled();
  const readyProfileCount = (state.hookProfiles || []).filter(isHookProfileReady).length;
  const selectedProfilePaths = selectedGenerationProfiles("hook");
  const selectedNeedsLogin = selectedProfilePaths.some((profilePath) => {
    const profile = profileByPath(profilePath);
    return profile && !isHookProfileReady(profile);
  });
  const voiceMode = els.finalVoiceProviderSelect?.value || "free";
  const sameRowVidsVoiceover = Number(state.lastVidsVoiceoverRow || 0) === row;
  const hasVidsVoiceover = sameRowVidsVoiceover && Boolean(state.lastVidsVoiceoverFolder || state.lastVidsVoiceoverExport);
  const selectedName = toolDisplayName(tool || {});
  const profileReady = safe || readyProfileCount > 0 || selectedProfilePaths.length > 0;
  const profileDetail = safe
    ? "Credit Safe ON, local render allowed."
    : readyProfileCount > 0
      ? `${readyProfileCount} ready profile(s), ${selectedProfilePaths.length || readyProfileCount} selected.`
      : selectedProfilePaths.length
        ? `${selectedProfilePaths.length} selected. Login may open before Vids generation.`
        : "Select or add a profile.";
  const checks = [
    finalReviewItem("Tool row", row >= 2, row >= 2 ? `Row ${row}${selectedName ? ` | ${selectedName}` : ""}` : "Select a valid Excel row."),
    finalReviewItem("Real assets", assetsReady, assetsReady ? shortPath(state.lastAssetFolder) : "Build or load old assets first.", assetsReady ? "complete" : "warning"),
    finalReviewItem("Reel script", scriptReady, scriptReady ? shortPath(state.lastScriptFolder) : "Generate or load old script.", scriptReady ? "complete" : "warning"),
    finalReviewItem("Vids mode", true, safe ? "Credit Safe local render." : lowCredit ? "Hook-only Vids, local body/CTA." : "Full hook/focus/CTA avatar pack."),
    finalReviewItem("Avatar", hookVideoReady, hookVideoReady ? (lowCredit ? "Hook video available." : "Hook/focus/CTA video available.") : hookPrepared ? (lowCredit ? "Hook prompt ready, video optional." : "Prompt pack ready, video optional.") : (lowCredit ? "Prepare hook prompt or load old hook." : "Prepare avatar pack or load old avatar."), hookVideoReady ? "complete" : hookPrepared ? "warning" : "pending"),
    finalReviewItem("Voice", true, hasVidsVoiceover ? "Saved Google Vids voiceover will be used first." : voiceMode === "free" ? "Free/local voice selected." : `${voiceMode} selected. Review credits/API first.`),
    finalReviewItem("Profiles", profileReady, profileDetail, safe || (readyProfileCount > 0 && !selectedNeedsLogin) ? "complete" : selectedProfilePaths.length ? "warning" : "warning"),
    finalReviewItem("Quick preview", Boolean(previewVideo || finalVideo), previewVideo ? shortPath(previewVideo) : finalVideo ? "Final render available." : "Optional 15 sec local preview before full render.", previewVideo || finalVideo ? "complete" : "pending"),
    finalReviewItem("Final QA", Boolean(finalVideo), finalVideo ? `Final ready${qualityScore ? ` | Quality ${qualityScore}/100` : ""}` : "Render will create final MP4.", finalVideo ? (warnings.length ? "warning" : "complete") : "pending")
  ];
  els.finalReviewChecklist.innerHTML = checks.join("");
  if (els.finalReviewMeta) {
    els.finalReviewMeta.textContent = finalVideo
      ? `Ready to review: ${shortPath(finalVideo)}${qualityScore ? ` | Quality ${qualityScore}/100` : ""}`
      : previewVideo
        ? `Preview ready: ${shortPath(previewVideo)} | Full render pending`
      : `${safe ? "Credit Safe local render" : lowCredit ? "Low-credit hook-only Vids" : "Full Vids pack"} | ${assetsReady ? "assets ready" : "assets pending"} | ${scriptReady ? "script ready" : "script pending"}`;
  }
}

function renderDocToc(headings = []) {
  if (!els.docToc) return;
  const visible = headings.filter((heading) => heading.level <= 3).slice(0, 70);
  if (!visible.length) {
    els.docToc.innerHTML = '<span class="empty-note">No sections found.</span>';
    return;
  }
  els.docToc.innerHTML = visible.map((heading) => (
    `<a class="toc-link level-${heading.level}" href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a>`
  )).join("");
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

function finalVideoUrl(filePath) {
  return filePath ? `/file?path=${encodeURIComponent(filePath)}` : "";
}

function isDefaultAvatarPhoto(filePath) {
  const normalized = String(filePath || "").replaceAll("\\", "/");
  return Object.values(currentDefaultAvatarPhotos()).some((avatarPath) => normalized.endsWith(avatarPath));
}

function avatarPhotoLabel(filePath, explicitLabel = "") {
  if (explicitLabel) return explicitLabel;
  const normalized = String(filePath || "").replaceAll("\\", "/");
  const defaults = currentDefaultAvatarPhotos();
  if (normalized.endsWith(defaults.female)) return "Default AltFTool female avatar";
  if (normalized.endsWith(defaults.male)) return "Default AltFTool male avatar";
  const base = normalized.split("/").filter(Boolean).pop() || "";
  return base ? `Custom avatar: ${base}` : "No avatar photo";
}

function setAvatarHostImage(filePath = "", label = "", options = {}) {
  const { persist = true } = options;
  const avatarPath = String(filePath || "").trim();
  state.avatarHostImage = avatarPath;
  state.avatarHostLabel = avatarPhotoLabel(avatarPath, label);
  if (els.hookAvatarPhotoPreview) {
    if (avatarPath) {
      els.hookAvatarPhotoPreview.src = finalVideoUrl(avatarPath);
      els.hookAvatarPhotoPreview.classList.remove("is-empty");
    } else {
      els.hookAvatarPhotoPreview.removeAttribute("src");
      els.hookAvatarPhotoPreview.classList.add("is-empty");
    }
  }
  if (els.hookAvatarPhotoTitle) {
    els.hookAvatarPhotoTitle.textContent = state.avatarHostLabel;
  }
  if (els.hookAvatarPhotoStatus) {
    els.hookAvatarPhotoStatus.textContent = avatarPath
      ? "Ye photo avatar reference aur local reel presenter me use hogi."
      : "Female/male default ya apni consented photo use karo.";
  }
  if (persist) {
    saveHookSettings().catch((error) => appendTerminal(error.message, "stderr"));
  }
}

function avatarPhotoForPresenter(presenter = "") {
  const defaults = currentDefaultAvatarPhotos();
  return presenter === "male" ? defaults.male : defaults.female;
}

function syncDefaultAvatarPhotoWithPresenter(options = {}) {
  if (state.avatarHostImage && !isDefaultAvatarPhoto(state.avatarHostImage)) {
    return;
  }
  const presenter = els.hookPresenterSelect?.value || "female";
  const avatarPath = avatarPhotoForPresenter(presenter);
  setAvatarHostImage(avatarPath, avatarPhotoLabel(avatarPath), options);
}

async function uploadAvatarPhoto(file) {
  if (!file) return;
  const looksLikeImage = /^image\/(png|jpe?g|webp)$/i.test(file.type || "") || /\.(png|jpe?g|webp)$/i.test(file.name || "");
  if (!looksLikeImage) {
    throw new Error("Avatar photo PNG, JPG, JPEG, ya WebP honi chahiye.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Avatar photo 12 MB se choti honi chahiye.");
  }
  appendTerminal(`POST /api/avatar-upload ${file.name}`);
  setTask("Uploading avatar photo", file.name, "busy");
  const response = await fetch("/api/avatar-upload", {
    method: "POST",
    headers: { "x-file-name": encodeURIComponent(file.name || "avatar.png") },
    body: file
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Avatar upload failed: ${response.status}`);
  }
  const savedPath = data.upload?.path || data.upload?.avatar?.path || "";
  setAvatarHostImage(savedPath, `Custom avatar: ${file.name}`, { persist: false });
  setTask("Avatar photo ready", "Custom photo saved and selected.", "success");
  setTerminalStatus("Custom avatar photo selected");
}

function selectedScriptVideoProfiles() {
  return selectedGenerationProfiles("script-video");
}

function scriptVideoPayload(extra = {}) {
  const script = String(els.customScriptInput?.value || "").trim();
  if (!script) {
    throw new Error("Pehle script paste/write karo.");
  }
  const profiles = requireGenerationProfiles("script-video");
  const primaryProfile = profiles[0] || "";
  const fallbackProfile = profiles[1] || "";
  return {
    title: String(els.customScriptTitleInput?.value || "").trim(),
    script,
    language: els.customScriptLanguageSelect?.value || "Hinglish",
    durationSeconds: Number(els.customScriptDurationSelect?.value || 50),
    videoSize: els.customScriptVideoSizeSelect?.value || "portrait",
    presenter: els.customScriptPresenterSelect?.value || "female",
    avatar: els.customScriptAvatarSelect?.value || "auto_by_reel",
    avatarLabel: hookCharacterLabel(els.customScriptAvatarSelect?.value || "auto_by_reel"),
    profile: primaryProfile,
    primaryProfile,
    fallbackProfile,
    fallbackEnabled: Boolean(fallbackProfile),
    profiles,
    creditSafeMode: creditSafeEnabled(),
    ...extra
  };
}

function renderScriptVideoPipeline(steps = []) {
  if (!els.scriptVideoPipeline) return;
  if (!steps.length) {
    els.scriptVideoPipeline.innerHTML = '<span data-status="idle">Waiting for script.</span>';
    return;
  }
  els.scriptVideoPipeline.innerHTML = steps.map((step) => `
    <span data-status="${escapeHtml(step.status || "idle")}">
      <strong>${escapeHtml(step.label || step.id || "Step")}</strong>
      ${step.detail ? `<small>${escapeHtml(step.detail)}</small>` : ""}
    </span>
  `).join("");
}

function renderScriptVideoResult(scriptVideo = {}) {
  const scenes = scriptVideo.plan?.scenes || [];
  const videoPath = scriptVideo.videoPath || scriptVideo.outputPath || "";
  state.currentScriptVideo = scriptVideo;
  state.lastScriptVideoFolder = scriptVideo.videoDir || scriptVideo.folder || "";
  state.lastScriptVideoVideo = videoPath;
  if (els.scriptVideoResult) {
    els.scriptVideoResult.classList.remove("is-hidden");
  }
  if (els.scriptVideoResultTitle) {
    els.scriptVideoResultTitle.textContent = scriptVideo.title || "Script video ready";
  }
  if (els.scriptVideoResultStatus) {
    els.scriptVideoResultStatus.textContent = [
      scriptVideo.status || "prepared",
      scriptVideo.activeProfile || "",
      scriptVideo.videoSizeLabel || scriptVideo.videoSize || "",
      `${scriptVideo.totalDurationSeconds || scenes.length * 10 || 0}s`
    ].filter(Boolean).join(" | ");
  }
  if (els.scriptVideoFolderPath) {
    els.scriptVideoFolderPath.textContent = state.lastScriptVideoFolder || "";
  }
  if (els.scriptVideoSummary) {
    els.scriptVideoSummary.textContent = scriptVideo.summary || "Script optimized into hook, body, CTA, scene timing, captions, and Google Vids prompts.";
  }
  const seo = scriptVideo.seo || {};
  const parts = [
    ["Script Type", scriptVideo.language || "Hinglish"],
    ["Hook", scriptVideo.hook || scenes[0]?.voiceover || ""],
    ["Body", scriptVideo.body || scenes.slice(1, -1).map((scene) => scene.voiceover).join(" ")],
    ["CTA", scriptVideo.cta || scenes.at(-1)?.voiceover || ""],
    ["Caption", seo.instagram_caption || ""],
    ["Hashtags", (seo.hashtags || []).join(" ")]
  ].filter(([, value]) => value);
  if (els.scriptVideoParts) {
    els.scriptVideoParts.innerHTML = parts.map(([label, value]) => `
      <article class="script-part-card">
        <span>${escapeHtml(label)}</span>
        <p>${escapeHtml(value)}</p>
      </article>
    `).join("");
  }
  if (els.scriptVideoSceneList) {
    els.scriptVideoSceneList.innerHTML = scenes.map((scene) => `
      <article class="script-scene-item">
        <strong>Scene ${escapeHtml(scene.scene_number)} - ${escapeHtml(scene.duration)} sec</strong>
        <span>${escapeHtml(scene.onscreen_text)}</span>
        <p>${escapeHtml(scene.voiceover)}</p>
      </article>
    `).join("") || '<span class="muted">No scenes yet.</span>';
  }
  if (videoPath && els.scriptVideoPreview) {
    els.scriptVideoPreview.src = finalVideoUrl(videoPath);
    els.scriptVideoPreview.classList.remove("is-hidden");
  } else if (els.scriptVideoPreview) {
    els.scriptVideoPreview.classList.add("is-hidden");
    els.scriptVideoPreview.removeAttribute("src");
  }
  if (els.scriptVideoFileList) {
    const files = (scriptVideo.files || []).slice(0, 18);
    els.scriptVideoFileList.innerHTML = files.map((file) => (
      `<a href="${escapeHtml(file.url)}" target="_blank" rel="noreferrer">${escapeHtml(file.kind)}: ${escapeHtml(file.name)}</a>`
    )).join("") || '<span class="muted">Prepared files will appear here.</span>';
  }
  setScriptVideoState(videoPath ? "Video ready" : "Prepared", "success");
  setTask(videoPath ? "Script video ready" : "Script optimized", videoPath || state.lastScriptVideoFolder || "", "success");
  setTerminalStatus(videoPath ? "Custom script MP4 ready" : "Custom script prepared");
  appendTerminal(`Script video ${scriptVideo.status || "prepared"}: ${videoPath || state.lastScriptVideoFolder}`, "stdout");
  activeStep("script-video");
  setScriptVideoBusy(false);
}

async function optimizeCustomScriptVideo() {
  const payload = scriptVideoPayload({ prepareOnly: true });
  setScriptVideoState("Optimizing", "busy");
  setTask("Optimizing script video", `${payload.durationSeconds}s | ${payload.language} | ${payload.videoSize}`, "busy");
  setTerminalStatus("Optimizing custom script");
  appendTerminal(`POST /api/script-video/optimize duration=${payload.durationSeconds} language=${payload.language} size=${payload.videoSize}`);
  renderScriptVideoPipeline([{ id: "script", label: "Optimize Script", status: "running", detail: "Splitting into 10-second scenes." }]);
  activeStep("script-video");
  setScriptVideoBusy(true);
  const data = await readJsonApi("/api/script-video/optimize", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  renderScriptVideoPipeline([{ id: "script", label: "Optimize Script", status: "complete", detail: "Prompt pack ready." }]);
  renderScriptVideoResult(data.scriptVideo || {});
  return data.scriptVideo;
}

function connectScriptVideoRun(runId) {
  if (state.scriptVideoEventSource) {
    state.scriptVideoEventSource.close();
  }
  if (!runId) {
    return Promise.reject(new Error("Script video run id missing."));
  }
  const source = new EventSource(`/api/script-video/runs/${encodeURIComponent(runId)}/events`);
  state.scriptVideoEventSource = source;
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      source.close();
      state.scriptVideoEventSource = null;
      const message = `Script video run timed out: ${runId}`;
      appendTerminal(message, "stderr");
      reject(new Error(message));
    }, STEP_FLOW_RUN_TIMEOUT_MS);
    const settle = (handler, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      source.close();
      state.scriptVideoEventSource = null;
      handler(value);
    };
    source.addEventListener("log", (event) => {
      const entry = JSON.parse(event.data);
      appendTerminal(entry.text, entry.stream);
      setTerminalStatus(entry.text);
    });
    source.addEventListener("progress", (event) => {
      const progress = JSON.parse(event.data);
      renderScriptVideoPipeline(progress.steps || []);
      const active = progress.active || {};
      if (active.label) {
        const tone = active.status === "failed" ? "error" : active.status === "complete" ? "success" : "busy";
        setScriptVideoState(active.label, tone);
        setTask(active.label, active.detail || "Script video workflow", tone);
      }
    });
    source.addEventListener("status", (event) => {
      const run = JSON.parse(event.data);
      if (run.status === "running") {
        renderScriptVideoPipeline(run.steps || []);
        setTask("Generating script video", `Run ${run.id}`, "busy");
        setTerminalStatus(`Running: ${run.id}`);
        return;
      }
      renderScriptVideoPipeline(run.steps || []);
      if (run.status === "complete") {
        renderScriptVideoResult(run.result || {});
        appendTerminal(`Script video run complete: ${run.id}`, "stdout");
        settle(resolve, run.result || {});
        return;
      }
      const message = run.error || "Script video generation failed.";
      setScriptVideoState("Failed", "error");
      setTask("Script video failed", message, "error");
      setTerminalStatus("Script video failed");
      appendTerminal(message, "stderr");
      if (run.result) {
        renderScriptVideoResult(run.result);
        setScriptVideoState("Failed", "error");
      }
      setScriptVideoBusy(false);
      settle(reject, new Error(message));
    });
    source.onerror = () => {
      appendTerminal(`Script video event stream interrupted for ${runId}.`, "stderr");
    };
  });
}

async function generateCustomScriptVideo() {
  const payload = scriptVideoPayload({ prepareOnly: false });
  if (!confirmCreditSpend(
    "Generate General Script Video",
    `This can generate/export ${Math.round(Number(payload.durationSeconds || 50) / 10)} Google Vids avatar scene(s). Failed generations can still use credits.`
  )) {
    return { canceled: true };
  }
  setScriptVideoState("Generating", "busy");
  setTask("Generating script video", `${payload.durationSeconds}s | ${payload.videoSize} | ${payload.profiles.join(" -> ")}`, "busy");
  setTerminalStatus("Starting custom script Google Vids run");
  appendTerminal(`POST /api/script-video/runs duration=${payload.durationSeconds} size=${payload.videoSize} profiles=${payload.profiles.join(", ")}`);
  renderScriptVideoPipeline([{ id: "start", label: "Script Video", status: "running", detail: "Starting Google Vids generation." }]);
  activeStep("script-video");
  setScriptVideoBusy(true);
  const data = await readJsonApi("/api/script-video/runs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  state.lastScriptVideoRunId = data.run?.id || "";
  return connectScriptVideoRun(state.lastScriptVideoRunId);
}

async function openLatestScriptVideoFolder() {
  if (!state.lastScriptVideoFolder) return;
  appendTerminal(`POST /api/open ${state.lastScriptVideoFolder}`);
  const data = await readJsonApi("/api/open", {
    method: "POST",
    body: JSON.stringify({ path: state.lastScriptVideoFolder })
  });
  setTask("Script video folder opened", data.path || state.lastScriptVideoFolder, "success");
  setTerminalStatus("Script video folder opened");
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

function scrollToWorkflowStep(step) {
  const targetId = {
    load: "loadExcel",
    select: "selectTool",
    asset: "buildAssets",
    script: "generateScript",
    hook: "hookAvatar",
    final: "finalReel",
    "script-video": "scriptVideo",
    profile: "profileManager"
  }[step];
  activeStep(step);
  if (targetId) {
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function artifactVersionKey(item = {}, fallback = "") {
  return [item.kind || "", item.path || item.sourcePath || item.videoPath || item.folder || fallback].filter(Boolean).join(":");
}

function artifactVersionDate(item = {}) {
  return item.generatedAt || item.modifiedAt || item.startedAt || "";
}

function artifactVersionLabel(kind, item = {}, index = 0, total = 0) {
  const version = `V${String(Math.max(1, total - index)).padStart(2, "0")}`;
  const date = artifactVersionDate(item);
  const time = date ? shortDateTime(date) : "saved";
  if (kind === "assets") {
    return `Assets ${version} - ${item.fileCount || item.assetBuild?.files?.length || 0} files - ${time}`;
  }
  if (kind === "script") {
    const duration = item.duration || item.scriptBuild?.totalDurationSeconds || 0;
    return `Script ${version} - ${duration || "?"} sec - ${time}`;
  }
  if (kind === "hook") {
    const hasVideo = item.hasVideo || hookArtifactHasVideo(item.hookAvatar || item);
    return `Avatar ${version} - ${hasVideo ? "video ready" : "prompt only"} - ${time}`;
  }
  if (kind === "voiceover") {
    const count = item.fileCount || item.voiceover?.files?.length || 0;
    return `Vids Voice ${version} - ${count || "saved"} file(s) - ${time}`;
  }
  if (kind === "final") {
    const quality = item.qualityScore ? ` - Q ${item.qualityScore}/100` : "";
    return `Final Reel ${version}${quality} - ${time}`;
  }
  return `Saved ${version} - ${time}`;
}

function uniqueArtifactVersions(items = []) {
  const seen = new Set();
  return items.filter((item, index) => {
    const key = artifactVersionKey(item, `artifact-${index}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return Boolean(item.path || item.sourcePath || item.videoPath || item.folder);
  });
}

function buildResumeArtifacts(artifacts = {}) {
  const groups = [
    ["assets", uniqueArtifactVersions([artifacts.latestAssets, ...(artifacts.assets || [])].filter(Boolean))],
    ["script", uniqueArtifactVersions([artifacts.latestScript, ...(artifacts.scripts || [])].filter(Boolean))],
    ["hook", uniqueArtifactVersions([artifacts.latestHookAvatar, ...(artifacts.hookAvatars || [])].filter(Boolean))],
    ["voiceover", uniqueArtifactVersions([artifacts.latestVidsVoiceover, ...(artifacts.vidsVoiceovers || [])].filter(Boolean))],
    ["final", uniqueArtifactVersions([artifacts.latestFinalVideo, ...(artifacts.finalVideos || [])].filter(Boolean))]
  ];
  return groups.flatMap(([kind, items]) => items.map((item, index) => ({
    ...item,
    kind,
    resumeLabel: artifactVersionLabel(kind, item, index, items.length)
  })));
}

function renderResumeVersionPicker(artifacts = {}) {
  if (!els.resumeVersionsPanel || !els.resumeArtifactSelect) return;
  const items = buildResumeArtifacts(artifacts);
  state.resumeArtifacts = items;
  const hasItems = Boolean(items.length);
  els.resumeVersionsPanel.classList.toggle("is-hidden", !hasItems);
  if (els.loadResumeArtifactBtn) {
    els.loadResumeArtifactBtn.disabled = !hasItems;
  }
  if (els.openResumeArtifactBtn) {
    els.openResumeArtifactBtn.disabled = !hasItems;
  }
  els.resumeArtifactSelect.innerHTML = items.map((item, index) => (
    `<option value="${escapeHtml(index)}">${escapeHtml(item.resumeLabel)}</option>`
  )).join("");
}

function selectedResumeArtifact() {
  const index = Number(els.resumeArtifactSelect?.value || 0);
  return state.resumeArtifacts[index] || null;
}

function applyExistingAssetsFromArtifacts(asset = state.latestArtifacts?.latestAssets) {
  if (!asset?.assetBuild) return false;
  if (!artifactMatchesWorkflowRow(asset)) {
    appendTerminal(`Skipped assets from another row: ${artifactRowValue(asset)}`, "stderr");
    return false;
  }
  appendTerminal(`Using existing assets: ${asset.folder}`, "stdout");
  renderAssetBuild(asset.assetBuild);
  setAssetState("Old assets ready", "success");
  return true;
}

function applyExistingScriptFromArtifacts(script = state.latestArtifacts?.latestScript) {
  if (!script?.scriptBuild) return false;
  if (!artifactMatchesWorkflowRow(script)) {
    appendTerminal(`Skipped script from another row: ${artifactRowValue(script)}`, "stderr");
    return false;
  }
  appendTerminal(`Using existing script: ${script.folder}`, "stdout");
  renderScriptResult(script.scriptBuild);
  setScriptState("Old script ready", "success");
  return true;
}

function applyExistingHookFromArtifacts(hook = state.latestArtifacts?.latestHookAvatar) {
  if (!hook?.hookAvatar) return false;
  if (!artifactMatchesWorkflowRow(hook)) {
    appendTerminal(`Skipped avatar pack from another row: ${artifactRowValue(hook)}`, "stderr");
    return false;
  }
  appendTerminal(`Using existing avatar pack: ${hook.folder}`, "stdout");
  renderHookAvatarResult(hook.hookAvatar);
  setHookState(hookArtifactHasVideo(hook) ? "Old avatar video ready" : "Old avatar prompt ready", "success");
  return true;
}

function applyExistingVoiceoverFromArtifacts(voiceover = state.latestArtifacts?.latestVidsVoiceover) {
  if (!voiceover?.voiceoverDir && !voiceover?.exportedPath) return false;
  if (!artifactMatchesWorkflowRow(voiceover)) {
    appendTerminal(`Skipped Vids voiceover from another row: ${artifactRowValue(voiceover)}`, "stderr");
    return false;
  }
  state.lastVidsVoiceoverFolder = voiceover.voiceoverDir || state.lastVidsVoiceoverFolder || "";
  state.lastVidsVoiceoverExport = voiceover.exportedPath || voiceover.voiceover?.vidsVoiceover?.exportedPath || state.lastVidsVoiceoverExport || "";
  state.lastVidsVoiceoverRow = Number(voiceover.row || els.assetRowInput.value || 0);
  appendTerminal(`Using existing Vids voiceover: ${state.lastVidsVoiceoverFolder || state.lastVidsVoiceoverExport}`, "stdout");
  setFinalState("Vids voice ready", "success");
  renderFinalReview();
  return true;
}

function applyExistingFinalFromArtifacts(finalArtifact = state.latestArtifacts?.latestFinalVideo) {
  const finalReel = finalArtifact?.finalReel || finalArtifact;
  if (!finalReel?.videoPath && !finalReel?.outputPath && !finalReel?.finalDir && !finalReel?.folder) return false;
  if (!artifactMatchesWorkflowRow(finalArtifact)) {
    appendTerminal(`Skipped final reel from another row: ${artifactRowValue(finalArtifact)}`, "stderr");
    return false;
  }
  appendTerminal(`Using existing final reel: ${finalReel.videoPath || finalReel.outputPath || finalReel.finalDir || finalReel.folder}`, "stdout");
  renderFinalReelResult(finalReel);
  setFinalState(finalReel.videoPath || finalReel.outputPath ? "Old final video ready" : "Old final package ready", "success");
  return true;
}

function applyLoadedResumeArtifact(artifact = {}) {
  if (artifact.kind === "assets") {
    return applyExistingAssetsFromArtifacts(artifact);
  }
  if (artifact.kind === "script") {
    return applyExistingScriptFromArtifacts(artifact);
  }
  if (artifact.kind === "hook" || artifact.kind === "hook_avatar") {
    return applyExistingHookFromArtifacts(artifact);
  }
  if (artifact.kind === "voiceover" || artifact.kind === "vids_voiceover") {
    return applyExistingVoiceoverFromArtifacts(artifact);
  }
  if (artifact.kind === "final") {
    return applyExistingFinalFromArtifacts(artifact);
  }
  return false;
}

async function loadSelectedResumeArtifact() {
  const selected = selectedResumeArtifact();
  const artifactPath = selected?.path || selected?.sourcePath || "";
  if (!selected || !artifactPath) {
    throw new Error("Saved version select karo.");
  }
  setTask("Loading saved version", selected.resumeLabel || artifactPath, "busy");
  setTerminalStatus("Loading saved artifact");
  appendTerminal(`GET /api/tool-artifact/load kind=${selected.kind} path=${artifactPath}`);
  const params = new URLSearchParams({
    kind: selected.kind || "",
    path: artifactPath
  });
  const response = await fetch(`/api/tool-artifact/load?${params.toString()}`);
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Saved version load failed: ${response.status}`);
  }
  if (!applyLoadedResumeArtifact(data.artifact || {})) {
    throw new Error("Selected saved version load nahi ho paaya.");
  }
  setTask("Saved version loaded", selected.resumeLabel || artifactPath, "success");
  setTerminalStatus("Saved version loaded");
  refreshStepFlowControls();
  return data.artifact;
}

async function openSelectedResumeArtifact() {
  const selected = selectedResumeArtifact();
  const target = selected?.folder || selected?.folderPath || selected?.runDir || (selected?.videoPath ? selected.videoPath.replace(/[\\/][^\\/]+$/, "") : "");
  if (!selected || !target) {
    throw new Error("Open karne ke liye saved version select karo.");
  }
  appendTerminal(`POST /api/open ${target}`);
  const response = await fetch("/api/open", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path: target })
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Open folder failed: ${response.status}`);
  }
  setTask("Saved folder opened", data.path || target, "success");
  setTerminalStatus("Saved version folder opened");
}

function hydrateResumeStateFromArtifacts(options = {}) {
  const { includeHook = true } = options;
  const usedAssets = state.lastAssetFolder ? true : applyExistingAssetsFromArtifacts();
  const usedScript = state.lastScriptFolder ? true : applyExistingScriptFromArtifacts();
  const usedHook = includeHook
    ? (state.lastHookAvatarFolder ? true : applyExistingHookFromArtifacts())
    : Boolean(state.lastHookAvatarFolder);
  const usedHookVideo = Boolean(state.lastHookAvatarVideo || hookArtifactHasVideo(state.latestArtifacts?.latestHookAvatar || {}));
  return { usedAssets, usedScript, usedHook, usedHookVideo };
}

function renderArtifactNotice(artifacts) {
  state.latestArtifacts = artifacts || null;
  renderResumeVersionPicker(artifacts || {});
  const asset = artifacts?.latestAssets || null;
  const script = artifacts?.latestScript || null;
  const hook = artifacts?.latestHookAvatar || null;
  const voiceover = artifacts?.latestVidsVoiceover || null;
  const finalVideo = artifacts?.latestFinalVideo || null;
  const hasAsset = Boolean(asset?.assetBuild);
  const hasScript = Boolean(script?.scriptBuild);
  const hasHook = Boolean(hook?.hookAvatar);
  const hasHookVideo = hookArtifactHasVideo(hook || {});
  const hasVidsVoiceover = Boolean(voiceover?.voiceoverDir || voiceover?.exportedPath);
  const hasFinalVideo = Boolean(finalVideo?.videoPath);
  els.useExistingAssetsBtn.disabled = !hasAsset;
  els.generateNewAssetsBtn.disabled = !state.inputPath || !Number(els.assetRowInput.value || 0);
  els.useExistingScriptBtn.disabled = !hasScript;
  if (els.useExistingHookBtn) {
    els.useExistingHookBtn.disabled = !hasHook;
  }
  if (els.jumpToAvatarStepBtn) {
    els.jumpToAvatarStepBtn.disabled = !(hasScript || state.lastScriptFolder);
  }
  if (els.jumpToFinalStepBtn) {
    els.jumpToFinalStepBtn.disabled = !(hasScript || state.lastScriptFolder || hasHook || state.lastHookAvatarFolder);
  }
  if (hasAsset && !state.lastAssetFolder) {
    els.assetStepMeta.textContent = "Old assets found";
  }
  if (hasScript && !state.lastScriptFolder) {
    els.scriptStepMeta.textContent = "Old script found";
  }
  if (hasHook && !state.lastHookAvatarFolder) {
    els.hookStepMeta.textContent = hasHookVideo ? "Old avatar video found" : "Old avatar prompt found";
    renderHookAvatarResult(hook.hookAvatar);
  }
  if (hasVidsVoiceover && !state.lastVidsVoiceoverFolder && !state.lastVidsVoiceoverExport) {
    applyExistingVoiceoverFromArtifacts(voiceover);
  }
  if (hasAsset && hasScript && !state.lastFinalReelFolder) {
    setFinalState(hasHookVideo ? "Ready after avatar" : "Ready, avatar optional", "idle");
    setFinalBusy(false);
  }
  renderFinalReview();

  if (!hasAsset && !hasScript && !hasHook && !hasVidsVoiceover && !hasFinalVideo) {
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
    parts.push(`Avatar: ${hasHookVideo ? "video ready" : "prompt pack only"}${hook.generatedAt ? `, ${shortDateTime(hook.generatedAt)}` : ""}`);
  }
  if (hasVidsVoiceover) {
    parts.push(`Vids voice: ${voiceover.fileCount || "saved"} file(s)${voiceover.generatedAt ? `, ${shortDateTime(voiceover.generatedAt)}` : ""}`);
  }
  if (hasFinalVideo) {
    parts.push(`Final: video ready${finalVideo.generatedAt ? `, ${shortDateTime(finalVideo.generatedAt)}` : ""}`);
  }
  if (hasAsset && hasScript && (!hasHook || !hasHookVideo)) {
    parts.push("Avatar video missing: click Avatar Step, generate/download avatar, then Final Step");
  } else if (hasAsset && !hasScript) {
    parts.push("Script missing: click Use Old Assets, then Generate Script");
  } else if (hasScript && !hasAsset) {
    parts.push("Assets missing: build assets, or continue if script already has usable captures");
  }
  setArtifactNotice(
    hasAsset && hasScript && (!hasHook || !hasHookVideo) ? "Resume available: avatar video missing" : "Existing work found",
    `${parts.join(" | ")}. Old use karo, missing step se continue karo, ya new generate karo.`,
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
  setWorkspaceTab(workspaceTabFromStep(step), { persist: false });
  for (const link of [els.loadStepLink, els.selectStepLink, els.assetStepLink, els.scriptStepLink, els.hookStepLink, els.finalStepLink, els.scriptVideoStepLink, els.profileStepLink].filter(Boolean)) {
    link.classList.remove("active");
    link.removeAttribute("aria-current");
  }
  const order = ["load", "select", "asset", "script", "hook", "final", "script-video", "profile"];
  const mainOrder = ["load", "select", "asset", "script", "hook", "final"];
  const activeIndex = Math.max(0, order.indexOf(step));
  const mainActiveIndex = mainOrder.indexOf(step);
  for (const item of els.flowSteps) {
    const itemIndex = order.indexOf(item.dataset.flowStep || "");
    item.classList.toggle("active", itemIndex === activeIndex);
    item.classList.toggle("done", itemIndex > -1 && itemIndex < activeIndex);
  }
  for (const section of els.mainStepSections) {
    const sectionStep = section.dataset.mainStepSection || "";
    const sectionMainIndex = mainOrder.indexOf(sectionStep);
    section.classList.toggle("is-current-step", sectionStep === step);
    section.classList.toggle("is-step-complete", mainActiveIndex > -1 && sectionMainIndex > -1 && sectionMainIndex < mainActiveIndex);
  }
  let activeLink = els.loadStepLink;
  if (step === "select") {
    activeLink = els.selectStepLink;
  } else if (step === "asset") {
    activeLink = els.assetStepLink;
  } else if (step === "script") {
    activeLink = els.scriptStepLink;
  } else if (step === "hook") {
    activeLink = els.hookStepLink;
  } else if (step === "final") {
    activeLink = els.finalStepLink;
  } else if (step === "script-video") {
    activeLink = els.scriptVideoStepLink;
  } else if (step === "profile") {
    activeLink = els.profileStepLink;
  }
  activeLink?.classList.add("active");
  activeLink?.setAttribute("aria-current", "step");
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
  state.toolVideoStatusByRow = new Map();
  state.toolRowRenderLimit = TOOL_ROW_RENDER_BATCH;
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
  refreshAutoQueueControls();
  updateAutoQueueHint();
  els.selectStepMeta.textContent = `${availableTools.length || analysis.detectedToolRows || 0} tools loaded`;
  els.selectStepLink.classList.add("done");
  activeStep("select");
  loadToolVideoStatus().catch((error) => appendTerminal(error.message, "stderr"));
}

function renderIdeaList(data) {
  const tools = data.tools || data.toolOptions || [];
  const analysis = data.analysis || {};
  state.inputPath = data.input || analysis.input || state.inputPath;
  state.tools = tools;
  state.filteredTools = tools;
  state.toolVideoStatusByRow = new Map();
  state.toolRowRenderLimit = TOOL_ROW_RENDER_BATCH;

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
  const stats = toolListStats(tools);
  els.toolOptionCount.textContent = `${stats.ready} ready / ${tools.length} total`;
  renderToolOptions(filterTools(els.toolSearchInput.value));
  setAssetBusy(false);
  setScriptBusy(false);
  setHookBusy(false);
  updateSelectedTool();
  refreshAutoQueueControls();
  updateAutoQueueHint();
  els.selectStepMeta.textContent = `${stats.ready} ready / ${tools.length} loaded`;
  els.selectStepLink.classList.add("done");
  appendTerminal(`Loaded ${tools.length} idea names (${stats.ready} ready) from ${data.fileName || analysis.fileName || "workbook"}.`, "stdout");
  setTask("Idea names loaded", `${stats.ready} ready tools, ${tools.length} total rows`, "success");
  setTerminalStatus(`${stats.ready} ready / ${tools.length} loaded`);
  activeStep("select");
  loadToolVideoStatus().catch((error) => appendTerminal(error.message, "stderr"));
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
  state.dashboardDefaults = defaults;
  const settings = defaults.settings || {};
  state.lastFinalReelFolder = settings.lastFinalReelFolder || state.lastFinalReelFolder || "";
  state.lastFinalReelVideo = settings.lastFinalReelVideo || state.lastFinalReelVideo || "";
  state.lastFinalReelRow = Number(settings.row || state.lastFinalReelRow || 0);
  state.lastVidsVoiceoverFolder = settings.lastVidsVoiceoverFolder || state.lastVidsVoiceoverFolder || "";
  state.lastVidsVoiceoverExport = settings.lastVidsVoiceoverExport || state.lastVidsVoiceoverExport || "";
  state.lastVidsVoiceoverRow = Number(settings.row || state.lastVidsVoiceoverRow || 0);
  state.profileRegistry = defaults.profileRegistry || defaults.quota?.registry || state.profileRegistry || null;
  state.defaultAvatarPhotos = defaults.avatarGeneration?.defaultAvatarPhotos || {
    female: defaults.avatarGeneration?.defaultFemaleImage || DEFAULT_AVATAR_PHOTOS.female,
    male: defaults.avatarGeneration?.defaultMaleImage || DEFAULT_AVATAR_PHOTOS.male
  };
  renderHookCharacterOptions(
    defaults.googleVids?.avatarOptions || [{ label: "Google Vids auto", value: "auto" }],
    settings.hookAvatarCharacter || "auto_by_reel"
  );
  if (els.hookPresenterSelect && settings.hookAvatarStyle) {
    els.hookPresenterSelect.value = settings.hookAvatarStyle;
  }
  if (els.hookVideoSizeSelect) {
    els.hookVideoSizeSelect.value = settings.hookVideoSize || "portrait";
  }
  if (els.lowCreditVidsMode) {
    els.lowCreditVidsMode.checked = settings.lowCreditVidsMode !== false;
  }
  if (els.customScriptVideoSizeSelect) {
    els.customScriptVideoSizeSelect.value = settings.scriptVideoSize || settings.hookVideoSize || "portrait";
  }
  const defaultAvatarPath = avatarPhotoForPresenter(els.hookPresenterSelect?.value || settings.hookAvatarStyle || "female");
  setAvatarHostImage(
    settings.avatarHostImage || defaultAvatarPath,
    settings.avatarHostImage ? "" : avatarPhotoLabel(defaultAvatarPath),
    { persist: false }
  );
  if (state.hookProfiles.length) {
    renderHookProfileOptions();
    renderHookProfileStatus();
    renderProfileManager();
  }
  if (!workspaceTabForHash() && !readSavedWorkspaceTab() && settings.workspaceTab) {
    setWorkspaceTab(settings.workspaceTab, { persist: false });
  }
  setHookBusy(false);
  refreshAutoQueueControls();
  refreshStepFlowControls();
  renderFinalReview();
  return defaults;
}

async function saveHookSettings() {
  if (!els.hookPresenterSelect || !els.hookCharacterSelect) return;
  const selection = currentGlobalProfiles("hook");
  const response = await fetch("/api/settings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      hookAvatarStyle: els.hookPresenterSelect.value || "female",
      hookAvatarCharacter: els.hookCharacterSelect.value || "auto_by_reel",
      hookVideoSize: els.hookVideoSizeSelect?.value || "portrait",
      lowCreditVidsMode: lowCreditVidsEnabled(),
      avatarHostImage: state.avatarHostImage || "",
      hookPrimaryProfile: selection.primary,
      hookFallbackProfile: selection.fallback,
      hookFallbackEnabled: selection.fallbackEnabled,
      scriptVideoPrimaryProfile: selection.primary,
      scriptVideoFallbackProfile: selection.fallback,
      scriptVideoFallbackEnabled: selection.fallbackEnabled,
      scriptVideoSize: els.customScriptVideoSizeSelect?.value || els.hookVideoSizeSelect?.value || "portrait",
      globalPrimaryProfile: selection.primary,
      globalFallbackProfile: selection.fallback,
      globalFallbackEnabled: selection.fallbackEnabled
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
    els.openTrackerExcelBtn.textContent = "Open Tracker Excel";
  }
}

function renderToolOptions(tools = []) {
  state.filteredTools = tools;
  renderToolFilterSummary();
  if (els.toolOptionCount) {
    const stats = toolListStats();
    els.toolOptionCount.textContent = `${tools.length} shown / ${stats.ready} ready`;
  }
  if (!tools.length) {
    els.toolSelect.innerHTML = '<option value="">No matching tool rows</option>';
    renderToolRowChecklist([]);
    updateToolDropdownSummary();
    return;
  }
  const selectedRow = String(els.assetRowInput.value || "");
  const hiddenSelectTools = tools.slice(0, 200);
  const selectedTool = selectedRow
    ? state.tools.find((tool) => String(toolRowNumber(tool)) === selectedRow)
    : null;
  if (selectedTool && !hiddenSelectTools.some((tool) => String(toolRowNumber(tool)) === selectedRow)) {
    hiddenSelectTools.unshift(selectedTool);
  }
  els.toolSelect.innerHTML = [
    '<option value="">Choose tool idea name</option>',
    ...hiddenSelectTools.map((tool) => {
      const label = `Row ${tool.row || tool.source_row_number} - ${tool.name || tool.tool_name || "Tool"}`;
      return `<option value="${escapeHtml(tool.row || tool.source_row_number)}">${escapeHtml(label)}</option>`;
    })
  ].join("");
  if (selectedRow && hiddenSelectTools.some((tool) => String(tool.row || tool.source_row_number) === selectedRow)) {
    els.toolSelect.value = selectedRow;
  }
  renderToolRowChecklist(tools);
}

function filterTools(query) {
  const needle = String(query || "").trim().toLowerCase();
  return state.tools.filter((tool) => {
    if (!toolPassesFilters(tool)) return false;
    if (!needle) return true;
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

function toolRowNumber(tool = {}) {
  return Number(tool.row || tool.source_row_number || 0);
}

function toolDisplayName(tool = {}) {
  return tool.name || tool.tool_name || "Tool";
}

function normalizedToolName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toolStatusText(tool = {}) {
  return String(tool.status || tool.readiness || "").trim();
}

function toolIsReady(tool = {}) {
  const status = toolStatusText(tool);
  return /\bbuilt\b/i.test(status)
    && !/\bnot\s+built\b|needs\s+deploy|needs\s+fix|failed/i.test(status)
    && (/ready|api\s*check/i.test(status) || /^built\b/i.test(status));
}

function toolIsP0(tool = {}) {
  return String(tool.priority || "").trim().toUpperCase() === "P0";
}

function toolHasVideo(tool = {}) {
  return Boolean(videoStatusForTool(tool));
}

function currentToolFilters() {
  return {
    readyOnly: els.toolReadyOnlyFilter ? els.toolReadyOnlyFilter.checked : state.toolFilters.readyOnly,
    noVideo: els.toolNoVideoFilter ? els.toolNoVideoFilter.checked : state.toolFilters.noVideo,
    p0: els.toolP0Filter ? els.toolP0Filter.checked : state.toolFilters.p0
  };
}

function toolPassesFilters(tool = {}) {
  const filters = currentToolFilters();
  if (filters.readyOnly && !toolIsReady(tool)) return false;
  if (filters.noVideo && toolHasVideo(tool)) return false;
  if (filters.p0 && !toolIsP0(tool)) return false;
  return true;
}

function toolListStats(tools = state.tools) {
  const total = tools.length;
  const ready = tools.filter(toolIsReady).length;
  const withVideo = tools.filter(toolHasVideo).length;
  const p0 = tools.filter(toolIsP0).length;
  return { total, ready, withVideo, p0 };
}

function renderToolFilterSummary() {
  if (!els.toolFilterSummary) return;
  const stats = toolListStats();
  const visible = (state.filteredTools || []).length;
  if (!stats.total) {
    els.toolFilterSummary.textContent = "Load Excel to filter rows.";
    return;
  }
  const filters = currentToolFilters();
  const active = [
    filters.readyOnly ? "Ready" : "",
    filters.noVideo ? "No video" : "",
    filters.p0 ? "P0" : ""
  ].filter(Boolean).join(" + ") || "All";
  els.toolFilterSummary.textContent = `Showing ${visible}/${stats.total} | Ready ${stats.ready} | Videos ${stats.withVideo} | P0 ${stats.p0} | ${active}`;
}

function videoStatusForTool(tool = {}) {
  const row = toolRowNumber(tool);
  const status = state.toolVideoStatusByRow.get(String(row));
  if (!status) return null;
  const statusName = normalizedToolName(status.toolName);
  const toolName = normalizedToolName(toolDisplayName(tool));
  if (statusName && toolName && statusName !== toolName) {
    return null;
  }
  return status;
}

async function loadToolVideoStatus() {
  if (!state.inputPath || state.toolVideoStatusLoading) return;
  state.toolVideoStatusLoading = true;
  appendTerminal(`GET /api/tool-video-status?input=${state.inputPath}`);
  try {
    const response = await fetch(`/api/tool-video-status?input=${encodeURIComponent(state.inputPath)}`);
    const data = await response.json();
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `Video status failed: ${response.status}`);
    }
    state.toolVideoStatusByRow = new Map(Object.entries(data.byRow || {}));
    state.toolRowRenderLimit = TOOL_ROW_RENDER_BATCH;
    renderToolOptions(filterTools(els.toolSearchInput?.value || ""));
    updateToolDropdownSummary();
    appendTerminal(`Video status loaded: ${data.count || 0} row(s), ${data.totalVideos || data.count || 0} saved video version(s).`, "stdout");
  } catch (error) {
    appendTerminal(`Video status load failed: ${error.message}`, "stderr");
  } finally {
    state.toolVideoStatusLoading = false;
  }
}

function updateToolDropdownSummary() {
  if (!els.toolDropdownLabel || !els.toolDropdownHint) return;
  const selectedRow = Number(els.assetRowInput?.value || 0);
  const tool = state.tools.find((item) => toolRowNumber(item) === selectedRow);
  const videoStatus = tool ? videoStatusForTool(tool) : null;
  if (!state.inputPath) {
    els.toolDropdownLabel.textContent = "Load Excel first";
    els.toolDropdownHint.textContent = "Search and select one tool row";
    return;
  }
  if (selectedRow) {
    const videoLabel = videoStatus ? ` | ${Number(videoStatus.videoCount || 1)} Video${Number(videoStatus.videoCount || 1) === 1 ? "" : "s"}` : "";
    els.toolDropdownLabel.textContent = `Row ${selectedRow} - ${tool ? toolDisplayName(tool) : "Tool"}${videoLabel}`;
  } else {
    els.toolDropdownLabel.textContent = "Choose tool idea name";
  }
  const visibleRows = (state.filteredTools || state.tools || []).filter((item) => toolRowNumber(item) >= 2).length;
  const totalVideos = [...state.toolVideoStatusByRow.values()]
    .reduce((sum, item) => sum + Number(item.videoCount || (item.videoPath ? 1 : 0)), 0);
  els.toolDropdownHint.textContent = visibleRows
    ? `${visibleRows} matching row(s). ${state.toolVideoStatusByRow.size ? `${state.toolVideoStatusByRow.size} row(s), ${totalVideos} video version(s).` : "Video tags loading/empty."}`
    : "Search and select one tool row.";
}

function updateSelectedRowsCount() {
  const rows = (state.filteredTools || state.tools || []).filter((tool) => toolRowNumber(tool) >= 2);
  if (els.selectedRowsCount) {
    els.selectedRowsCount.textContent = `${rows.length} rows`;
    els.selectedRowsCount.dataset.tone = rows.length ? "success" : "idle";
  }
  if (els.loadMoreToolRowsBtn) {
    const availableRows = (state.filteredTools || []).filter((tool) => toolRowNumber(tool) >= 2).length;
    els.loadMoreToolRowsBtn.disabled = state.autoQueueRunning || availableRows <= state.toolRowRenderLimit;
  }
  updateToolDropdownSummary();
}

function renderToolRowChecklist(tools = state.filteredTools) {
  if (!els.toolRowChecklist) return;
  const allVisible = (tools || [])
    .filter((tool) => toolRowNumber(tool) >= 2);
  const visible = allVisible.slice(0, state.toolRowRenderLimit);
  updateSelectedRowsCount();
  if (!visible.length) {
    els.toolRowChecklist.innerHTML = '<span class="muted">No matching rows. Search ko adjust karo.</span>';
    if (els.loadMoreToolRowsBtn) {
      els.loadMoreToolRowsBtn.disabled = true;
    }
    return;
  }
  const total = (tools || []).length;
  const remaining = Math.max(0, allVisible.length - visible.length);
  if (els.loadMoreToolRowsBtn) {
    els.loadMoreToolRowsBtn.disabled = !remaining || state.autoQueueRunning;
    els.loadMoreToolRowsBtn.textContent = remaining ? `Load More (${remaining})` : "All Loaded";
  }
  const note = remaining
    ? `<span class="muted tool-list-note">Showing ${visible.length}; ${remaining} more filtered row(s). Search/filter se narrow karo. ${state.toolVideoStatusByRow.size ? `${state.toolVideoStatusByRow.size} row(s) have videos.` : ""}</span>`
    : `<span class="muted tool-list-note">Showing all ${visible.length} filtered row(s)${total !== visible.length ? ` from ${total} match(es)` : ""}. ${state.toolVideoStatusByRow.size ? `${state.toolVideoStatusByRow.size} row(s) have videos.` : "Video tags will appear here."}</span>`;
  els.toolRowChecklist.innerHTML = `${note}${visible.map((tool) => {
    const row = toolRowNumber(tool);
    const selected = Number(els.assetRowInput?.value || 0) === row;
    const video = videoStatusForTool(tool);
    const videoCount = Number(video?.videoCount || (video?.videoPath ? 1 : 0));
    const meta = [tool.category, tool.status, tool.priority, tool.url || tool.tool_url].filter(Boolean).join(" | ");
    const visibleMeta = [tool.category, tool.status, tool.url || tool.tool_url].filter(Boolean).join(" | ");
    const badges = [
      video ? `<span class="tool-row-badge video-ready-badge">${escapeHtml(videoCount)} Video${videoCount === 1 ? "" : "s"}</span>` : "",
      video?.qualityScore ? `<span class="tool-row-badge">Q ${escapeHtml(video.qualityScore)}/100</span>` : "",
      tool.status ? `<span class="tool-row-badge">${escapeHtml(tool.status)}</span>` : ""
    ].filter(Boolean).join("");
    const videoActions = video
      ? `<div class="tool-video-actions">
          <a class="tool-row-action video-action" href="${escapeHtml(finalVideoUrl(video.videoPath))}" target="_blank" rel="noreferrer">Video</a>
          <button class="tool-row-action" type="button" data-open-video-folder="${escapeHtml(video.folderPath || video.folder || "")}">Folder</button>
        </div>`
      : "";
    return `
      <div class="tool-row-option ${selected ? "is-selected" : ""} ${video ? "has-video" : ""}" title="${escapeHtml(meta || tool.url || tool.tool_url || "")}">
        <button class="tool-row-select" type="button" data-select-row="${escapeHtml(row)}">
          <span class="tool-row-title"><strong>Row ${escapeHtml(row)}</strong><b>${escapeHtml(toolDisplayName(tool))}</b></span>
          ${visibleMeta ? `<small class="tool-row-meta">${escapeHtml(visibleMeta)}</small>` : ""}
          ${video ? `<small class="tool-row-video-meta">Latest video: ${escapeHtml(shortDateTime(video.generatedAt || video.modifiedAt))}${videoCount > 1 ? ` | ${escapeHtml(videoCount)} versions saved` : ""}</small>` : ""}
        </button>
        <div class="tool-row-side">
          ${badges ? `<div class="tool-row-badges">${badges}</div>` : ""}
          ${videoActions}
        </div>
      </div>
    `;
  }).join("")}`;
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
  refreshAutoQueueControls();
  refreshStepFlowControls();
  updateToolDropdownSummary();
  updateAutoQueueHint();
  renderFinalReview();
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
  const quality = assetBuild.assetQuality || assetBuild.quality || {};
  if (els.assetQualityPanel && quality.score) {
    els.assetQualityPanel.classList.remove("is-hidden");
    if (els.assetQualityScore) {
      els.assetQualityScore.textContent = `${quality.score}/100`;
      els.assetQualityScore.dataset.tone = quality.needsRecapture ? "error" : quality.score >= 85 ? "success" : "warning";
    }
    if (els.assetQualityList) {
      els.assetQualityList.innerHTML = (quality.checks || []).map((check) => `
        <span data-status="${check.ok ? "complete" : "warning"}" title="${escapeHtml(check.note || check.label)}">
          <strong>${escapeHtml(check.ok ? "OK" : "Fix")}</strong>
          <small>${escapeHtml(check.label)}</small>
        </span>
      `).join("") || '<span data-status="idle"><strong>QA</strong><small>No checks found.</small></span>';
    }
  } else if (els.assetQualityPanel) {
    els.assetQualityPanel.classList.add("is-hidden");
  }
  const mediaFiles = (assetBuild.files || []).slice(0, 16);
  els.assetFileList.innerHTML = mediaFiles.map((file) => (
    `<a href="${escapeHtml(file.url)}" target="_blank" rel="noreferrer">${escapeHtml(file.kind)}: ${escapeHtml(file.name)}</a>`
  )).join("") || '<span class="muted">No files found.</span>';
  els.assetStepMeta.textContent = quality.score
    ? `${assetBuild.files?.length || 0} files | Q ${quality.score}/100`
    : `${assetBuild.files?.length || 0} files ready`;
  els.assetStepLink.classList.add("done");
  setTask("Assets ready", quality.score ? `${assetBuild.files?.length || 0} files saved | Q ${quality.score}/100` : `${assetBuild.files?.length || 0} files saved`, "success");
  setTerminalStatus("Asset build complete");
  setScriptState("Ready", "idle");
  activeStep("asset");
  setAssetBusy(false);
  setScriptBusy(false);
  setFinalBusy(false);
  renderFinalReview();
}

function normalizeScriptEditorText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function scriptEditorSeed(scriptBuild = {}) {
  const pkg = scriptBuild.scriptPackage || scriptBuild.plan?.metadata?.script_package || {};
  const seo = scriptBuild.seo || {};
  const scenes = scriptBuild.plan?.scenes || [];
  return {
    hook: pkg.hook || scenes[0]?.voiceover || "",
    body: pkg.body || scenes.slice(1, -1).map((scene) => scene.voiceover).filter(Boolean).join(" "),
    cta: pkg.cta || scenes.at(-1)?.voiceover || "",
    caption: seo.instagram_caption || "",
    hashtags: Array.isArray(seo.hashtags) ? seo.hashtags.join(" ") : String(seo.hashtags || "")
  };
}

function splitBodyForSceneCount(body, sceneCount) {
  const count = Math.max(0, Number(sceneCount || 0));
  const clean = normalizeScriptEditorText(body);
  if (!count || !clean) {
    return Array.from({ length: count }, () => "");
  }
  const sentences = clean
    .split(/(?<=[.!?।])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const source = sentences.length >= count ? sentences : clean.split(/\s+/).filter(Boolean);
  if (source.length <= count) {
    return Array.from({ length: count }, (_, index) => source[index] || "");
  }
  const chunks = [];
  for (let index = 0; index < count; index += 1) {
    const start = Math.floor((index * source.length) / count);
    const end = Math.floor(((index + 1) * source.length) / count);
    chunks.push(source.slice(start, Math.max(start + 1, end)).join(" ").trim());
  }
  return chunks;
}

function renderScriptEditor(scriptBuild = {}) {
  const scenes = scriptBuild.plan?.scenes || [];
  const seed = scriptEditorSeed(scriptBuild);
  state.currentScriptBuild = scriptBuild;
  state.scriptEditorOriginal = seed;
  state.scriptEditorDirty = false;
  if (els.scriptHookEditor) els.scriptHookEditor.value = seed.hook;
  if (els.scriptBodyEditor) els.scriptBodyEditor.value = seed.body;
  if (els.scriptCtaEditor) els.scriptCtaEditor.value = seed.cta;
  if (els.scriptCaptionEditor) els.scriptCaptionEditor.value = seed.caption;
  if (els.scriptHashtagsEditor) els.scriptHashtagsEditor.value = seed.hashtags;
  if (els.scriptEditorMeta) {
    els.scriptEditorMeta.textContent = `${scenes.length || 0} scenes | edit once here, save, then all video steps use this script.`;
  }
  if (els.scriptEditorPanel) {
    els.scriptEditorPanel.open = true;
  }
  if (els.scriptSceneEditorList) {
    els.scriptSceneEditorList.innerHTML = scenes.map((scene, index) => `
      <article class="script-scene-editor-item" data-editor-scene="${escapeHtml(scene.scene_number || index + 1)}">
        <div class="script-scene-editor-head">
          <strong>Scene ${escapeHtml(scene.scene_number || index + 1)}</strong>
          <span>${escapeHtml(scene.duration || 10)} sec</span>
        </div>
        <label class="field-label">
          <span>Voiceover</span>
          <textarea data-scene-field="voiceover" rows="3">${escapeHtml(scene.voiceover || "")}</textarea>
        </label>
        <label class="field-label">
          <span>On-screen text</span>
          <textarea data-scene-field="onscreen_text" rows="2">${escapeHtml(scene.onscreen_text || "")}</textarea>
        </label>
        <label class="field-label">
          <span>Visual notes</span>
          <textarea data-scene-field="visual" rows="2">${escapeHtml(scene.visual || "")}</textarea>
        </label>
      </article>
    `).join("") || '<span class="muted">No scene script generated.</span>';
  }
  syncAvatarScriptFromMainScript();
}

function collectScriptEditorPayload() {
  const scriptBuild = state.currentScriptBuild || {};
  const scenes = [...(els.scriptSceneEditorList?.querySelectorAll("[data-editor-scene]") || [])].map((item) => {
    const field = (name) => item.querySelector(`[data-scene-field="${name}"]`)?.value || "";
    return {
      scene_number: Number(item.dataset.editorScene || 0),
      voiceover: normalizeScriptEditorText(field("voiceover")),
      onscreen_text: normalizeScriptEditorText(field("onscreen_text")),
      visual: normalizeScriptEditorText(field("visual"))
    };
  });
  const hook = normalizeScriptEditorText(els.scriptHookEditor?.value || "");
  const body = normalizeScriptEditorText(els.scriptBodyEditor?.value || "");
  const cta = normalizeScriptEditorText(els.scriptCtaEditor?.value || "");
  if (scenes.length) {
    scenes[0].voiceover = hook || scenes[0].voiceover;
    scenes[scenes.length - 1].voiceover = cta || scenes[scenes.length - 1].voiceover;
    const originalBody = normalizeScriptEditorText(state.scriptEditorOriginal?.body || "");
    if (body && body !== originalBody && scenes.length > 2) {
      const bodyChunks = splitBodyForSceneCount(body, scenes.length - 2);
      for (let index = 1; index < scenes.length - 1; index += 1) {
        scenes[index].voiceover = bodyChunks[index - 1] || scenes[index].voiceover;
      }
    }
  }
  return {
    input: state.inputPath,
    row: Number(els.assetRowInput.value || scriptBuild.row || 0),
    scriptDir: scriptBuild.scriptDir || state.lastScriptFolder || "",
    scriptPath: scriptBuild.scriptPath || "",
    editor: {
      hook,
      body,
      cta,
      caption: String(els.scriptCaptionEditor?.value || "").trim(),
      hashtags: String(els.scriptHashtagsEditor?.value || "").trim(),
      scenes
    }
  };
}

async function saveUpdatedScript() {
  if (!state.currentScriptBuild || !state.lastScriptFolder) {
    throw new Error("Pehle script generate ya old script load karo.");
  }
  const payload = collectScriptEditorPayload();
  setScriptState("Saving update", "busy");
  setTask("Saving script update", `Row ${payload.row}`, "busy");
  setTerminalStatus("Saving edited script");
  appendTerminal(`POST /api/scripts/update row=${payload.row}`);
  setScriptBusy(true);
  const response = await fetch("/api/scripts/update", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Script update failed: ${response.status}`);
  }
  renderScriptResult(data.scriptBuild || {});
  if (els.scriptEditorPanel) {
    els.scriptEditorPanel.open = true;
  }
  setScriptState("Updated", "success");
  setTask("Script updated", data.scriptBuild?.markdownPath || state.lastScriptFolder, "success");
  setTerminalStatus("Script update saved");
  appendTerminal(`Updated script saved: ${data.scriptBuild?.markdownPath || state.lastScriptFolder}`, "stdout");
  scheduleArtifactCheck(payload.row);
}

async function ensureEditedScriptSaved(reason = "next step") {
  if (!state.scriptEditorDirty) {
    return false;
  }
  if (!state.currentScriptBuild || !state.lastScriptFolder) {
    return false;
  }
  setTask("Saving edited script", `Before ${reason}`, "busy");
  appendTerminal(`Auto-saving edited script before ${reason}.`, "stdout");
  await saveUpdatedScript();
  return true;
}

function markMainScriptEdited() {
  if (!state.currentScriptBuild) {
    return;
  }
  state.scriptEditorDirty = true;
  state.avatarScriptUserEdited = false;
  syncAvatarScriptFromMainScript();
  setScriptState("Edited - save/update", "idle");
  setScriptBusy(false);
  setTerminalStatus("Edited script will auto-save before avatar, voiceover, preview, or final render.");
}

function renderScriptResult(scriptBuild) {
  const scenes = scriptBuild.plan?.scenes || [];
  state.lastScriptFolder = scriptBuild.scriptDir || scriptBuild.scriptPath?.replace(/[\\/][^\\/]+$/, "") || "";
  state.lastScriptRow = Number(scriptBuild.row || els.assetRowInput.value || 0);
  state.currentScriptBuild = scriptBuild;
  els.scriptResult.classList.remove("is-hidden");
  els.scriptToolName.textContent = scriptBuild.tool?.tool_name || scriptBuild.tool?.name || "Reel script ready";
  els.scriptDuration.textContent = `${scriptBuild.totalDurationSeconds || scenes.length * 10 || 0} sec`;
  els.scriptFolderPath.textContent = scriptBuild.markdownPath || scriptBuild.scriptDir || "";
  els.scriptParts.innerHTML = "";
  els.scriptSceneCountLabel.textContent = `${scenes.length} scene(s)`;
  els.scriptSceneList.innerHTML = "";
  renderScriptEditor(scriptBuild);
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
  renderFinalReview();
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

function scriptEditorDraftForAvatar() {
  const payload = collectScriptEditorPayload();
  const scenes = payload.editor?.scenes || [];
  const focusSceneNumber = String(
    state.avatarScriptPreparedDraft?.focusScene
    || scenes.find((scene, index) => index > 0 && index < scenes.length - 1)?.scene_number
    || "2"
  );
  const focusScene = scenes.find((scene) => String(scene.scene_number) === focusSceneNumber)
    || scenes.find((scene, index) => index > 0 && index < scenes.length - 1)
    || {};
  const hook = payload.editor?.hook || scenes[0]?.voiceover || "";
  const cta = payload.editor?.cta || scenes.at(-1)?.voiceover || "";
  const focus = focusScene.voiceover || "";
  return {
    row: payload.row,
    hook,
    focus,
    focusScene: String(focusScene.scene_number || focusSceneNumber || "2"),
    cta,
    middle: focus ? { [String(focusScene.scene_number || focusSceneNumber || "2")]: focus } : {}
  };
}

function avatarDraftHasText(draft = {}) {
  return Boolean(normalizeScriptEditorText(draft.hook || draft.focus || draft.cta || ""));
}

function syncAvatarScriptFromMainScript(force = false) {
  if (!force && state.avatarScriptUserEdited) {
    return;
  }
  const draft = scriptEditorDraftForAvatar();
  if (!avatarDraftHasText(draft)) {
    return;
  }
  state.avatarScriptDraft = { ...draft };
  state.avatarScriptPreparedDraft = { ...draft };
  state.avatarScriptPreparedRow = Number(draft.row || els.assetRowInput?.value || 0);
  if (els.hookAvatarHookScriptEditor) {
    els.hookAvatarHookScriptEditor.value = draft.hook || "";
  }
  if (els.hookAvatarFocusScriptEditor) {
    els.hookAvatarFocusScriptEditor.value = draft.focus || "";
  }
  if (els.hookAvatarCtaScriptEditor) {
    els.hookAvatarCtaScriptEditor.value = draft.cta || "";
  }
  if (els.hookAvatarScriptEditorMeta) {
    els.hookAvatarScriptEditorMeta.textContent = `Synced from main edited script | focus Scene ${draft.focusScene || 2}`;
  }
  if (els.hookAvatarScriptReviewStatus) {
    els.hookAvatarScriptReviewStatus.textContent = "Avatar script is synced from Edit Script. Generate will use this exact text.";
  }
}

function avatarDraftFromHookArtifact(hookAvatar = {}) {
  const middleScripts = hookAvatar.middleAvatarScripts || hookAvatar.hookAvatar?.middleAvatarScripts || {};
  const firstMiddleEntry = Object.entries(middleScripts)[0] || [];
  return {
    row: Number(hookAvatar.row || els.assetRowInput?.value || 0),
    hook: hookAvatar.hookScript || hookAvatar.hookAvatar?.hookScript || "",
    focus: firstMiddleEntry[1] || "",
    focusScene: firstMiddleEntry[0] || "",
    cta: hookAvatar.ctaScript || hookAvatar.ctaAvatar?.ctaScript || "",
    middle: middleScripts
  };
}

function setAvatarScriptEditors(draft = {}, sourceLabel = "Prepared script") {
  state.avatarScriptDraft = { ...draft };
  state.avatarScriptPreparedDraft = { ...draft };
  state.avatarScriptPreparedRow = Number(draft.row || els.assetRowInput?.value || 0);
  state.avatarScriptUserEdited = false;
  if (els.hookAvatarHookScriptEditor) {
    els.hookAvatarHookScriptEditor.value = draft.hook || "";
  }
  if (els.hookAvatarFocusScriptEditor) {
    els.hookAvatarFocusScriptEditor.value = draft.focus || "";
  }
  if (els.hookAvatarCtaScriptEditor) {
    els.hookAvatarCtaScriptEditor.value = draft.cta || "";
  }
  if (els.hookAvatarScriptEditorMeta) {
    const parts = [
      sourceLabel,
      draft.focusScene ? `focus Scene ${draft.focusScene}` : "",
      "edit before Generate Avatar Pack"
    ].filter(Boolean);
    els.hookAvatarScriptEditorMeta.textContent = parts.join(" | ");
  }
  if (els.hookAvatarScriptReviewStatus) {
    els.hookAvatarScriptReviewStatus.textContent = "Review these lines before generating in Google Vids. Edited text is used directly.";
  }
  if (els.hookAvatarScriptEditorPanel) {
    els.hookAvatarScriptEditorPanel.open = true;
  }
}

function collectAvatarScriptDraft() {
  const row = Number(els.assetRowInput?.value || state.avatarScriptPreparedRow || 0);
  const focusScene = state.avatarScriptPreparedDraft?.focusScene || "2";
  const draft = {
    row,
    hook: normalizeScriptEditorText(els.hookAvatarHookScriptEditor?.value || ""),
    focus: normalizeScriptEditorText(els.hookAvatarFocusScriptEditor?.value || ""),
    focusScene,
    cta: normalizeScriptEditorText(els.hookAvatarCtaScriptEditor?.value || "")
  };
  draft.middle = draft.focus ? { [focusScene]: draft.focus } : {};
  state.avatarScriptDraft = draft;
  return draft;
}

function avatarScriptOverridesPayload() {
  const avatarDraft = collectAvatarScriptDraft();
  const scriptDraft = scriptEditorDraftForAvatar();
  const useScriptFirst = !state.avatarScriptUserEdited;
  const focusScene = String(avatarDraft.focusScene || scriptDraft.focusScene || "2");
  const draft = {
    row: avatarDraft.row || scriptDraft.row,
    hook: useScriptFirst ? (scriptDraft.hook || avatarDraft.hook) : (avatarDraft.hook || scriptDraft.hook),
    focus: useScriptFirst ? (scriptDraft.focus || avatarDraft.focus) : (avatarDraft.focus || scriptDraft.focus),
    focusScene,
    cta: useScriptFirst ? (scriptDraft.cta || avatarDraft.cta) : (avatarDraft.cta || scriptDraft.cta)
  };
  draft.middle = draft.focus ? { [focusScene]: draft.focus } : {};
  return {
    avatarHookScript: draft.hook,
    avatarCtaScript: draft.cta,
    avatarMiddleScripts: draft.middle,
    avatarScriptsReviewed: Boolean(draft.hook || draft.focus || draft.cta)
  };
}

function hasReviewedAvatarScript() {
  const payload = avatarScriptOverridesPayload();
  const draft = {
    hook: payload.avatarHookScript,
    focus: Object.values(payload.avatarMiddleScripts || {})[0] || "",
    cta: payload.avatarCtaScript
  };
  return Boolean(draft.hook || draft.focus || draft.cta);
}

function resetAvatarScriptEditors() {
  if (!state.avatarScriptPreparedDraft) {
    return;
  }
  state.avatarScriptUserEdited = false;
  setAvatarScriptEditors(state.avatarScriptPreparedDraft, "Reset to prepared script");
}

function hookAvatarPayload(extra = {}) {
  const row = Number(els.assetRowInput.value || 0);
  if (!state.inputPath) {
    throw new Error("Excel file pehle load karo.");
  }
  if (!Number.isFinite(row) || row < 2) {
    throw new Error("Valid Excel row number select karo.");
  }
  const profiles = requireGenerationProfiles("hook");
  const primaryProfile = profiles[0] || "";
  const fallbackProfile = profiles[1] || "";
  const lowCredit = lowCreditVidsEnabled();
  return {
    input: state.inputPath,
    row,
    presenter: els.hookPresenterSelect.value || "female",
    avatar: els.hookCharacterSelect?.value || "auto_by_reel",
    avatarLabel: hookCharacterLabel(els.hookCharacterSelect?.value || "auto_by_reel"),
    avatarHostImage: state.avatarHostImage || "",
    avatarReferenceImages: state.avatarHostImage || "",
    tone: els.hookToneSelect.value || "energetic",
    durationSeconds: Number(els.hookDurationSelect.value || 10),
    videoSize: els.hookVideoSizeSelect?.value || "portrait",
    lowCreditVidsMode: lowCredit,
    includeMiddleAvatar: !lowCredit,
    middleAvatarScenes: lowCredit ? "" : "2",
    focusDurationSeconds: Number(els.hookDurationSelect.value || 10),
    includeCtaAvatar: !lowCredit,
    ctaDurationSeconds: Number(els.hookDurationSelect.value || 10),
    profile: primaryProfile,
    primaryProfile,
    fallbackProfile,
    fallbackEnabled: Boolean(fallbackProfile),
    profiles,
    creditSafeMode: creditSafeEnabled(),
    scriptLanguage: els.scriptLanguageSelect.value || "Hinglish",
    assetsDir: Number(state.lastAssetRow || 0) === row ? state.lastAssetFolder : "",
    ...avatarScriptOverridesPayload(),
    ...extra
  };
}

function hookVideoUrl(filePath) {
  return filePath ? `/file?path=${encodeURIComponent(filePath)}` : "";
}

function hookVideoPathFromArtifact(hookAvatar = {}) {
  return hookAvatar.videoPath
    || hookAvatar.hookAvatar?.videoPath
    || hookAvatar.cachedScenePath
    || hookAvatar.hookAvatar?.cachedScenePath
    || "";
}

function ctaVideoPathFromArtifact(hookAvatar = {}) {
  return hookAvatar.ctaVideoPath
    || hookAvatar.ctaAvatar?.videoPath
    || hookAvatar.ctaCachedScenePath
    || hookAvatar.ctaAvatar?.cachedScenePath
    || "";
}

function middleVideoPathsFromArtifact(hookAvatar = {}) {
  return Object.values(hookAvatar.middleAvatarVideos || {})
    .concat(Object.values(hookAvatar.hookAvatar?.middleAvatarVideos || {}))
    .filter(Boolean);
}

function hookArtifactHasVideo(artifact = {}) {
  const hookAvatar = artifact.hookAvatar || artifact;
  return Boolean(
    hookVideoPathFromArtifact(hookAvatar)
    || ctaVideoPathFromArtifact(hookAvatar)
    || middleVideoPathsFromArtifact(hookAvatar).length
  );
}

function renderHookAvatarResult(hookAvatar = {}) {
  const status = hookAvatar.status || hookAvatar.hookAvatar?.status || "prepared";
  const videoPath = hookVideoPathFromArtifact(hookAvatar);
  const isHookOnly = hookAvatar.includeCtaAvatar === false && !(hookAvatar.middleAvatarScenes || []).length;
  state.lastHookAvatarFolder = hookAvatar.hookDir || hookAvatar.folder || "";
  state.lastHookAvatarVideo = videoPath;
  state.lastHookAvatarRow = Number(hookAvatar.row || hookAvatar.hookAvatar?.row || els.assetRowInput.value || 0);
  els.hookResult.classList.remove("is-hidden");
  els.hookToolName.textContent = hookAvatar.tool?.tool_name || hookAvatar.tool?.name || "Avatar clips ready";
  const activeProfile = hookAvatar.activeProfile || hookAvatar.hookAvatar?.activeProfile || "";
  const avatarChoice = hookAvatar.avatarChoice || hookAvatar.hookAvatar?.avatarChoice || {};
  const avatarText = avatarChoice.label || hookAvatar.googleVidsAvatar || "";
  els.hookStatusText.textContent = [status, activeProfile, avatarText, hookAvatar.videoSizeLabel || hookAvatar.videoSize || ""].filter(Boolean).join(" | ");
  els.hookFolderPath.textContent = hookAvatar.hookDir || hookAvatar.folder || "";
  const hookScript = hookAvatar.hookScript || hookAvatar.hookAvatar?.hookScript || "";
  const ctaScript = hookAvatar.ctaScript || hookAvatar.ctaAvatar?.ctaScript || "";
  const middleScripts = hookAvatar.middleAvatarScripts || {};
  const middlePrompts = hookAvatar.googleVidsMiddlePrompts || {};
  setAvatarScriptEditors(avatarDraftFromHookArtifact(hookAvatar), status === "complete" ? "Generated avatar script" : "Prepared avatar script");
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
  const ctaVideoPath = ctaVideoPathFromArtifact(hookAvatar);
  const middleVideoPaths = middleVideoPathsFromArtifact(hookAvatar);
  const success = status === "complete" || Boolean(videoPath || ctaVideoPath || middleVideoPaths.length);
  setHookState(success ? (middleVideoPaths.length || ctaVideoPath ? "Avatar pack ready" : "Hook video ready") : isHookOnly ? "Hook prompt prepared" : "Avatar pack prepared", "success");
  setTask(success ? (isHookOnly ? "Hook avatar ready" : "Avatar clips ready") : isHookOnly ? "Hook prompt ready" : "Avatar pack ready", ctaVideoPath || middleVideoPaths[0] || videoPath || hookAvatar.hookDir || "", "success");
  setTerminalStatus(success ? "Avatar clip flow complete" : isHookOnly ? "Hook prompt prepared" : "Hook+Focus+CTA prompt pack prepared");
  appendTerminal(`${isHookOnly ? "Hook-only avatar" : "Hook+Focus+CTA avatar"} ${status}${avatarText ? ` | ${avatarText}` : ""}: ${hookAvatar.hookDir || ""}`, "stdout");
  loadHookProfiles({ primary: activeProfile || undefined }).catch((error) => {
    appendTerminal(error.message, "stderr");
  });
  activeStep("hook");
  setHookBusy(false);
  setFinalState("Ready to render", "idle");
  setFinalBusy(false);
  renderFinalReview();
}

async function prepareHookAvatar() {
  await ensureEditedScriptSaved("avatar prompt");
  syncAvatarScriptFromMainScript();
  const payload = hookAvatarPayload();
  setHookState("Preparing", "busy");
  setTask(payload.lowCreditVidsMode ? "Preparing hook prompt" : "Preparing avatar pack", `Row ${payload.row} | ${payload.presenter} | ${payload.avatarLabel} | ${payload.tone} | ${payload.videoSize}`, "busy");
  setTerminalStatus(payload.lowCreditVidsMode ? "Preparing hook-only Google Vids prompt" : "Preparing hook+focus+CTA avatar prompt pack");
  appendTerminal(`POST /api/hook-avatar/prepare row=${payload.row} size=${payload.videoSize}`);
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
  if (!runId) {
    return Promise.reject(new Error("Avatar run id missing."));
  }
  const source = new EventSource(`/api/hook-avatar/runs/${encodeURIComponent(runId)}/events`);
  state.hookAvatarEventSource = source;
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      source.close();
      state.hookAvatarEventSource = null;
      const message = `Avatar pack run timed out: ${runId}`;
      appendTerminal(message, "stderr");
      reject(new Error(message));
    }, STEP_FLOW_RUN_TIMEOUT_MS);
    const settle = (handler, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      source.close();
      state.hookAvatarEventSource = null;
      handler(value);
    };
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
      if (run.status === "complete") {
        renderHookAvatarResult(run.result || {});
        appendTerminal(`Avatar pack run complete: ${run.id}`, "stdout");
        scheduleArtifactCheck(Number(run.result?.row || els.assetRowInput.value || 0));
        settle(resolve, run.result || {});
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
      settle(reject, new Error(message));
    });
    source.onerror = () => {
      appendTerminal(`Avatar pack event stream interrupted for ${runId}.`, "stderr");
    };
  });
}

async function generateHookAvatar() {
  await ensureEditedScriptSaved("avatar generation");
  syncAvatarScriptFromMainScript();
  if (!hasReviewedAvatarScript()) {
    setTask("Prepare avatar script first", "Prepare Avatar Pack click karo, script review/edit karo, fir generate karo.", "error");
    appendTerminal("Avatar generation blocked: review/edit avatar script before using Google Vids credits.", "stderr");
    return { canceled: true };
  }
  const payload = hookAvatarPayload({ prepareOnly: false });
  const avatarClipEstimate = payload.lowCreditVidsMode ? 1 : 3;
  if (state.lastHookAvatarVideo) {
    const typed = window.prompt(`Avatar video already exists for this row.\n\nExisting: ${state.lastHookAvatarVideo}\n\nDuplicate/re-generate karna hai to REGEN type karo.`);
    if (String(typed || "").trim().toUpperCase() !== "REGEN") {
      setTask("Avatar generation skipped", "Existing avatar video reuse hoga. Duplicate create nahi kiya.", "idle");
      appendTerminal("Skipped Google Vids avatar generation because an existing avatar video is already available.", "system");
      return { canceled: true };
    }
  }
  if (!confirmCreditSpend(
    payload.lowCreditVidsMode ? "Generate Google Vids Hook Clip" : "Generate Google Vids Avatar Pack",
    payload.lowCreditVidsMode
      ? "This will generate/export only the hook avatar clip. Estimate: 1 Google Vids clip for this selected row."
      : "This can generate/export hook, focus, and CTA avatar clips. Estimate: up to 3 Google Vids clips for this selected row."
  )) {
    return { canceled: true };
  }
  setHookState("Generating", "busy");
  setTask(payload.lowCreditVidsMode ? "Generating hook avatar" : "Generating avatar pack", `Google Vids | Row ${payload.row} | ${payload.videoSize} | approx ${avatarClipEstimate} clip(s) | ${payload.profiles.join(" -> ")}`, "busy");
  setTerminalStatus(payload.lowCreditVidsMode ? "Starting Google Vids hook-only run" : "Starting Google Vids hook+focus+CTA avatar run");
  appendTerminal(`POST /api/hook-avatar/runs row=${payload.row} size=${payload.videoSize} clips=${avatarClipEstimate} profiles=${payload.profiles.join(", ")}`);
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
  return connectHookAvatarRun(state.lastHookAvatarRunId);
}

function connectAssetRun(runId) {
  if (state.assetEventSource) {
    state.assetEventSource.close();
  }
  if (!runId) {
    return Promise.reject(new Error("Asset run id missing."));
  }
  const source = new EventSource(`/api/assets/runs/${encodeURIComponent(runId)}/events`);
  state.assetEventSource = source;
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      source.close();
      state.assetEventSource = null;
      const message = `Asset run timed out: ${runId}`;
      appendTerminal(message, "stderr");
      reject(new Error(message));
    }, STEP_FLOW_RUN_TIMEOUT_MS);
    const settle = (handler, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      source.close();
      state.assetEventSource = null;
      handler(value);
    };
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
      if (run.status === "complete") {
        renderAssetBuild(run.result || {});
        setAssetState("Assets ready", "success");
        appendTerminal(`Asset run complete: ${run.id}`, "stdout");
        scheduleArtifactCheck(Number(run.result?.row || els.assetRowInput.value || 0));
        settle(resolve, run.result || {});
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
      settle(reject, new Error(message));
    });
    source.onerror = () => {
      appendTerminal(`Event stream interrupted for ${runId}.`, "stderr");
    };
  });
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
  return connectAssetRun(data.run?.id);
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
  const profiles = selectedGenerationProfiles("hook");
  const primaryProfile = profiles[0] || "";
  const fallbackProfile = profiles[1] || "";
  const sameRowAssets = Number(state.lastAssetRow || 0) === row;
  const sameRowScript = Number(state.lastScriptRow || 0) === row;
  const sameRowHookAvatar = Number(state.lastHookAvatarRow || 0) === row;
  const sameRowFinal = Number(state.lastFinalReelRow || 0) === row;
  const sameRowVidsVoiceover = Number(state.lastVidsVoiceoverRow || 0) === row;
  const preferredVoiceoverDir = sameRowVidsVoiceover && state.lastVidsVoiceoverFolder
    ? state.lastVidsVoiceoverFolder
    : sameRowFinal && state.lastFinalReelFolder
      ? `${state.lastFinalReelFolder}/voiceovers`
      : "";
  const hasSavedVidsVoiceover = sameRowVidsVoiceover && Boolean(state.lastVidsVoiceoverFolder || state.lastVidsVoiceoverExport);
  const selectedVoiceProvider = els.finalVoiceProviderSelect?.value || "free";
  return {
    input: state.inputPath,
    row,
    toolName: tool.name || tool.tool_name || "",
    toolUrl: tool.url || tool.tool_url || "",
    scriptLanguage: els.scriptLanguageSelect?.value || "Hinglish",
    presenter: els.hookPresenterSelect?.value || "female",
    videoSize: els.hookVideoSizeSelect?.value || "portrait",
    hookAvatarCharacter: els.hookCharacterSelect?.value || "auto_by_reel",
    hookAvatarCharacterLabel: hookCharacterLabel(els.hookCharacterSelect?.value || "auto_by_reel"),
    avatarHostImage: state.avatarHostImage || "",
    avatarReferenceImages: state.avatarHostImage || "",
    voiceoverProvider: hasSavedVidsVoiceover ? "google-vids-voiceover" : selectedVoiceProvider,
    assetsDir: sameRowAssets ? state.lastAssetFolder : "",
    scriptDir: sameRowScript ? state.lastScriptFolder : "",
    hookAvatarFolder: sameRowHookAvatar ? state.lastHookAvatarFolder : "",
    hookAvatarVideo: sameRowHookAvatar ? state.lastHookAvatarVideo : "",
    voiceoverDir: preferredVoiceoverDir,
    vidsVoiceoverDir: preferredVoiceoverDir,
    voiceoverSourceVideo: sameRowVidsVoiceover ? state.lastVidsVoiceoverExport || "" : "",
    lastVidsVoiceoverExport: sameRowVidsVoiceover ? state.lastVidsVoiceoverExport || "" : "",
    requireVidsVoiceover: hasSavedVidsVoiceover,
    profile: primaryProfile,
    primaryProfile,
    fallbackProfile,
    fallbackEnabled: Boolean(fallbackProfile),
    profiles,
    lowCreditVidsMode: lowCreditVidsEnabled(),
    creditSafeMode: creditSafeEnabled(),
    ...extra
  };
}

function renderFinalReelResult(finalReel = {}) {
  const videoPath = finalReel.videoPath || finalReel.outputPath || "";
  const isPreview = Boolean(finalReel.preview);
  const folderPath = finalReel.finalDir || finalReel.folder || "";
  if (isPreview) {
    state.lastPreviewReelFolder = folderPath;
    state.lastPreviewReelVideo = videoPath;
    state.lastPreviewReelRow = Number(finalReel.row || els.assetRowInput.value || 0);
  } else {
    state.lastFinalReelFolder = folderPath;
    state.lastFinalReelVideo = videoPath;
    state.lastFinalReelRow = Number(finalReel.row || els.assetRowInput.value || 0);
  }
  state.lastVidsVoiceoverExport = finalReel.vidsVoiceover?.exportedPath
    || finalReel.voiceoverSourceVideo
    || finalReel.mp4Path
    || state.lastVidsVoiceoverExport
    || "";
  state.lastVidsVoiceoverFolder = finalReel.voiceoverDir
    || finalReel.vidsVoiceover?.extracted?.voiceoverDir
    || state.lastVidsVoiceoverFolder
    || "";
  state.lastVidsVoiceoverRow = Number(finalReel.row || els.assetRowInput.value || state.lastVidsVoiceoverRow || 0);
  els.finalResult?.classList.remove("is-hidden");
  if (els.finalToolName) {
    els.finalToolName.textContent = finalReel.tool?.tool_name || finalReel.tool?.name || "Final reel ready";
  }
  if (els.finalStatusText) {
    const score = Number(finalReel.qualityScore || 0);
    els.finalStatusText.textContent = isPreview
      ? (score ? `Preview ${score}/100` : "Preview ready")
      : score ? `Quality ${score}/100` : (finalReel.status || "Ready");
  }
  if (els.finalFolderPath) {
    els.finalFolderPath.textContent = folderPath || "";
  }
  if (els.finalSummary) {
    const decision = finalReel.decisions
      ? [finalReel.decisions.hook, finalReel.decisions.body, finalReel.decisions.cta].filter(Boolean).join(" ")
      : "";
    els.finalSummary.textContent = finalReel.summary || decision || (isPreview ? "Quick preview rendered. Review before full render." : "Final reel rendered. Human review before posting.");
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
  setFinalState(videoPath ? (isPreview ? "Preview ready" : "Final ready") : "Prepared", "success");
  setTask(videoPath ? (isPreview ? "Preview ready" : "Final reel ready") : "Final reel prepared", videoPath || folderPath || "", "success");
  setTerminalStatus(videoPath ? (isPreview ? "Preview MP4 ready" : "Final MP4 ready") : "Final render prepared");
  appendTerminal(`${isPreview ? "Preview" : "Final reel"} ${finalReel.status || "ready"}: ${videoPath || folderPath}`, "stdout");
  activeStep("final");
  setFinalBusy(false);
  renderFinalReview(finalReel);
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
  if (!runId) {
    return Promise.reject(new Error("Final reel run id missing."));
  }
  const source = new EventSource(`/api/final-reel/runs/${encodeURIComponent(runId)}/events`);
  state.finalReelEventSource = source;
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      source.close();
      state.finalReelEventSource = null;
      const message = `Final reel run timed out: ${runId}`;
      appendTerminal(message, "stderr");
      reject(new Error(message));
    }, STEP_FLOW_RUN_TIMEOUT_MS);
    const settle = (handler, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      source.close();
      state.finalReelEventSource = null;
      handler(value);
    };
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
      renderFinalPipeline(run.steps || []);
      if (run.status === "complete") {
        renderFinalReelResult(run.result || {});
        appendTerminal(`Final reel run complete: ${run.id}`, "stdout");
        scheduleArtifactCheck(Number(run.result?.row || els.assetRowInput.value || 0));
        settle(resolve, run.result || {});
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
      settle(reject, new Error(message));
    });
    source.onerror = () => {
      appendTerminal(`Final reel event stream interrupted for ${runId}.`, "stderr");
    };
  });
}

async function renderFinalReel(options = {}) {
  const isPreview = Boolean(options.preview);
  await ensureEditedScriptSaved(isPreview ? "quick preview" : "final render");
  const payload = finalReelPayload(isPreview
    ? {
      preview: true,
      previewSeconds: options.previewSeconds || 15,
      previewScenes: options.previewScenes || 2,
      voiceoverProvider: "local"
    }
    : {});
  if (creditSafeEnabled() && ["openai", "elevenlabs"].includes(payload.voiceoverProvider || "")) {
    payload.voiceoverProvider = "free";
    if (els.finalVoiceProviderSelect) {
      els.finalVoiceProviderSelect.value = "free";
    }
    appendTerminal("Credit Safe switched final voiceover provider to free.", "stdout");
  } else if (["openai", "elevenlabs"].includes(payload.voiceoverProvider || "")) {
    const ok = confirmCreditSpend(
      "Use paid/API voiceover provider",
      `Selected voice provider: ${payload.voiceoverProvider}. This can use external API credits.`
    );
    if (!ok) return;
  }
  state.finalBusyMode = isPreview ? "preview" : "render";
  setFinalState(isPreview ? "Previewing" : "Rendering", "busy");
  setTask(isPreview ? "Rendering quick preview" : "Rendering final reel", `Row ${payload.row} | ${payload.voiceoverProvider}`, "busy");
  setTerminalStatus(isPreview ? "Starting preview render" : "Starting final reel render");
  appendTerminal(`POST /api/final-reel/runs row=${payload.row} ${isPreview ? "preview=15s" : `voice=${payload.voiceoverProvider}`}`);
  renderFinalPipeline([{ id: "start", label: isPreview ? "Quick Preview" : "Final Reel", status: "running", detail: isPreview ? "Rendering 15 sec local preview." : "Starting render." }]);
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
  return connectFinalReelRun(state.lastFinalReelRunId);
}

async function generateVidsVoiceover() {
  await ensureEditedScriptSaved("Google Vids voiceover");
  const payload = finalReelPayload({
    fromScene: 2,
    remainingFromScene: 2,
    voiceoverProvider: "google-vids-voiceover"
  });
  if (!confirmCreditSpend(
    "Generate Google Vids Voiceover",
    "This opens Google Vids Voiceover tab, generates narration for body/CTA scenes, and exports MP4/audio. It can use Google Vids credits."
  )) {
    return { canceled: true };
  }
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
  return connectFinalReelRun(state.lastFinalReelRunId);
}

async function openLatestFinalFolder() {
  const targetFolder = state.lastFinalReelFolder || state.lastPreviewReelFolder;
  if (!targetFolder) return;
  appendTerminal(`POST /api/open ${targetFolder}`);
  const response = await fetch("/api/open", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path: targetFolder })
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Open final folder failed: ${response.status}`);
  }
}

async function executeStepFlowStep(step) {
  scrollStepIntoView(step.key);
  if (step.key === "asset") {
    activeStep("asset");
    await buildAssets();
    return;
  }
  if (step.key === "script") {
    activeStep("script");
    await generateReelScript();
    return;
  }
  if (step.key === "avatar") {
    activeStep("hook");
    await prepareHookAvatar();
    return;
  }
  if (step.key === "vids-avatar") {
    activeStep("hook");
    const result = await generateHookAvatar();
    if (result?.canceled) {
      throw new Error("Vids avatar generation canceled before credits were used.");
    }
    return;
  }
  if (step.key === "vids-voiceover") {
    if (creditSafeEnabled()) {
      appendTerminal("Skipped Vids voiceover because Credit Safe is ON.", "stdout");
      return { skipped: true, reason: "Credit Safe ON" };
    }
    activeStep("final");
    const result = await generateVidsVoiceover();
    if (result?.canceled) {
      throw new Error("Vids voiceover generation canceled before credits were used.");
    }
    return;
  }
  if (step.key === "final") {
    activeStep("final");
    await renderFinalReel();
  }
}

async function runStepFlow() {
  if (state.stepFlowRunning) return;
  if (!stepFlowHasRow()) {
    setStepFlowState("Waiting", "error");
    if (els.stepFlowStatus) {
      els.stepFlowStatus.textContent = "Excel load karo aur valid tool row select karo.";
    }
    setTask("Step flow blocked", "Excel/row missing.", "error");
    return;
  }
  const row = Number(els.assetRowInput.value || 0);
  const plan = stepFlowPlan();
  if (!plan.length) {
    setStepFlowState("No steps", "error");
    if (els.stepFlowStatus) {
      els.stepFlowStatus.textContent = "Kam se kam ek step select karo.";
    }
    return;
  }
  state.stepFlowSteps = plan.map((step) => ({ ...step, status: "pending" }));
  renderStepFlowTimeline();
  setStepFlowBusy(true);
  setStepFlowState("Running", "busy");
  if (els.stepFlowStatus) {
    els.stepFlowStatus.textContent = `Row ${row}: ${plan.length} selected step(s) one by one run ho rahe hain.`;
  }
  setTask("Step flow running", `Row ${row} | ${plan.map((step) => step.label).join(" -> ")}`, "busy");
  setTerminalStatus("Step flow started");
  appendTerminal(`Step flow started row=${row} steps=${plan.map((step) => step.key).join(",")}`);

  try {
    for (const step of plan) {
      if (state.stepFlowStopRequested) {
        updateStepFlowStep(step.key, "stopped", "Stopped before this step.");
        appendTerminal(`Step flow stopped before ${step.label}.`, "stdout");
        continue;
      }
      updateStepFlowStep(step.key, "running", "Running now");
      if (els.stepFlowStatus) {
        els.stepFlowStatus.textContent = `Running: ${step.label}. Output niche section me update hoga.`;
      }
      setTask(`Running ${step.label}`, `Row ${row}`, "busy");
      setTerminalStatus(`Step flow: ${step.label}`);
      appendTerminal(`Step flow -> ${step.label}`, "stdout");
      const result = await executeStepFlowStep(step);
      updateStepFlowStep(step.key, result?.skipped ? "skipped" : "complete", result?.reason || "Complete");
      appendTerminal(`Step flow complete -> ${step.label}`, "stdout");
    }

    const stopped = state.stepFlowStopRequested;
    const completeCount = state.stepFlowSteps.filter((step) => step.status === "complete" || step.status === "skipped").length;
    setStepFlowState(stopped ? "Stopped" : "Complete", stopped ? "error" : "success");
    if (els.stepFlowStatus) {
      els.stepFlowStatus.textContent = stopped
        ? `Stopped after current step. ${completeCount}/${plan.length} step(s) done.`
        : `All selected steps complete. ${completeCount}/${plan.length} step(s) done.`;
    }
    setTask(stopped ? "Step flow stopped" : "Step flow complete", `Row ${row} | ${completeCount}/${plan.length} done`, stopped ? "error" : "success");
    setTerminalStatus(stopped ? "Step flow stopped" : "Step flow complete");
  } catch (error) {
    const running = state.stepFlowSteps.find((step) => step.status === "running");
    if (running) {
      updateStepFlowStep(running.key, "failed", error.message);
    }
    setStepFlowState("Failed", "error");
    if (els.stepFlowStatus) {
      els.stepFlowStatus.textContent = error.message;
    }
    setTask("Step flow failed", error.message, "error");
    setTerminalStatus("Step flow failed");
    appendTerminal(error.message, "stderr");
  } finally {
    setStepFlowBusy(false);
  }
}

function parseAutoRows(value) {
  return String(value || "")
    .split(",")
    .flatMap((part) => {
      const trimmed = part.trim();
      if (!trimmed) return [];
      const range = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
      if (!range) {
        const row = Number(trimmed);
        return Number.isInteger(row) && row >= 2 ? [row] : [];
      }
      const start = Number(range[1]);
      const end = Number(range[2]);
      const low = Math.max(2, Math.min(start, end));
      const high = Math.max(start, end);
      return Array.from({ length: Math.max(0, high - low + 1) }, (_, index) => low + index);
    })
    .filter((row, index, rows) => rows.indexOf(row) === index)
    .slice(0, 50);
}

function buildAutoQueueBody() {
  if (!state.inputPath) {
    throw new Error("Excel file pehle load karo.");
  }
  const selectedRow = Number(els.assetRowInput.value || 0);
  if (!Number.isFinite(selectedRow) || selectedRow < 2) {
    throw new Error("Valid tool row select karo.");
  }
  const requestedCount = Math.floor(finiteClamp(els.autoVideoCount?.value, 1, 1, 50));
  const count = requestedCount;
  const explicitRows = parseAutoRows(els.autoRowsInput?.value || "").slice(0, count);
  const startRow = els.autoStartSelectedRow?.checked ? selectedRow : 2;
  const safe = creditSafeEnabled();
  const lowCredit = lowCreditVidsEnabled();
  const useVidsHook = Boolean(els.autoUseVidsHook?.checked) && !safe;
  const defaults = state.dashboardDefaults || {};
  const ai = defaults.ai || {};
  const voiceover = defaults.voiceover || {};
  const aiProvider = ai.hasGeminiKey ? "gemini" : (ai.defaultProvider || "openai");
  const aiModel = aiProvider === "gemini"
    ? (ai.defaultGeminiModel || "gemini-2.5-pro")
    : (ai.defaultModel || "gpt-5-mini");

  return {
    input: state.inputPath,
    row: startRow,
    startRow,
    queueLimit: count,
    rows: explicitRows.length ? explicitRows : "",
    mode: useVidsHook ? "google-hook" : "local",
    creditSafeMode: safe,
    lowCreditVidsMode: lowCredit,
    maxScenes: Math.floor(finiteClamp(els.scriptSceneCount?.value, 5, 3, 6)),
    scriptLanguage: els.scriptLanguageSelect?.value || "Hinglish",
    freeVideoProviders: "capcut,pika,runway,canva,did,shotstack",
    useAiScript: Boolean(ai.hasOpenAiKey || ai.hasGeminiKey),
    aiProvider,
    aiModel,
    ttsProvider: "free",
    ttsModel: "edge-tts",
    ttsVoice: voiceover.edgeVoice || "hi-IN-SwaraNeural",
    hookAvatarStyle: els.hookPresenterSelect?.value || "female",
    hookVideoSize: els.hookVideoSizeSelect?.value || "portrait",
    videoSize: els.hookVideoSizeSelect?.value || "portrait",
    useAvatar: true,
    avatar: els.hookCharacterSelect?.value || "auto_by_reel",
    avatarScenes: useVidsHook ? "1" : "",
    includeMiddleAvatar: !lowCredit,
    includeCtaAvatar: !lowCredit,
    useIngredients: true,
    ingredients: "auto",
    ingredientScenes: "3,4,5",
    profiles: selectedAutomationProfiles(),
    reuseUrlOnFallback: true,
    noLocalFallback: false,
    updateSourceWorkbook: Boolean(els.autoUpdateWorkbook?.checked)
  };
}

function autoQueueTone(status) {
  if (status === "complete") return "success";
  if (["complete_with_failures", "failed", "paused_quota", "canceled"].includes(status)) return "error";
  if (["queued", "running", "canceling"].includes(status)) return "busy";
  return "idle";
}

function shortPath(value) {
  const text = String(value || "");
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
    } catch {
      return text;
    }
  }
  return text.split(/[\\/]/).filter(Boolean).slice(-3).join(" / ") || text;
}

function queueItemTitle(item = {}) {
  const report = item.report || {};
  return report.toolName || item.toolName || `Row ${item.row || ""}`.trim();
}

function renderQueueSteps(steps = []) {
  if (!steps.length) {
    return '<span class="auto-step-pill" data-status="pending">Waiting</span>';
  }
  return steps.map((step) => {
    const status = step.status || "pending";
    const title = [step.label || step.key || "Step", step.detail || ""].filter(Boolean).join(": ");
    return `<span class="auto-step-pill" data-status="${escapeHtml(status)}" title="${escapeHtml(title)}">${escapeHtml(step.label || step.key || "Step")}</span>`;
  }).join("");
}

function renderQueueOutputs(outputs = []) {
  if (!outputs.length) {
    return '<span class="auto-output-empty">Output yaha appear hoga.</span>';
  }
  return outputs.map((output) => {
    const label = output.label || "Output";
    const location = output.url || output.path || "";
    if (!location) return "";
    if (output.url) {
      return `<a class="auto-output-link" href="${escapeHtml(output.url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
    }
    const previewLink = ["video", "file"].includes(output.kind)
      ? `<a class="auto-output-link" href="${escapeHtml(finalVideoUrl(output.path))}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`
      : "";
    return `${previewLink}<button class="auto-output-link" type="button" data-open-output-path="${escapeHtml(output.path)}" data-open-output-label="${escapeHtml(label)}">Open ${escapeHtml(label)}</button>`;
  }).join("");
}

function renderAutoTimeline(queue, activeItem, done) {
  if (!els.autoRunTimeline) return;
  if (!queue?.items?.length) {
    els.autoRunTimeline.innerHTML = '<span class="muted">Automation steps will appear here.</span>';
    return;
  }
  const counts = queue.counts || {};
  const title = activeItem
    ? `Row ${activeItem.row} - ${queueItemTitle(activeItem)}`
    : queue.status === "complete"
      ? "Automation complete"
      : queue.status === "queued"
        ? "Automation queued"
        : "Automation status";
  const activeStep = activeItem?.activeStep;
  const detail = activeItem?.latestLog?.text || activeStep?.detail || queue.note || "";
  const completeCount = Number(counts.complete || 0);
  const failedCount = Number(counts.failed || 0);
  els.autoRunTimeline.innerHTML = `
    <div class="auto-live-head">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(done)}/${escapeHtml(queue.total || 0)} done${failedCount ? ` | ${escapeHtml(failedCount)} failed` : ""}${completeCount ? ` | ${escapeHtml(completeCount)} ready` : ""}</span>
    </div>
    <div class="auto-step-strip">${renderQueueSteps(activeItem?.steps || [])}</div>
    <div class="auto-live-detail">${escapeHtml(detail || "Waiting for next automation update...")}</div>
  `;
}

function renderAutoQueue(queue) {
  if (!queue || !els.autoQueueMeta) return;
  state.activeAutoQueueId = ["queued", "running", "canceling"].includes(queue.status) ? queue.id : "";
  state.autoQueueProgressWorkbook = queue.progressWorkbook || state.autoQueueProgressWorkbook || "";
  const counts = queue.counts || {};
  const done = ["complete", "failed", "canceled", "paused"].reduce((total, key) => total + Number(counts[key] || 0), 0);
  const activeItem = (queue.items || []).find((item) => item.status === "running");
  const tone = autoQueueTone(queue.status);
  setAutoQueueState(queue.status === "paused_quota" ? "Quota paused" : queue.status, tone);
  els.autoQueueMeta.textContent = [
    `Queue ${queue.id}`,
    `${done}/${queue.total || 0} rows done`,
    activeItem ? `Active row ${activeItem.row}` : "",
    queue.note || "",
    queue.progressWorkbook ? `Progress: ${queue.progressWorkbook}` : ""
  ].filter(Boolean).join(" | ");
  renderAutoTimeline(queue, activeItem, done);
  if (els.autoQueueList) {
    els.autoQueueList.innerHTML = (queue.items || []).map((item) => {
      const report = item.report || {};
      const label = queueItemTitle(item);
      const output = report.mp4Path || report.outputDir || item.outputs?.[0]?.path || item.outputs?.[0]?.url || "";
      const activeStep = item.activeStep?.label ? ` | ${item.activeStep.label}` : "";
      const latest = item.latestLog?.text || item.activeStep?.detail || report.error || report.driveSyncError || "";
      return `
        <div class="auto-queue-item" data-status="${escapeHtml(item.status || "pending")}">
          <div class="auto-queue-item-head">
            <strong>Row ${escapeHtml(item.row)} - ${escapeHtml(label)}</strong>
            <span>${escapeHtml(item.status || "pending")}${escapeHtml(activeStep)}</span>
          </div>
          <div class="auto-step-strip">${renderQueueSteps(item.steps || [])}</div>
          <div class="auto-output-list">${renderQueueOutputs(item.outputs || [])}</div>
          <span class="auto-queue-log">${escapeHtml(latest || (output ? shortPath(output) : "Waiting..."))}</span>
        </div>
      `;
    }).join("") || '<span class="muted">Queue rows will appear here.</span>';
  }
  const active = ["queued", "running", "canceling"].includes(queue.status);
  setAutoQueueBusy(active);
  refreshAutoQueueControls();
  if (!active) {
    const finalTone = queue.status === "complete" ? "success" : tone;
    setTask(
      queue.status === "complete" ? "Auto queue complete" : "Auto queue stopped",
      queue.note || `${done}/${queue.total || 0} rows processed`,
      finalTone
    );
    setTerminalStatus(`Auto queue ${queue.status}`);
  }
}

function appendAutoRunLogs(run) {
  if (!run?.id) return;
  const logs = run.logs || [];
  const seen = state.autoQueueLogCursors.get(run.id) || 0;
  if (logs.length <= seen) return;
  for (const entry of logs.slice(seen)) {
    appendTerminal(entry.text, entry.stream || "system");
  }
  state.autoQueueLogCursors.set(run.id, logs.length);
}

async function pollAutoQueue() {
  if (state.autoQueueTimer) {
    clearTimeout(state.autoQueueTimer);
    state.autoQueueTimer = null;
  }
  if (!state.activeAutoQueueId) return;
  try {
    const data = await readJsonApi(`/api/queues/${encodeURIComponent(state.activeAutoQueueId)}`);
    const queue = data.queue;
    renderAutoQueue(queue);
    if (queue?.activeRunId) {
      state.activeAutoQueueRunId = queue.activeRunId;
      const runData = await readJsonApi(`/api/runs/${encodeURIComponent(queue.activeRunId)}`);
      appendAutoRunLogs(runData.run);
    }
    const active = ["queued", "running", "canceling"].includes(queue?.status);
    if (active) {
      state.autoQueueTimer = setTimeout(() => {
        pollAutoQueue().catch((error) => {
          appendTerminal(error.message, "stderr");
        });
      }, 2500);
    }
  } catch (error) {
    appendTerminal(`Auto queue poll failed: ${error.message}`, "stderr");
    state.autoQueueTimer = setTimeout(() => {
      pollAutoQueue().catch((nextError) => {
        appendTerminal(nextError.message, "stderr");
      });
    }, 4000);
  }
}

async function startAutoQueue() {
  const body = buildAutoQueueBody();
  if (!body.creditSafeMode && (body.mode === "google-hook" || body.mode === "google" || body.mode === "google-full")) {
    const rows = parseAutoRows(body.rows || "").length ? parseAutoRows(body.rows || "") : plannedAutoQueueRows();
    const clips = body.mode === "google-hook" ? rows.length : rows.length * Number(body.maxScenes || 1);
    const ok = confirmCreditSpend(
      "Run Auto with Google Vids unlocked",
      `Rows: ${rows.join(", ")}. Estimate: about ${clips} Google Vids scene job${clips === 1 ? "" : "s"}. Failed generations may still consume quota.`
    );
    if (!ok) return;
  }
  state.autoQueueLogCursors.clear();
  state.autoQueueProgressWorkbook = "";
  setAutoQueueState("Starting", "busy");
  setAutoQueueBusy(true);
  setTask("Auto queue starting", `${body.queueLimit} video(s) from row ${body.startRow}`, "busy");
  setTerminalStatus("Starting auto queue");
  appendTerminal(`POST /api/queues startRow=${body.startRow} limit=${body.queueLimit} mode=${body.mode}`);
  const data = await readJsonApi("/api/queues", {
    method: "POST",
    body: JSON.stringify(body)
  });
  state.activeAutoQueueId = data.queue.id;
  renderAutoQueue(data.queue);
  await pollAutoQueue();
}

async function stopAutoQueue() {
  if (!state.activeAutoQueueId) return;
  setAutoQueueState("Stopping", "busy");
  setTask("Stopping auto queue", state.activeAutoQueueId, "busy");
  setTerminalStatus("Stopping auto queue");
  appendTerminal(`POST /api/queues/${state.activeAutoQueueId}/stop`);
  const data = await readJsonApi(`/api/queues/${encodeURIComponent(state.activeAutoQueueId)}/stop`, {
    method: "POST",
    body: "{}"
  });
  renderAutoQueue(data.queue);
}

async function openAutoProgressWorkbook() {
  if (!state.autoQueueProgressWorkbook) return;
  appendTerminal(`POST /api/open ${state.autoQueueProgressWorkbook}`);
  const data = await readJsonApi("/api/open", {
    method: "POST",
    body: JSON.stringify({ path: state.autoQueueProgressWorkbook })
  });
  setTask("Progress workbook opened", data.path || state.autoQueueProgressWorkbook, "success");
  setTerminalStatus("Progress workbook opened");
}

async function openAutomationOutput(outputPath, label = "Output") {
  if (!outputPath) return;
  appendTerminal(`POST /api/open ${outputPath}`);
  const data = await readJsonApi("/api/open", {
    method: "POST",
    body: JSON.stringify({ path: outputPath })
  });
  setTask(`${label} opened`, data.path || outputPath, "success");
  setTerminalStatus(`${label} opened`);
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

els.refreshDocsBtn?.addEventListener("click", () => {
  loadDocs().catch((error) => {
    setDocState("Failed", "error");
    if (els.docContent) {
      els.docContent.textContent = error.message;
    }
    appendTerminal(error.message, "stderr");
  });
});

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

els.docToc?.addEventListener("click", (event) => {
  const link = event.target.closest(".toc-link");
  if (!link) return;
  event.preventDefault();
  const target = els.docContent.querySelector(link.getAttribute("href"));
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

for (const docsLink of document.querySelectorAll('a[href="#docsSection"]')) {
  docsLink.addEventListener("click", () => {
    activeStep("docs");
    if (!state.docs.length) {
      loadDocs().catch((error) => {
        setDocState("Failed", "error");
        if (els.docContent) {
          els.docContent.textContent = error.message;
        }
      });
    }
  });
}

els.toolSelect.addEventListener("change", () => {
  if (els.toolSelect.value) {
    els.assetRowInput.value = els.toolSelect.value;
  }
  updateSelectedTool();
  activeStep("select");
});

els.toolSearchInput.addEventListener("input", () => {
  state.toolRowRenderLimit = TOOL_ROW_RENDER_BATCH;
  const matches = filterTools(els.toolSearchInput.value);
  renderToolOptions(matches);
  setTerminalStatus(`${matches.length} tool match${matches.length === 1 ? "" : "es"}`);
});

for (const filterInput of [
  els.toolReadyOnlyFilter,
  els.toolNoVideoFilter,
  els.toolP0Filter
].filter(Boolean)) {
  filterInput.addEventListener("change", () => {
    state.toolFilters = currentToolFilters();
    state.toolRowRenderLimit = TOOL_ROW_RENDER_BATCH;
    const matches = filterTools(els.toolSearchInput?.value || "");
    renderToolOptions(matches);
    updateSelectedTool();
    setTerminalStatus(`Tool filters: ${matches.length} row(s) visible`);
  });
}

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

els.useFemaleAvatarPhotoBtn?.addEventListener("click", () => {
  if (els.hookPresenterSelect) {
    els.hookPresenterSelect.value = "female";
  }
  setAvatarHostImage(avatarPhotoForPresenter("female"), "Default AltFTool female avatar");
  setHookState("Female avatar selected", "idle");
  setTerminalStatus("Avatar photo: default female");
});

els.useMaleAvatarPhotoBtn?.addEventListener("click", () => {
  if (els.hookPresenterSelect) {
    els.hookPresenterSelect.value = "male";
  }
  setAvatarHostImage(avatarPhotoForPresenter("male"), "Default AltFTool male avatar");
  setHookState("Male avatar selected", "idle");
  setTerminalStatus("Avatar photo: default male");
});

els.clearAvatarPhotoBtn?.addEventListener("click", () => {
  setAvatarHostImage("", "No avatar photo");
  setHookState("Avatar photo cleared", "idle");
  setTerminalStatus("Avatar photo cleared");
});

els.resetHookAvatarScriptBtn?.addEventListener("click", () => {
  resetAvatarScriptEditors();
  setHookState("Avatar script reset", "idle");
  setTerminalStatus("Avatar script reset to prepared draft");
});

for (const editor of [
  els.hookAvatarHookScriptEditor,
  els.hookAvatarFocusScriptEditor,
  els.hookAvatarCtaScriptEditor
].filter(Boolean)) {
  editor.addEventListener("input", () => {
    state.avatarScriptUserEdited = true;
    collectAvatarScriptDraft();
    if (els.hookAvatarScriptReviewStatus) {
      els.hookAvatarScriptReviewStatus.textContent = "Edited avatar script ready. Generate will use this text.";
    }
    setHookState("Avatar script edited", "idle");
  });
}

els.hookAvatarPhotoInput?.addEventListener("change", async () => {
  const file = els.hookAvatarPhotoInput.files?.[0];
  if (!file) return;
  try {
    await uploadAvatarPhoto(file);
    setHookState("Custom avatar selected", "success");
  } catch (error) {
    setHookState("Avatar upload failed", "error");
    setTask("Avatar upload failed", error.message, "error");
    appendTerminal(error.message, "stderr");
  } finally {
    els.hookAvatarPhotoInput.value = "";
  }
});

els.finalVoiceProviderSelect?.addEventListener("change", () => {
  if (creditSafeEnabled() && ["openai", "elevenlabs"].includes(els.finalVoiceProviderSelect.value || "")) {
    els.finalVoiceProviderSelect.value = "free";
    setTask("Credit Safe voice guard", "Paid/API voice blocked. Free voice selected.", "success");
    appendTerminal("Credit Safe blocked paid/API voice provider selection.", "stdout");
  }
  setFinalState(`${els.finalVoiceProviderSelect.value} voice`, "idle");
  setTerminalStatus(`Final voice provider: ${els.finalVoiceProviderSelect.value}`);
  renderCreditGuard();
  renderFinalReview();
});

const globalProfileControls = new Set([
  els.hookPrimaryProfileSelect,
  els.hookFallbackProfileSelect,
  els.hookFallbackEnabled,
  els.customScriptPrimaryProfileSelect,
  els.customScriptFallbackProfileSelect,
  els.customScriptFallbackEnabled
].filter(Boolean));

for (const control of [
  els.hookPresenterSelect,
  els.hookCharacterSelect,
  els.hookToneSelect,
  els.hookDurationSelect,
  els.hookVideoSizeSelect,
  els.lowCreditVidsMode,
  els.hookPrimaryProfileSelect,
  els.hookFallbackProfileSelect,
  els.hookFallbackEnabled,
  els.customScriptPresenterSelect,
  els.customScriptAvatarSelect,
  els.customScriptPrimaryProfileSelect,
  els.customScriptFallbackProfileSelect,
  els.customScriptFallbackEnabled,
  els.customScriptLanguageSelect,
  els.customScriptDurationSelect,
  els.customScriptVideoSizeSelect
].filter(Boolean)) {
  control.addEventListener("change", () => {
    if (control === els.hookPresenterSelect) {
      syncDefaultAvatarPhotoWithPresenter({ persist: false });
    }
    if (globalProfileControls.has(control)) {
      const source = [
        els.customScriptPrimaryProfileSelect,
        els.customScriptFallbackProfileSelect,
        els.customScriptFallbackEnabled
      ].includes(control) ? "script-video" : "hook";
      syncGlobalProfiles(source);
    }
    setHookState("Ready", "idle");
    setHookBusy(false);
    setScriptVideoState("Ready", "idle");
    setScriptVideoBusy(false);
    renderFinalReview();
    setTerminalStatus(`Hook setup: ${els.hookPresenterSelect.value}, ${hookCharacterLabel(els.hookCharacterSelect?.value)}, ${els.hookToneSelect.value}, ${els.hookDurationSelect.value}s, ${els.hookVideoSizeSelect?.value || "portrait"}`);
    if (!globalProfileControls.has(control)) {
      renderHookProfileStatus();
      renderProfileManager();
      saveHookSettings().catch((error) => {
        appendTerminal(error.message, "stderr");
      });
    }
  });
}

els.hookFallbackEnabled?.addEventListener("change", () => {
  if (els.hookFallbackProfileSelect) {
    els.hookFallbackProfileSelect.disabled = !els.hookFallbackEnabled.checked;
  }
  if (els.customScriptFallbackProfileSelect) {
    els.customScriptFallbackProfileSelect.disabled = !els.customScriptFallbackEnabled?.checked;
  }
  renderHookProfileStatus();
  renderProfileManager();
  renderFinalReview();
});

els.customScriptFallbackEnabled?.addEventListener("change", () => {
  if (els.customScriptFallbackProfileSelect) {
    els.customScriptFallbackProfileSelect.disabled = !els.customScriptFallbackEnabled.checked;
  }
  setScriptVideoBusy(false);
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

els.openProfileRegistryBtn?.addEventListener("click", async () => {
  try {
    await openProfileRegistryExcel();
  } catch (error) {
    setProfileState("Excel open failed", "error");
    setTask("Profile Excel failed", error.message, "error");
    setTerminalStatus("Profile Excel failed");
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
      const selectedProfile = profileByPath(profile);
      if (!selectedProfile || !isHookProfileSelectable(selectedProfile)) {
        throw new Error("Ye profile selectable nahi hai. Disabled/limit-used profile ke bajay doosra profile choose karo.");
      }
      els.hookPrimaryProfileSelect.value = profile;
      renderHookProfileOptions({ primary: profile, fallback: els.hookFallbackProfileSelect?.value || "" });
      syncGlobalProfiles("hook");
      setTerminalStatus(`Primary profile: ${profile}`);
      activeStep("profile");
      return;
    }
    if (action === "fallback") {
      const selectedProfile = profileByPath(profile);
      if (!selectedProfile || !isHookProfileSelectable(selectedProfile)) {
        throw new Error("Ye fallback selectable nahi hai. Disabled/limit-used profile ke bajay doosra profile choose karo.");
      }
      if (profile === els.hookPrimaryProfileSelect?.value) {
        throw new Error("Fallback primary profile se alag hona chahiye.");
      }
      if (els.hookFallbackEnabled) {
        els.hookFallbackEnabled.checked = true;
      }
      if (els.hookFallbackProfileSelect) {
        els.hookFallbackProfileSelect.disabled = false;
        els.hookFallbackProfileSelect.value = profile;
      }
      syncGlobalProfiles("hook");
      setTerminalStatus(`Fallback profile: ${profile}`);
      activeStep("profile");
      return;
    }
    if (action === "login") {
      await loginHookProfile(profile);
      return;
    }
    if (action === "toggle") {
      await toggleHookProfile(profile, button.dataset.enabled === "true");
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
  if (!applyExistingAssetsFromArtifacts()) return;
  setTask("Old assets selected", state.lastAssetFolder || "Existing assets selected", "success");
});

els.generateNewAssetsBtn.addEventListener("click", runAssetBuildFromUi);

els.useExistingScriptBtn.addEventListener("click", () => {
  if (!applyExistingScriptFromArtifacts()) return;
  setTask("Old script selected", state.lastScriptFolder || "Existing script selected", "success");
});

els.useExistingHookBtn?.addEventListener("click", () => {
  if (!applyExistingHookFromArtifacts()) return;
  setTask(
    state.lastHookAvatarVideo ? "Old avatar video selected" : "Old avatar prompt selected",
    state.lastHookAvatarVideo || state.lastHookAvatarFolder || "Existing avatar selected",
    "success"
  );
});

els.loadResumeArtifactBtn?.addEventListener("click", async () => {
  try {
    await loadSelectedResumeArtifact();
  } catch (error) {
    setTask("Saved version load failed", error.message, "error");
    setTerminalStatus("Resume load failed");
    appendTerminal(error.message, "stderr");
  }
});

els.openResumeArtifactBtn?.addEventListener("click", async () => {
  try {
    await openSelectedResumeArtifact();
  } catch (error) {
    setTask("Saved folder open failed", error.message, "error");
    setTerminalStatus("Resume folder open failed");
    appendTerminal(error.message, "stderr");
  }
});

els.jumpToAvatarStepBtn?.addEventListener("click", () => {
  const hydrated = hydrateResumeStateFromArtifacts({ includeHook: false });
  if (!hydrated.usedScript) {
    setTask("Script required", "Avatar step ke liye pehle script generate/select karo.", "error");
    setHookState("Script needed", "error");
    return;
  }
  setHookBusy(false);
  setFinalBusy(false);
  setTask("Resume from Avatar Step", "Old assets/script ready. Ab avatar pack generate karo.", "success");
  setTerminalStatus("Resume: avatar step ready");
  scrollToWorkflowStep("hook");
});

els.jumpToFinalStepBtn?.addEventListener("click", () => {
  const hydrated = hydrateResumeStateFromArtifacts({ includeHook: true });
  if (!hydrated.usedScript) {
    setTask("Script required", "Final render ke liye pehle script generate/select karo.", "error");
    setFinalState("Script needed", "error");
    return;
  }
  setFinalState(hydrated.usedHookVideo ? "Ready after avatar" : "Ready, avatar optional", "idle");
  setFinalBusy(false);
  setTask(
    "Resume from Final Step",
    hydrated.usedHookVideo ? "Old avatar video selected. Render Final Reel click karo." : "Avatar video missing hai, but local fallback se render kar sakte ho.",
    "success"
  );
  setTerminalStatus("Resume: final render ready");
  scrollToWorkflowStep("final");
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

els.customScriptInput?.addEventListener("input", () => {
  setScriptVideoState(els.customScriptInput.value.trim() ? "Ready" : "Waiting", els.customScriptInput.value.trim() ? "idle" : "idle");
  setScriptVideoBusy(false);
});

els.customScriptTitleInput?.addEventListener("input", () => {
  setScriptVideoState("Ready", "idle");
  setScriptVideoBusy(false);
});

els.customScriptOptimizeBtn?.addEventListener("click", async () => {
  try {
    await optimizeCustomScriptVideo();
  } catch (error) {
    setScriptVideoState("Failed", "error");
    setTask("Script optimize failed", error.message, "error");
    setTerminalStatus("Script video optimize failed");
    appendTerminal(error.message, "stderr");
    els.scriptVideoResult?.classList.remove("is-hidden");
    setScriptVideoBusy(false);
  }
});

els.customScriptGenerateBtn?.addEventListener("click", async () => {
  try {
    await generateCustomScriptVideo();
  } catch (error) {
    setScriptVideoState("Failed", "error");
    setTask("Script video failed", error.message, "error");
    setTerminalStatus("Script video generation failed");
    appendTerminal(error.message, "stderr");
    els.scriptVideoResult?.classList.remove("is-hidden");
    setScriptVideoBusy(false);
  }
});

els.customScriptOpenFolderBtn?.addEventListener("click", async () => {
  try {
    await openLatestScriptVideoFolder();
  } catch (error) {
    setScriptVideoState("Open failed", "error");
    setTask("Script video folder failed", error.message, "error");
    setTerminalStatus("Script video folder open failed");
    appendTerminal(error.message, "stderr");
  }
});

els.editScriptBtn?.addEventListener("click", () => {
  if (!state.currentScriptBuild) return;
  renderScriptEditor(state.currentScriptBuild);
  if (els.scriptEditorPanel) {
    els.scriptEditorPanel.open = true;
    els.scriptEditorPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  setTask("Script editor open", "Modify text, then Save Update.", "idle");
  setTerminalStatus("Script editor ready");
});

els.resetScriptEditorBtn?.addEventListener("click", () => {
  if (!state.currentScriptBuild) return;
  renderScriptEditor(state.currentScriptBuild);
  setTask("Script editor reset", "Latest saved script restored in editor.", "idle");
  setTerminalStatus("Script editor reset");
});

els.saveScriptBtn?.addEventListener("click", async () => {
  try {
    await saveUpdatedScript();
  } catch (error) {
    setScriptState("Save failed", "error");
    setTask("Script save failed", error.message, "error");
    setTerminalStatus("Script update failed");
    appendTerminal(error.message, "stderr");
    setScriptBusy(false);
  }
});

for (const editor of [
  els.scriptHookEditor,
  els.scriptBodyEditor,
  els.scriptCtaEditor,
  els.scriptCaptionEditor,
  els.scriptHashtagsEditor
].filter(Boolean)) {
  editor.addEventListener("input", markMainScriptEdited);
}

els.scriptSceneEditorList?.addEventListener("input", markMainScriptEdited);

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

els.previewFinalReelBtn?.addEventListener("click", async () => {
  try {
    await renderFinalReel({ preview: true, previewSeconds: 15, previewScenes: 2 });
  } catch (error) {
    setFinalState("Preview failed", "error");
    setTask("Preview failed", error.message, "error");
    setTerminalStatus("Preview render failed");
    appendTerminal(error.message, "stderr");
    els.finalResult?.classList.remove("is-hidden");
    setFinalBusy(false);
  }
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

els.runStepFlowBtn?.addEventListener("click", async () => {
  await runStepFlow();
});

els.stopStepFlowBtn?.addEventListener("click", () => {
  if (!state.stepFlowRunning) return;
  state.stepFlowStopRequested = true;
  refreshStepFlowControls();
  setStepFlowState("Stopping", "busy");
  if (els.stepFlowStatus) {
    els.stepFlowStatus.textContent = "Current step complete hone ke baad flow stop ho jayega.";
  }
  setTask("Step flow stopping", "Current step finish hone do, next step skip hoga.", "busy");
  setTerminalStatus("Step flow stop requested");
  appendTerminal("Step flow stop requested. Current step will finish first.", "stdout");
});

els.autoRunQueueBtn?.addEventListener("click", async () => {
  try {
    await startAutoQueue();
  } catch (error) {
    setAutoQueueState("Failed", "error");
    setAutoQueueBusy(false);
    setTask("Auto queue failed", error.message, "error");
    setTerminalStatus("Auto queue failed");
    appendTerminal(error.message, "stderr");
    if (els.autoQueueMeta) {
      els.autoQueueMeta.textContent = error.message;
    }
  }
});

els.autoStopQueueBtn?.addEventListener("click", async () => {
  try {
    await stopAutoQueue();
  } catch (error) {
    setAutoQueueState("Stop failed", "error");
    setTask("Stop failed", error.message, "error");
    setTerminalStatus("Auto queue stop failed");
    appendTerminal(error.message, "stderr");
  }
});

els.autoOpenProgressBtn?.addEventListener("click", async () => {
  try {
    await openAutoProgressWorkbook();
  } catch (error) {
    setAutoQueueState("Open failed", "error");
    setTask("Progress open failed", error.message, "error");
    setTerminalStatus("Progress workbook open failed");
    appendTerminal(error.message, "stderr");
  }
});

els.autoQueueList?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-open-output-path]");
  if (!button) return;
  try {
    await openAutomationOutput(button.dataset.openOutputPath || "", button.dataset.openOutputLabel || "Output");
  } catch (error) {
    setTask("Output open failed", error.message, "error");
    setTerminalStatus("Output open failed");
    appendTerminal(error.message, "stderr");
  }
});

els.toolRowChecklist?.addEventListener("click", (event) => {
  const folderButton = event.target.closest("[data-open-video-folder]");
  if (folderButton) {
    event.preventDefault();
    event.stopPropagation();
    openAutomationOutput(folderButton.dataset.openVideoFolder || "", "Video folder").catch((error) => {
      setTask("Video folder open failed", error.message, "error");
      setTerminalStatus("Video folder open failed");
      appendTerminal(error.message, "stderr");
    });
    return;
  }
  const button = event.target.closest("[data-select-row]");
  if (!button) return;
  const row = Number(button.dataset.selectRow || 0);
  if (!Number.isInteger(row) || row < 2) return;
  els.assetRowInput.value = String(row);
  els.toolSelect.value = String(row);
  updateSelectedTool();
  updateToolDropdownSummary();
  if (els.toolIdeaDropdown) {
    els.toolIdeaDropdown.open = false;
  }
});

els.loadMoreToolRowsBtn?.addEventListener("click", () => {
  state.toolRowRenderLimit += TOOL_ROW_RENDER_BATCH;
  renderToolRowChecklist();
  updateToolDropdownSummary();
  setTerminalStatus(`Showing ${Math.min(state.toolRowRenderLimit, state.filteredTools.length)} tool rows`);
});

els.autoProfileList?.addEventListener("change", (event) => {
  const input = event.target.closest("input[data-auto-profile]");
  if (!input) return;
  const profilePath = input.dataset.autoProfile || "";
  if (!profilePath) return;
  if (!state.autoProfilesTouched && !state.selectedAutoProfiles.size) {
    for (const profile of defaultAutomationProfilePaths()) {
      state.selectedAutoProfiles.add(profile);
    }
  }
  state.autoProfilesTouched = true;
  if (input.checked) {
    const selected = selectedAutomationProfiles();
    if (selected.length >= AUTO_PROFILE_LIMIT && !state.selectedAutoProfiles.has(profilePath)) {
      input.checked = false;
      setTask("Profile limit", `Auto Run me max ${AUTO_PROFILE_LIMIT} profiles select kar sakte ho.`, "error");
      setTerminalStatus("Auto profile limit reached");
      appendTerminal(`Auto profile limit: max ${AUTO_PROFILE_LIMIT}`, "stderr");
      return;
    }
    state.selectedAutoProfiles.add(profilePath);
  } else {
    state.selectedAutoProfiles.delete(profilePath);
  }
  renderAutoProfileChecklist();
  updateAutoQueueHint();
  renderFinalReview();
});

for (const autoInput of [
  els.autoVideoCount,
  els.autoRowsInput,
  els.autoStartSelectedRow,
  els.autoUseVidsHook,
  els.autoUpdateWorkbook,
  els.creditSafeMode,
  els.lowCreditVidsMode
].filter(Boolean)) {
  autoInput.addEventListener("input", updateAutoQueueHint);
  autoInput.addEventListener("change", () => {
    updateAutoQueueHint();
    setHookBusy(false);
    setFinalBusy(false);
    setScriptVideoBusy(false);
    state.stepFlowSteps = stepFlowPlan().map((step) => ({ ...step, status: "pending" }));
    refreshStepFlowControls();
    renderStepFlowTimeline();
  });
}

for (const flowInput of [
  els.flowRunAssets,
  els.flowRunScript,
  els.flowRunAvatar,
  els.flowUseVidsAvatar,
  els.flowRunVidsVoiceover,
  els.flowRunFinal
].filter(Boolean)) {
  flowInput.addEventListener("change", () => {
    state.stepFlowSteps = stepFlowPlan().map((step) => ({ ...step, status: "pending" }));
    refreshStepFlowControls();
    renderStepFlowTimeline();
    renderCampaignCreditEstimate();
    setTerminalStatus(`Step flow selected: ${stepFlowPlan().map((step) => step.label).join(", ") || "none"}`);
  });
}

for (const dropdown of document.querySelectorAll(".checkbox-dropdown")) {
  dropdown.addEventListener("toggle", () => {
    if (!dropdown.open) return;
    for (const other of document.querySelectorAll(".checkbox-dropdown[open]")) {
      if (other !== dropdown) {
        other.open = false;
      }
    }
  });
}

document.addEventListener("click", (event) => {
  if (event.target.closest(".checkbox-dropdown")) return;
  for (const dropdown of document.querySelectorAll(".checkbox-dropdown[open]")) {
    dropdown.open = false;
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

for (const button of els.workspaceTabButtons || []) {
  button.addEventListener("click", () => {
    const tab = button.dataset.workspaceTabButton || "tool-promo";
    setWorkspaceTab(tab, { persist: true, smooth: true });
    setTerminalStatus(`Flow tab: ${tab}`);
    appendTerminal(`Switched flow tab: ${tab}`);
  });
}

els.manageProfilesTabBtn?.addEventListener("click", () => {
  setWorkspaceTab("profiles", { persist: true, smooth: true });
  activeStep("profile");
});

window.addEventListener("hashchange", () => {
  const tab = workspaceTabForHash(window.location.hash);
  if (tab) {
    setWorkspaceTab(tab, { persist: true });
  }
});

for (const [link, step] of [
  [els.loadStepLink, "load"],
  [els.selectStepLink, "select"],
  [els.assetStepLink, "asset"],
  [els.scriptStepLink, "script"],
  [els.hookStepLink, "hook"],
  [els.finalStepLink, "final"],
  [els.scriptVideoStepLink, "script-video"],
  [els.profileStepLink, "profile"]
]) {
  link?.addEventListener("click", () => {
    activeStep(step);
    setWorkspaceTab(workspaceTabFromStep(step), { persist: true });
  });
}

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

applyTheme(readSavedTheme());
const initialWorkspaceTab = workspaceTabForHash(window.location.hash) || readSavedWorkspaceTab() || "tool-promo";
setWorkspaceTab(initialWorkspaceTab, { persist: false });
activeStep(initialWorkspaceTab === "profiles" ? "profile" : initialWorkspaceTab === "script-video" ? "script-video" : "load");
renderFinalPipeline([]);
renderScriptVideoPipeline([]);
renderHookCharacterOptions([{ label: "Google Vids auto", value: "auto" }], "auto_by_reel");
refreshAutoQueueControls();
refreshStepFlowControls();
setScriptVideoBusy(false);
updateAutoQueueHint();
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
loadDocs().catch((error) => {
  setDocState("Failed", "error");
  if (els.docContent) {
    els.docContent.textContent = error.message;
  }
  appendTerminal(error.message, "stderr");
});
