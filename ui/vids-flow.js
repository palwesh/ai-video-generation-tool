const CREDIT_WORD = "VIDS";
const RUN_TIMEOUT_MS = 30 * 60 * 1000;
const IDEA_LIST_LIMIT = 500;

const els = {
  taskNotice: document.getElementById("vfTaskNotice"),
  taskName: document.getElementById("vfTaskName"),
  taskDetail: document.getElementById("vfTaskDetail"),
  state: document.getElementById("vfState"),
  inputPath: document.getElementById("vfInputPath"),
  loadDefaultBtn: document.getElementById("vfLoadDefaultBtn"),
  loadIdeasBtn: document.getElementById("vfLoadIdeasBtn"),
  toolSelect: document.getElementById("vfToolSelect"),
  rowInput: document.getElementById("vfRowInput"),
  readyOnly: document.getElementById("vfReadyOnly"),
  toolMeta: document.getElementById("vfToolMeta"),
  assetState: document.getElementById("vfAssetState"),
  buildAssetsBtn: document.getElementById("vfBuildAssetsBtn"),
  openAssetsBtn: document.getElementById("vfOpenAssetsBtn"),
  assetResult: document.getElementById("vfAssetResult"),
  scriptState: document.getElementById("vfScriptState"),
  language: document.getElementById("vfLanguage"),
  sceneCount: document.getElementById("vfSceneCount"),
  generateScriptBtn: document.getElementById("vfGenerateScriptBtn"),
  openScriptBtn: document.getElementById("vfOpenScriptBtn"),
  scriptResult: document.getElementById("vfScriptResult"),
  avatarState: document.getElementById("vfAvatarState"),
  presenter: document.getElementById("vfPresenter"),
  tone: document.getElementById("vfTone"),
  videoSize: document.getElementById("vfVideoSize"),
  primaryProfile: document.getElementById("vfPrimaryProfile"),
  fallbackProfile: document.getElementById("vfFallbackProfile"),
  creditSafe: document.getElementById("vfCreditSafe"),
  lowCredit: document.getElementById("vfLowCredit"),
  creditNotice: document.getElementById("vfCreditNotice"),
  avatarScriptPanel: document.getElementById("vfAvatarScriptPanel"),
  avatarScriptMeta: document.getElementById("vfAvatarScriptMeta"),
  avatarHookScript: document.getElementById("vfAvatarHookScript"),
  avatarFocusScript: document.getElementById("vfAvatarFocusScript"),
  avatarCtaScript: document.getElementById("vfAvatarCtaScript"),
  avatarScriptStatus: document.getElementById("vfAvatarScriptStatus"),
  resetAvatarScriptBtn: document.getElementById("vfResetAvatarScriptBtn"),
  prepareAvatarBtn: document.getElementById("vfPrepareAvatarBtn"),
  generateAvatarBtn: document.getElementById("vfGenerateAvatarBtn"),
  openAvatarBtn: document.getElementById("vfOpenAvatarBtn"),
  avatarResult: document.getElementById("vfAvatarResult"),
  hookPreview: document.getElementById("vfHookPreview"),
  renderState: document.getElementById("vfRenderState"),
  quickPreviewBtn: document.getElementById("vfQuickPreviewBtn"),
  renderFinalBtn: document.getElementById("vfRenderFinalBtn"),
  openFinalBtn: document.getElementById("vfOpenFinalBtn"),
  autoAssets: document.getElementById("vfAutoAssets"),
  autoScript: document.getElementById("vfAutoScript"),
  autoPrepare: document.getElementById("vfAutoPrepare"),
  autoGenerate: document.getElementById("vfAutoGenerate"),
  autoPreview: document.getElementById("vfAutoPreview"),
  autoFinal: document.getElementById("vfAutoFinal"),
  runFlowBtn: document.getElementById("vfRunFlowBtn"),
  timeline: document.getElementById("vfTimeline"),
  finalResult: document.getElementById("vfFinalResult"),
  finalPreview: document.getElementById("vfFinalPreview"),
  terminalStatus: document.getElementById("vfTerminalStatus"),
  terminal: document.getElementById("vfTerminal"),
  clearTerminalBtn: document.getElementById("vfClearTerminalBtn")
};

const state = {
  inputPath: "",
  tools: [],
  profiles: [],
  selectedRow: 2,
  selectedTool: null,
  lastAssetFolder: "",
  lastAssetRow: 0,
  lastScriptFolder: "",
  lastScriptRow: 0,
  lastHookFolder: "",
  lastHookVideo: "",
  lastHookRow: 0,
  avatarScriptDraft: null,
  avatarScriptPreparedDraft: null,
  avatarScriptPreparedRow: 0,
  lastFinalFolder: "",
  lastFinalVideo: "",
  lastFinalRow: 0,
  lastVidsVoiceoverFolder: "",
  lastVidsVoiceoverExport: "",
  lastVidsVoiceoverRow: 0,
  running: false
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fileUrl(filePath) {
  return filePath ? `/file?path=${encodeURIComponent(filePath)}` : "";
}

function appendTerminal(text, stream = "system") {
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const prefix = stream === "stderr" ? "ERR" : stream === "stdout" ? "OUT" : "SYS";
  els.terminal.textContent += `\n[${now}] ${prefix} ${text}`;
  els.terminal.scrollTop = els.terminal.scrollHeight;
}

function setTerminalStatus(text) {
  els.terminalStatus.textContent = String(text || "Idle").slice(0, 220);
}

function setTask(name, detail = "", tone = "idle") {
  els.taskName.textContent = name || "Flow ready";
  els.taskDetail.textContent = detail || "Select row, then run steps one by one";
  els.taskNotice.dataset.tone = tone;
  setTerminalStatus(detail || name);
}

function setState(el, label, tone = "idle") {
  el.textContent = label;
  el.dataset.tone = tone;
}

function setStep(step, status, detail = "") {
  const link = document.querySelector(`[data-step="${step}"]`);
  if (!link) return;
  link.classList.toggle("active", status === "running");
  link.classList.toggle("busy", status === "running");
  link.classList.toggle("done", status === "complete");
  const small = link.querySelector("small");
  if (small && detail) {
    small.textContent = detail;
  }
}

function renderTimeline(items = []) {
  if (!items.length) {
    els.timeline.innerHTML = '<span data-status="idle">Waiting for flow start.</span>';
    return;
  }
  els.timeline.innerHTML = items.map((item) => (
    `<span data-status="${escapeHtml(item.status || "idle")}"><strong>${escapeHtml(item.label || item.id || "Step")}</strong><small>${escapeHtml(item.detail || "")}</small></span>`
  )).join("");
}

async function readJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `${url} failed with ${response.status}`);
  }
  return data;
}

function selectedProfiles() {
  return [
    els.primaryProfile.value,
    els.fallbackProfile.value
  ].filter(Boolean).filter((item, index, list) => list.indexOf(item) === index);
}

function selectedTool() {
  const row = Number(els.rowInput.value || 0);
  return state.tools.find((tool) => Number(tool.row || tool.source_row_number) === row) || null;
}

function currentFlowRow() {
  return Number(els.rowInput.value || state.selectedRow || 0);
}

function isCurrentFlowRow(row) {
  return Number(row || 0) === currentFlowRow();
}

function clearFlowOutputsForRow(row) {
  if (state.selectedRow === row) {
    return;
  }
  state.lastAssetFolder = "";
  state.lastAssetRow = 0;
  state.lastScriptFolder = "";
  state.lastScriptRow = 0;
  state.lastHookFolder = "";
  state.lastHookVideo = "";
  state.lastHookRow = 0;
  state.lastFinalFolder = "";
  state.lastFinalVideo = "";
  state.lastFinalRow = 0;
  state.lastVidsVoiceoverFolder = "";
  state.lastVidsVoiceoverExport = "";
  state.lastVidsVoiceoverRow = 0;
  state.avatarScriptDraft = null;
  state.avatarScriptPreparedDraft = null;
  state.avatarScriptPreparedRow = 0;
  els.openAssetsBtn.disabled = true;
  els.openScriptBtn.disabled = true;
  els.openAvatarBtn.disabled = true;
  els.openFinalBtn.disabled = true;
  els.hookPreview?.classList.add("is-hidden");
  els.finalPreview?.classList.add("is-hidden");
}

function payloadBase(extra = {}) {
  const row = Number(els.rowInput.value || 0);
  if (!state.inputPath) {
    throw new Error("Excel path load karo.");
  }
  if (!Number.isFinite(row) || row < 2) {
    throw new Error("Valid row select karo.");
  }
  const tool = selectedTool() || {};
  const profiles = selectedProfiles();
  const sameRowVidsVoiceover = Number(state.lastVidsVoiceoverRow || 0) === row;
  const sameRowAssets = Number(state.lastAssetRow || 0) === row;
  const sameRowScript = Number(state.lastScriptRow || 0) === row;
  const sameRowHook = Number(state.lastHookRow || 0) === row;
  const vidsVoiceoverFolder = sameRowVidsVoiceover ? state.lastVidsVoiceoverFolder || "" : "";
  const vidsVoiceoverExport = sameRowVidsVoiceover ? state.lastVidsVoiceoverExport || "" : "";
  return {
    input: state.inputPath,
    row,
    toolName: tool.name || tool.tool_name || "",
    toolUrl: tool.url || tool.tool_url || "",
    scriptLanguage: els.language.value || "Hinglish",
    presenter: els.presenter.value || "female",
    hookAvatarStyle: els.presenter.value || "female",
    avatar: "auto_by_reel",
    avatarLabel: "Auto by reel",
    tone: els.tone.value || "energetic",
    durationSeconds: 10,
    focusDurationSeconds: 10,
    ctaDurationSeconds: 10,
    videoSize: els.videoSize.value || "portrait",
    hookVideoSize: els.videoSize.value || "portrait",
    lowCreditVidsMode: els.lowCredit.checked,
    includeMiddleAvatar: !els.lowCredit.checked,
    middleAvatarScenes: els.lowCredit.checked ? "" : "2",
    includeCtaAvatar: !els.lowCredit.checked,
    profile: profiles[0] || "",
    primaryProfile: profiles[0] || "",
    fallbackProfile: profiles[1] || "",
    fallbackEnabled: Boolean(profiles[1]),
    profiles,
    creditSafeMode: els.creditSafe.checked,
    assetsDir: sameRowAssets ? state.lastAssetFolder : "",
    scriptDir: sameRowScript ? state.lastScriptFolder : "",
    hookAvatarFolder: sameRowHook ? state.lastHookFolder : "",
    hookAvatarVideo: sameRowHook ? state.lastHookVideo : "",
    voiceoverDir: vidsVoiceoverFolder,
    vidsVoiceoverDir: vidsVoiceoverFolder,
    voiceoverSourceVideo: vidsVoiceoverExport,
    lastVidsVoiceoverExport: vidsVoiceoverExport,
    ...avatarScriptOverridesPayload(),
    ...extra
  };
}

function renderCreditGuard() {
  const safe = els.creditSafe.checked;
  const low = els.lowCredit.checked;
  els.creditNotice.dataset.tone = safe ? "safe" : "armed";
  els.creditNotice.innerHTML = safe
    ? "<strong>Credit Safe ON</strong><span>Prepare prompts only. Google Vids generation is locked.</span>"
    : `<strong>${low ? "Low-credit Vids" : "Full Vids Pack"}</strong><span>${low ? "Only hook clip is planned." : "Hook, focus, and CTA can generate."} Type VIDS before generation.</span>`;
  els.generateAvatarBtn.disabled = safe || state.running;
  els.avatarState.textContent = safe ? "Credit Safe" : (low ? "Hook only" : "Full pack");
}

function renderProfiles() {
  const profiles = state.profiles || [];
  const options = profiles.length
    ? profiles.map((profile) => {
      const label = [
        profile.label || profile.name || profile.path,
        profile.statusLabel || profile.status || ""
      ].filter(Boolean).join(" - ");
      return `<option value="${escapeHtml(profile.path)}">${escapeHtml(label)}</option>`;
    }).join("")
    : '<option value="">No profile found</option>';
  els.primaryProfile.innerHTML = options;
  els.fallbackProfile.innerHTML = `<option value="">No fallback</option>${options}`;
}

function toolPassesFilter(tool) {
  if (!els.readyOnly.checked) return true;
  const status = String(tool.status || "").toLowerCase();
  return status.includes("built") || status.includes("ready") || status.includes("api check");
}

function renderTools() {
  const tools = state.tools.filter(toolPassesFilter);
  if (!tools.length) {
    els.toolSelect.innerHTML = '<option value="">No tool rows found</option>';
    return;
  }
  els.toolSelect.innerHTML = [
    '<option value="">Choose tool idea name</option>',
    ...tools.map((tool) => {
      const row = Number(tool.row || tool.source_row_number || 0);
      const label = `Row ${row} - ${tool.name || tool.tool_name || "Tool"}`;
      return `<option value="${escapeHtml(row)}">${escapeHtml(label)}</option>`;
    })
  ].join("");
  if (state.selectedRow) {
    els.toolSelect.value = String(state.selectedRow);
  }
}

function updateToolSelection(rowValue) {
  const row = Number(rowValue || els.rowInput.value || 0);
  if (!Number.isFinite(row) || row < 2) return;
  clearFlowOutputsForRow(row);
  state.selectedRow = row;
  els.rowInput.value = String(row);
  els.toolSelect.value = String(row);
  state.selectedTool = selectedTool();
  if (state.selectedTool) {
    const tool = state.selectedTool;
    els.toolMeta.innerHTML = [
      `<strong>${escapeHtml(tool.name || tool.tool_name || "Tool")}</strong>`,
      tool.url || tool.tool_url ? `<span>${escapeHtml(tool.url || tool.tool_url)}</span>` : "",
      `<small>${escapeHtml([tool.category, tool.status, tool.priority].filter(Boolean).join(" | ") || "Ready for flow")}</small>`
    ].filter(Boolean).join("");
    setTask("Tool selected", `Row ${row}: ${tool.name || tool.tool_name || "Tool"}`, "idle");
  } else {
    els.toolMeta.textContent = `Row ${row} selected. Tool details will load from Excel during each step.`;
  }
}

async function loadDefaults() {
  setTask("Loading defaults", "Reading saved Excel path and profiles", "busy");
  setState(els.state, "Loading", "busy");
  appendTerminal("GET /api/defaults");
  const data = await readJson("/api/defaults");
  state.inputPath = data.input || data.defaultInput || "";
  els.inputPath.value = state.inputPath;
  const settings = data.settings || {};
  state.lastVidsVoiceoverFolder = settings.lastVidsVoiceoverFolder || "";
  state.lastVidsVoiceoverExport = settings.lastVidsVoiceoverExport || "";
  state.lastVidsVoiceoverRow = Number(settings.row || 0);
  els.rowInput.value = String(settings.row || 2);
  els.presenter.value = settings.hookAvatarStyle || "female";
  els.videoSize.value = settings.hookVideoSize || "portrait";
  els.lowCredit.checked = settings.lowCreditVidsMode !== false;
  state.profiles = data.profiles || [];
  renderProfiles();
  if (settings.hookPrimaryProfile) {
    els.primaryProfile.value = settings.hookPrimaryProfile;
  }
  if (settings.hookFallbackProfile) {
    els.fallbackProfile.value = settings.hookFallbackProfile;
  }
  renderCreditGuard();
  setState(els.state, "Ready", "success");
  setTask("Defaults loaded", state.inputPath || "No saved Excel path", "success");
}

async function loadIdeas() {
  state.inputPath = els.inputPath.value.trim() || state.inputPath;
  if (!state.inputPath) {
    throw new Error("Excel path missing.");
  }
  setTask("Loading tool ideas", state.inputPath, "busy");
  setState(els.state, "Loading rows", "busy");
  appendTerminal(`GET /api/tool-ideas?input=${state.inputPath}&limit=${IDEA_LIST_LIMIT}`);
  const data = await readJson(`/api/tool-ideas?input=${encodeURIComponent(state.inputPath)}&limit=${IDEA_LIST_LIMIT}`);
  state.inputPath = data.input || state.inputPath;
  els.inputPath.value = state.inputPath;
  state.tools = data.tools || [];
  renderTools();
  updateToolSelection(els.rowInput.value || state.tools[0]?.row || 2);
  const visibleCount = data.analysis?.visibleToolRows || state.tools.length;
  setState(els.state, `${visibleCount} tools`, "success");
  appendTerminal(`Loaded ${visibleCount} compact tool idea rows. Direct row number also works for later rows.`, "stdout");
}

function connectSse(url, handlers = {}) {
  return new Promise((resolve, reject) => {
    const source = new EventSource(url);
    const timeout = setTimeout(() => {
      source.close();
      reject(new Error(`Run timed out: ${url}`));
    }, RUN_TIMEOUT_MS);
    function done(value, failed = false) {
      clearTimeout(timeout);
      source.close();
      if (failed) reject(value instanceof Error ? value : new Error(String(value)));
      else resolve(value);
    }
    source.addEventListener("log", (event) => {
      const entry = JSON.parse(event.data);
      appendTerminal(entry.text, entry.stream);
      handlers.log?.(entry);
    });
    source.addEventListener("progress", (event) => {
      const progress = JSON.parse(event.data);
      renderTimeline(progress.steps || []);
      handlers.progress?.(progress);
    });
    source.addEventListener("status", (event) => {
      const run = JSON.parse(event.data);
      handlers.status?.(run);
      if (run.status === "complete") {
        done(run.result || run);
      } else if (run.status && run.status !== "running") {
        done(new Error(run.error || "Run failed."), true);
      }
    });
    source.onerror = () => {
      const error = new Error(`Event stream interrupted: ${url}`);
      appendTerminal(error.message, "stderr");
      done(error, true);
    };
  });
}

function setBusy(isBusy) {
  state.running = isBusy;
  for (const button of [
    els.loadDefaultBtn,
    els.loadIdeasBtn,
    els.buildAssetsBtn,
    els.generateScriptBtn,
    els.prepareAvatarBtn,
    els.quickPreviewBtn,
    els.renderFinalBtn,
    els.runFlowBtn
  ]) {
    button.disabled = isBusy;
  }
  renderCreditGuard();
}

async function buildAssets() {
  setBusy(true);
  setStep("assets", "running", "Capturing");
  setState(els.assetState, "Building", "busy");
  setTask("Building assets", `Row ${els.rowInput.value}`, "busy");
  appendTerminal(`POST /api/assets/build-run row=${els.rowInput.value}`);
  const data = await readJson("/api/assets/build-run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payloadBase())
  });
  const result = await connectSse(`/api/assets/runs/${encodeURIComponent(data.run.id)}/events`);
  state.lastAssetFolder = result.assetsDir || "";
  state.lastAssetRow = Number(result.row || els.rowInput.value || 0);
  els.openAssetsBtn.disabled = !state.lastAssetFolder;
  const quality = result.assetQuality || {};
  els.assetResult.classList.remove("is-muted");
  els.assetResult.innerHTML = `
    <strong>${escapeHtml(result.tool?.tool_name || result.tool?.name || "Assets ready")}</strong>
    <span>${escapeHtml(result.assetsDir || "")}</span>
    <small>${escapeHtml(result.capture?.summary || "")}</small>
    ${quality.score ? `<b>Asset Quality: ${escapeHtml(quality.score)}/100 (${escapeHtml(quality.status || "review")})</b>` : ""}
  `;
  setState(els.assetState, quality.score ? `Q ${quality.score}/100` : "Ready", "success");
  setStep("assets", "complete", quality.score ? `Q ${quality.score}` : "Ready");
  setBusy(false);
  return result;
}

async function generateScript() {
  const sameRowAssets = isCurrentFlowRow(state.lastAssetRow);
  setBusy(true);
  setStep("script", "running", "Writing");
  setState(els.scriptState, "Generating", "busy");
  setTask("Generating script", `${els.sceneCount.value} scenes | ${els.language.value}`, "busy");
  appendTerminal(`POST /api/scripts/generate row=${els.rowInput.value}`);
  const data = await readJson("/api/scripts/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payloadBase({
      sceneCount: Number(els.sceneCount.value || 5),
      maxScenes: Number(els.sceneCount.value || 5),
      assetsDir: sameRowAssets ? state.lastAssetFolder : ""
    }))
  });
  const result = data.scriptBuild || {};
  state.lastScriptFolder = result.scriptDir || "";
  state.lastScriptRow = Number(result.row || els.rowInput.value || 0);
  els.openScriptBtn.disabled = !state.lastScriptFolder;
  const pkg = result.scriptPackage || {};
  els.scriptResult.classList.remove("is-muted");
  els.scriptResult.innerHTML = `
    <strong>${escapeHtml(result.tool?.tool_name || result.tool?.name || "Script ready")}</strong>
    <span>${escapeHtml(result.scriptDir || "")}</span>
    <small><b>Hook:</b> ${escapeHtml(pkg.hook || result.plan?.scenes?.[0]?.voiceover || "")}</small>
    <small><b>CTA:</b> ${escapeHtml(pkg.cta || "")}</small>
  `;
  setState(els.scriptState, `${result.totalDurationSeconds || Number(els.sceneCount.value) * 10} sec`, "success");
  setStep("script", "complete", "Ready");
  setBusy(false);
  return result;
}

function hookVideoPathFrom(result = {}) {
  return result.videoPath || result.hookAvatar?.videoPath || result.cachedScenePath || result.hookAvatar?.cachedScenePath || "";
}

function normalizeAvatarScriptText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function avatarDraftFromResult(result = {}) {
  const middleScripts = result.middleAvatarScripts || result.hookAvatar?.middleAvatarScripts || {};
  const firstMiddleEntry = Object.entries(middleScripts)[0] || [];
  return {
    row: Number(result.row || els.rowInput.value || 0),
    hook: result.hookScript || result.hookAvatar?.hookScript || "",
    focus: firstMiddleEntry[1] || "",
    focusScene: firstMiddleEntry[0] || "2",
    cta: result.ctaScript || result.ctaAvatar?.ctaScript || "",
    middle: middleScripts
  };
}

function setAvatarScriptEditors(draft = {}, label = "Prepared script") {
  state.avatarScriptDraft = { ...draft };
  state.avatarScriptPreparedDraft = { ...draft };
  state.avatarScriptPreparedRow = Number(draft.row || els.rowInput.value || 0);
  if (els.avatarHookScript) els.avatarHookScript.value = draft.hook || "";
  if (els.avatarFocusScript) els.avatarFocusScript.value = draft.focus || "";
  if (els.avatarCtaScript) els.avatarCtaScript.value = draft.cta || "";
  if (els.avatarScriptMeta) {
    els.avatarScriptMeta.textContent = `${label}${draft.focusScene ? ` | focus Scene ${draft.focusScene}` : ""} | edit before credits`;
  }
  if (els.avatarScriptStatus) {
    els.avatarScriptStatus.textContent = "Review these lines before generating. Edited text is used directly.";
  }
  if (els.avatarScriptPanel) {
    els.avatarScriptPanel.open = true;
  }
}

function collectAvatarScriptDraft() {
  const focusScene = state.avatarScriptPreparedDraft?.focusScene || "2";
  const draft = {
    row: Number(els.rowInput.value || state.avatarScriptPreparedRow || 0),
    hook: normalizeAvatarScriptText(els.avatarHookScript?.value || ""),
    focus: normalizeAvatarScriptText(els.avatarFocusScript?.value || ""),
    focusScene,
    cta: normalizeAvatarScriptText(els.avatarCtaScript?.value || "")
  };
  draft.middle = draft.focus ? { [focusScene]: draft.focus } : {};
  state.avatarScriptDraft = draft;
  return draft;
}

function avatarScriptOverridesPayload() {
  const draft = collectAvatarScriptDraft();
  return {
    avatarHookScript: draft.hook,
    avatarCtaScript: draft.cta,
    avatarMiddleScripts: draft.middle,
    avatarScriptsReviewed: Boolean(draft.hook || draft.focus || draft.cta)
  };
}

function hasReviewedAvatarScript() {
  const draft = collectAvatarScriptDraft();
  return Boolean(draft.hook || draft.focus || draft.cta);
}

function resetAvatarScriptEditors() {
  if (!state.avatarScriptPreparedDraft) return;
  setAvatarScriptEditors(state.avatarScriptPreparedDraft, "Reset to prepared script");
}

async function prepareAvatar() {
  const sameRowAssets = isCurrentFlowRow(state.lastAssetRow);
  setBusy(true);
  setStep("avatar", "running", "Prompt");
  setState(els.avatarState, "Preparing", "busy");
  setTask("Preparing Vids prompt", `Row ${els.rowInput.value}`, "busy");
  appendTerminal(`POST /api/hook-avatar/prepare row=${els.rowInput.value}`);
  const data = await readJson("/api/hook-avatar/prepare", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payloadBase({
      prepareOnly: true,
      assetsDir: sameRowAssets ? state.lastAssetFolder : ""
    }))
  });
  const result = data.hookAvatar || {};
  state.lastHookFolder = result.hookDir || result.folder || "";
  state.lastHookVideo = hookVideoPathFrom(result);
  state.lastHookRow = Number(result.row || result.hookAvatar?.row || els.rowInput.value || 0);
  setAvatarScriptEditors(avatarDraftFromResult(result), result.status === "complete" ? "Generated avatar script" : "Prepared avatar script");
  els.openAvatarBtn.disabled = !state.lastHookFolder;
  els.avatarResult.classList.remove("is-muted");
  els.avatarResult.innerHTML = `
    <strong>${escapeHtml(result.lowCreditVidsMode ? "Hook prompt prepared" : "Avatar pack prompt prepared")}</strong>
    <span>${escapeHtml(state.lastHookFolder)}</span>
    <small>${escapeHtml(result.hookScript || result.googleVidsPrompt || "Google Vids prompt files are ready.")}</small>
  `;
  setState(els.avatarState, "Prompt ready", "success");
  setStep("avatar", "complete", "Prompt");
  setBusy(false);
  return result;
}

function confirmCredits(title) {
  if (els.creditSafe.checked) {
    setTask("Credit Safe ON", "Turn off Credit Safe only when you want Google Vids generation.", "error");
    appendTerminal(`${title} blocked by Credit Safe.`, "stderr");
    return false;
  }
  const typed = window.prompt(`${title}\n\nThis can use Google Vids credits. Type ${CREDIT_WORD} to continue.`);
  return String(typed || "").trim().toUpperCase() === CREDIT_WORD;
}

async function generateAvatar() {
  if (!hasReviewedAvatarScript()) {
    setTask("Prepare avatar script first", "Prepare Vids Prompt click karo, script edit/review karo, fir generate karo.", "error");
    appendTerminal("Google Vids generation blocked: avatar script must be reviewed first.", "stderr");
    return { canceled: true };
  }
  if (state.lastHookVideo) {
    const typed = window.prompt(`Avatar video already exists.\n\nExisting: ${state.lastHookVideo}\n\nDuplicate/re-generate karna hai to REGEN type karo.`);
    if (String(typed || "").trim().toUpperCase() !== "REGEN") {
      setTask("Avatar generation skipped", "Existing avatar video reuse hoga. Duplicate create nahi kiya.", "idle");
      appendTerminal("Skipped Google Vids avatar generation because an existing avatar video is already available.", "system");
      return { canceled: true };
    }
  }
  if (!confirmCredits("Generate Google Vids avatar clip")) {
    return { canceled: true };
  }
  const sameRowAssets = isCurrentFlowRow(state.lastAssetRow);
  setBusy(true);
  setStep("avatar", "running", "Vids");
  setState(els.avatarState, "Generating", "busy");
  setTask("Generating in Google Vids", selectedProfiles().join(" -> ") || "No profile", "busy");
  appendTerminal(`POST /api/hook-avatar/runs row=${els.rowInput.value}`);
  const data = await readJson("/api/hook-avatar/runs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payloadBase({
      prepareOnly: false,
      assetsDir: sameRowAssets ? state.lastAssetFolder : ""
    }))
  });
  const result = await connectSse(`/api/hook-avatar/runs/${encodeURIComponent(data.run.id)}/events`);
  state.lastHookFolder = result.hookDir || result.folder || state.lastHookFolder;
  state.lastHookVideo = hookVideoPathFrom(result) || state.lastHookVideo;
  state.lastHookRow = Number(result.row || result.hookAvatar?.row || els.rowInput.value || state.lastHookRow || 0);
  els.openAvatarBtn.disabled = !state.lastHookFolder;
  if (state.lastHookVideo) {
    els.hookPreview.src = fileUrl(state.lastHookVideo);
    els.hookPreview.classList.remove("is-hidden");
  }
  els.avatarResult.classList.remove("is-muted");
  els.avatarResult.innerHTML = `
    <strong>Avatar video ready</strong>
    <span>${escapeHtml(state.lastHookFolder)}</span>
    <small>${escapeHtml(state.lastHookVideo || result.summary || "Check the avatar folder.")}</small>
  `;
  setState(els.avatarState, "Video ready", "success");
  setStep("avatar", "complete", "Video");
  setBusy(false);
  return result;
}

async function renderFinal(options = {}) {
  setBusy(true);
  const preview = Boolean(options.preview);
  const sameRowAssets = isCurrentFlowRow(state.lastAssetRow);
  const sameRowScript = isCurrentFlowRow(state.lastScriptRow);
  const sameRowHook = isCurrentFlowRow(state.lastHookRow);
  setStep("render", "running", preview ? "Preview" : "Final");
  setState(els.renderState, preview ? "Previewing" : "Rendering", "busy");
  setTask(preview ? "Rendering quick preview" : "Rendering final reel", `Row ${els.rowInput.value}`, "busy");
  appendTerminal(`POST /api/final-reel/runs row=${els.rowInput.value} ${preview ? "preview" : "final"}`);
  renderTimeline([{ id: "render", label: preview ? "Quick Preview" : "Final Reel", status: "running", detail: "Local editor merging assets." }]);
  const data = await readJson("/api/final-reel/runs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payloadBase({
      preview,
      previewSeconds: preview ? 15 : undefined,
      previewScenes: preview ? 2 : undefined,
      voiceoverProvider: preview ? "local" : "google-vids-voiceover",
      requireVidsVoiceover: !preview,
      assetsDir: sameRowAssets ? state.lastAssetFolder : "",
      scriptDir: sameRowScript ? state.lastScriptFolder : "",
      hookAvatarFolder: sameRowHook ? state.lastHookFolder : "",
      hookAvatarVideo: sameRowHook ? state.lastHookVideo : ""
    }))
  });
  const result = await connectSse(`/api/final-reel/runs/${encodeURIComponent(data.run.id)}/events`);
  const videoPath = result.videoPath || result.outputPath || "";
  state.lastFinalFolder = result.finalDir || result.folder || state.lastFinalFolder;
  state.lastFinalVideo = videoPath || state.lastFinalVideo;
  state.lastFinalRow = Number(result.row || els.rowInput.value || state.lastFinalRow || 0);
  state.lastVidsVoiceoverFolder = result.voiceoverDir || state.lastVidsVoiceoverFolder || "";
  state.lastVidsVoiceoverExport = result.vidsVoiceover?.exportedPath || result.voiceoverSourceVideo || state.lastVidsVoiceoverExport || "";
  state.lastVidsVoiceoverRow = Number(result.row || els.rowInput.value || state.lastVidsVoiceoverRow || 0);
  els.openFinalBtn.disabled = !state.lastFinalFolder;
  if (videoPath) {
    els.finalPreview.src = fileUrl(videoPath);
    els.finalPreview.classList.remove("is-hidden");
  }
  els.finalResult.classList.remove("is-muted");
  els.finalResult.innerHTML = `
    <strong>${escapeHtml(preview ? "Preview ready" : "Final reel ready")}</strong>
    <span>${escapeHtml(videoPath || state.lastFinalFolder)}</span>
    <small>${escapeHtml(result.summary || "Review before posting.")}</small>
    ${result.qualityScore ? `<b>Quality: ${escapeHtml(result.qualityScore)}/100</b>` : ""}
  `;
  setState(els.renderState, preview ? "Preview ready" : "Final ready", "success");
  setStep("render", "complete", preview ? "Preview" : "MP4");
  setBusy(false);
  return result;
}

async function openFolder(folder) {
  if (!folder) return;
  appendTerminal(`POST /api/open ${folder}`);
  await readJson("/api/open", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path: folder })
  });
}

async function runFlow() {
  const steps = [
    els.autoAssets.checked ? ["Assets", buildAssets] : null,
    els.autoScript.checked ? ["Script", generateScript] : null,
    els.autoPrepare.checked ? ["Prepare Vids Prompt", prepareAvatar] : null,
    els.autoGenerate.checked ? ["Generate Vids", async () => {
      const result = await generateAvatar();
      if (result?.canceled) {
        throw new Error("Vids generation canceled before credits were used.");
      }
      return result;
    }] : null,
    els.autoPreview.checked ? ["Quick Preview", () => renderFinal({ preview: true })] : null,
    els.autoFinal.checked ? ["Final Render", () => renderFinal({ preview: false })] : null
  ].filter(Boolean);
  if (!steps.length) {
    setTask("No flow steps selected", "Select at least one step.", "error");
    return;
  }
  renderTimeline(steps.map(([label]) => ({ label, status: "pending", detail: "Waiting" })));
  for (let index = 0; index < steps.length; index += 1) {
    const [label, action] = steps[index];
    renderTimeline(steps.map(([stepLabel], stepIndex) => ({
      label: stepLabel,
      status: stepIndex < index ? "complete" : stepIndex === index ? "running" : "pending",
      detail: stepIndex < index ? "Done" : stepIndex === index ? "Running" : "Waiting"
    })));
    try {
      await action();
    } catch (error) {
      renderTimeline(steps.map(([stepLabel], stepIndex) => ({
        label: stepLabel,
        status: stepIndex < index ? "complete" : stepIndex === index ? "failed" : "pending",
        detail: stepIndex === index ? error.message : stepIndex < index ? "Done" : "Waiting"
      })));
      setTask(`${label} failed`, error.message, "error");
      appendTerminal(error.message, "stderr");
      setBusy(false);
      return;
    }
  }
  renderTimeline(steps.map(([label]) => ({ label, status: "complete", detail: "Done" })));
  setTask("Flow complete", "Review preview/final output.", "success");
}

for (const el of [els.creditSafe, els.lowCredit]) {
  el.addEventListener("change", renderCreditGuard);
}

els.resetAvatarScriptBtn?.addEventListener("click", () => {
  resetAvatarScriptEditors();
  setTask("Avatar script reset", "Prepared script restored.", "idle");
});

for (const editor of [
  els.avatarHookScript,
  els.avatarFocusScript,
  els.avatarCtaScript
].filter(Boolean)) {
  editor.addEventListener("input", () => {
    collectAvatarScriptDraft();
    if (els.avatarScriptStatus) {
      els.avatarScriptStatus.textContent = "Edited avatar script ready. Generate will use this text.";
    }
    setState(els.avatarState, "Script edited", "idle");
  });
}

els.loadDefaultBtn.addEventListener("click", async () => {
  try {
    await loadDefaults();
    await loadIdeas();
  } catch (error) {
    setTask("Default load failed", error.message, "error");
    appendTerminal(error.message, "stderr");
  }
});

els.loadIdeasBtn.addEventListener("click", async () => {
  try {
    await loadIdeas();
  } catch (error) {
    setTask("Tool ideas load failed", error.message, "error");
    appendTerminal(error.message, "stderr");
  }
});

els.toolSelect.addEventListener("change", () => updateToolSelection(els.toolSelect.value));
els.rowInput.addEventListener("input", () => updateToolSelection(els.rowInput.value));
els.readyOnly.addEventListener("change", renderTools);
els.buildAssetsBtn.addEventListener("click", () => buildAssets().catch((error) => {
  setTask("Asset build failed", error.message, "error");
  appendTerminal(error.message, "stderr");
  setBusy(false);
}));
els.generateScriptBtn.addEventListener("click", () => generateScript().catch((error) => {
  setTask("Script failed", error.message, "error");
  appendTerminal(error.message, "stderr");
  setBusy(false);
}));
els.prepareAvatarBtn.addEventListener("click", () => prepareAvatar().catch((error) => {
  setTask("Prompt failed", error.message, "error");
  appendTerminal(error.message, "stderr");
  setBusy(false);
}));
els.generateAvatarBtn.addEventListener("click", () => generateAvatar().catch((error) => {
  setTask("Vids failed", error.message, "error");
  appendTerminal(error.message, "stderr");
  setBusy(false);
}));
els.quickPreviewBtn.addEventListener("click", () => renderFinal({ preview: true }).catch((error) => {
  setTask("Preview failed", error.message, "error");
  appendTerminal(error.message, "stderr");
  setBusy(false);
}));
els.renderFinalBtn.addEventListener("click", () => renderFinal({ preview: false }).catch((error) => {
  setTask("Final render failed", error.message, "error");
  appendTerminal(error.message, "stderr");
  setBusy(false);
}));
els.runFlowBtn.addEventListener("click", runFlow);
els.openAssetsBtn.addEventListener("click", () => openFolder(state.lastAssetFolder));
els.openScriptBtn.addEventListener("click", () => openFolder(state.lastScriptFolder));
els.openAvatarBtn.addEventListener("click", () => openFolder(state.lastHookFolder));
els.openFinalBtn.addEventListener("click", () => openFolder(state.lastFinalFolder));
els.clearTerminalBtn.addEventListener("click", () => {
  els.terminal.textContent = "Ready. Load Excel and select a tool row.";
  setTerminalStatus("Idle");
});

loadDefaults()
  .then(loadIdeas)
  .catch((error) => {
    setTask("Startup load failed", error.message, "error");
    appendTerminal(error.message, "stderr");
  });
