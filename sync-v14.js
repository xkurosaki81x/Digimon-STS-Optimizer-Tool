/* v1.4: private repository synchronization. No OAuth, CORS proxy, or embedded credentials. */
(() => {
  "use strict";

  const REPO = "xkurosaki81x/Digimon-STS-Private-Save";
  const API = "https://api.github.com/repos/" + REPO;
  const FILE = "/contents/time-stranger-progress.json";
  const SETTINGS_KEY = KEY + ":sync-v14";
  const RECOVERY_KEY = KEY + ":pre-cloud-restore";
  const APP = "Digimon Story: Time Stranger Tool";
  const emptySettings = () => ({ token: "", auto: true, baseSha: "", baseFingerprint: "", lastSync: "" });
  let settings = emptySettings();
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    if (saved && typeof saved === "object") {
      for (const key of ["token", "baseSha", "baseFingerprint", "lastSync"]) {
        if (typeof saved[key] === "string") settings[key] = saved[key];
      }
      if (typeof saved.auto === "boolean") settings.auto = saved.auto;
    }
  } catch {}
  if (!settings.token.startsWith("github_pat_")) settings.token = "";

  let busy = false, queued = false, timer = null, conflict = null, lastCheckOK = false;
  let message = settings.token ? "Waiting to check your private save…" : "Not connected on this device.";
  let storageWarning = "";
  const connected = () => Boolean(settings.token);
  const snapshot = () => exportState13();
  const fingerprint = (value) => JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v).sort().map(key => [key, v[key]])) : v);
  const currentFingerprint = () => fingerprint(snapshot());
  let observed = currentFingerprint();
  const dirty = () => currentFingerprint() !== settings.baseFingerprint;

  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); storageWarning = ""; }
    catch { storageWarning = "Browser storage is unavailable; the connection may not survive a restart."; }
  }

  function display() {
    const status = el("syncMessage14");
    if (status) status.textContent = message + (storageWarning ? " " + storageWarning : "");
    const last = el("syncLast14");
    if (last) last.textContent = settings.lastSync ? new Date(settings.lastSync).toLocaleString() : "Never";
    const badge = el("syncBadge14");
    if (badge) {
      badge.textContent = !connected() ? "Cloud sync: not connected" : conflict ? "Cloud sync: conflict"
        : busy ? "Cloud sync: checking…" : dirty() ? "Cloud sync: pending" : lastCheckOK ? "Cloud sync: up to date" : "Cloud sync: check required";
      badge.className = "badge " + (conflict ? "red" : connected() && !dirty() && !busy && lastCheckOK ? "green" : "gold");
    }
    const controls = el("githubSync14");
    if (!controls) return;
    for (const input of controls.querySelectorAll("button, input")) {
      if (input.id === "syncToken14" || input.id === "syncConnect14") input.disabled = busy;
      else if (input.id === "syncRecovery14") input.disabled = busy || !hasRecovery();
      else input.disabled = busy || !connected();
    }
    const choices = el("syncChoices14");
    if (choices) choices.hidden = !conflict;
    if (el("syncUseCloud14")) el("syncUseCloud14").hidden = !conflict || !conflict.sha;
    if (el("syncAuto14")) el("syncAuto14").checked = settings.auto;
  }

  function hasRecovery() {
    try { return Boolean(localStorage.getItem(RECOVERY_KEY)); } catch { return false; }
  }
  function setMessage(text) { message = text; display(); }
  function panel() {
    return '<div class="panel" id="githubSync14"><h2>Private GitHub cloud sync</h2>' +
      '<p>Synchronize automatically between your laptop and Android using the dedicated private repository <b>' + esc(REPO) +
      '</b>. The public website never contains your token or cloud save.</p>' +
      '<p><small>On each device, create a separate fine-grained GitHub token limited to this repository, with <b>Contents: Read and write</b>. ' +
      'Enter it only here. It is stored in this browser for automatic sync, never in backups or the public website. ' +
      'Anyone who controls this device or malicious scripts running on this website could access local data; revoke lost-device tokens on GitHub.</small></p>' +
      '<label>Fine-grained personal access token<input id="syncToken14" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="' +
      (connected() ? 'Connected — enter a new token to replace' : 'github_pat_…') + '"></label>' +
      '<div class="row"><button class="primary" id="syncConnect14">' + (connected() ? 'Replace token' : 'Connect GitHub') +
      '</button><button id="syncNow14">Sync now</button><button class="warn" id="syncDisconnect14">Disconnect</button></div>' +
      '<label class="checkline"><input id="syncAuto14" type="checkbox" ' + (settings.auto ? 'checked' : '') +
      '> Automatic sync on open, changes and reconnect</label>' +
      '<p class="status" id="syncMessage14" role="status" aria-live="polite"></p><p><small>Last successful sync: <span id="syncLast14"></span></small></p>' +
      '<div id="syncChoices14" class="notice" hidden><b>Choose which progress to keep</b><p>Both copies are preserved until you choose. ' +
      'Download a backup if uncertain. The app never chooses a winner based only on device clocks.</p>' +
      '<div class="row"><button id="syncUseCloud14">Use cloud save</button><button class="warn" id="syncUseLocal14">Use this device</button></div></div>' +
      '<button id="syncRecovery14">Download previous local save</button>' +
      '<p><small>Sync checks approximately every 45 seconds while the app is open. Offline edits are uploaded when connected again. ' +
      'A closed PWA cannot guarantee background execution.</small></p></div>';
  }

  async function request(url, token, options = {}) {
    let response;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      response = await fetch(url, {
        ...options, cache: "no-store", redirect: "error", credentials: "omit", signal: controller.signal,
        headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28",
          Authorization: "Bearer " + token, ...(options.body ? {"Content-Type": "application/json"} : {}) }
      });
    } catch { throw new Error("Network unavailable. Your progress is saved locally; sync will retry when online."); }
    finally { clearTimeout(timeout); }
    if (response.status === 404 && options.allowMissing === true) return null;
    if (!response.ok) {
      if (response.status === 401) throw new Error("GitHub token is invalid or expired. Replace it on this device.");
      if (response.status === 403 || response.status === 404) throw new Error("GitHub denied access. Confirm the token is limited to the private save repository and Contents has read/write access.");
      if (response.status === 409 || response.status === 422) throw new Error("GitHub rejected the write. The cloud save may have changed; sync again to check both copies.");
      throw new Error("GitHub returned HTTP " + response.status + ". Progress remains saved locally.");
    }
    return response.json();
  }
  async function verifyPrivate(token) {
    const repo = await request(API, token);
    if (!repo || repo.private !== true || String(repo.full_name).toLowerCase() !== REPO.toLowerCase()) {
      throw new Error("Save repository is not private or is incorrect. Sync has been stopped to protect your data.");
    }
  }
  const decode = (value) => new TextDecoder("utf-8", {fatal: true}).decode(
    Uint8Array.from(atob(value.replace(/\s/g, "")), c => c.charCodeAt(0)));
  function encode(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return btoa(binary);
  }
  const record = v => v && typeof v === "object" && !Array.isArray(v);
  function checkedState(payload) {
    const s = payload?.state;
    if (payload?.schema !== 1 || payload?.app !== APP || !record(s) || s.version !== 1 ||
      !Number.isInteger(s.stage) || s.stage < 0 || s.stage >= stages.length ||
      !Number.isInteger(s.rank) || s.rank < 1 || s.rank > 10 ||
      !Array.isArray(s.roster) || s.roster.length !== 6 || !s.roster.every(x => typeof x === "string") ||
      !["tasks", "ch", "gear", "skills"].every(k => record(s[k])) ||
      ("owned" in s && (!Array.isArray(s.owned) || !s.owned.every(o => record(o) &&
        typeof o.id === "string" && typeof o.name === "string" && typeof o.where === "string")))) {
      throw new Error("Cloud save is not a valid Time Stranger planner backup. No local data was changed.");
    }
    delete s.github13; delete s.github14;
    return s;
  }
  async function getRemote(token) {
    const file = await request(API + FILE, token, {allowMissing: true});
    if (!file) return null;
    if (!file.sha || file.type !== "file" || file.encoding !== "base64" || typeof file.content !== "string") {
      throw new Error("Cloud save cannot be read in the expected format. No local data was changed.");
    }
    let payload;
    try { payload = JSON.parse(decode(file.content)); }
    catch { throw new Error("Cloud save contains invalid JSON. No local data was changed."); }
    return {sha: file.sha, state: checkedState(payload)};
  }
  function markSynced(sha, fp) {
    settings.baseSha = sha;
    settings.baseFingerprint = fp;
    settings.lastSync = new Date().toISOString();
    conflict = null;
    lastCheckOK = true;
    saveSettings();
    setMessage("Sync complete. This device and your private cloud save are up to date.");
  }
  async function upload(token, remote) {
    const data = snapshot();
    const fp = fingerprint(data);
    const contents = JSON.stringify({schema: 1, app: APP, savedAt: new Date().toISOString(), state: data});
    if (new TextEncoder().encode(contents).length > 750000) throw new Error("Save exceeds the safe sync size. Export a backup before continuing.");
    const body = {message: "Update Time Stranger planner progress", content: encode(contents)};
    if (remote) body.sha = remote.sha; // compare-and-swap: GitHub rejects stale writes
    const result = await request(API + FILE, token, {method: "PUT", body: JSON.stringify(body)});
    if (!result?.content?.sha) throw new Error("GitHub did not confirm the saved file. Sync again before making additional changes.");
    markSynced(result.content.sha, fp);
    if (dirty()) { queued = true; setMessage("New changes are waiting to sync."); }
  }
  function download(remote) {
    const previous = state, previousView = view, previousEdit = editId;
    const previousData = snapshot();
    // Do not replace local progress if a recovery copy cannot be saved.
    try { localStorage.setItem(RECOVERY_KEY, JSON.stringify(previousData)); }
    catch { throw new Error("Cannot create a local recovery backup. Free some browser storage before downloading cloud progress."); }
    try {
      state = {...defaultState(), ...remote.state};
      if (!record(state.boss13)) state.boss13 = {attribute: "", element: "", trait: ""};
      ensureState();
      syncCheckpoint();
      editId = null;
      render();
      basePersist();
      if (!storageOK) throw new Error("Local storage failed.");
    } catch {
      state = previous; view = previousView; editId = previousEdit;
      basePersist(); render();
      throw new Error("The cloud save could not be safely loaded. Your previous local progress was restored.");
    }
    observed = currentFingerprint();
    markSynced(remote.sha, observed);
    setMessage("Downloaded your latest cloud progress. The previous local copy is available as a recovery backup.");
  }
  function isEditing() {
    const active = document.activeElement;
    return Boolean((tab === "roster" && editId !== null) ||
      (active && (active.matches("input,textarea,select") || active.isContentEditable)));
  }
  function ask(remote, reason) {
    conflict = {sha: remote?.sha || ""};
    setMessage(reason);
  }
  async function reconcile(token, resolution) {
    await verifyPrivate(token);
    const remote = await getRemote(token);
    const local = currentFingerprint();
    const remoteFingerprint = remote ? fingerprint(remote.state) : "";
    if (resolution) {
      if (!conflict || conflict.sha !== (remote?.sha || "")) {
        ask(remote, "Cloud progress changed since the conflict was shown. Review your choice again.");
        return;
      }
      if (resolution === "cloud" && remote) download(remote);
      else if (resolution === "local") await upload(token, remote);
      return;
    }
    if (!remote) {
      if (settings.baseSha) ask(null, "Your previously synchronized cloud file is missing. Local progress is preserved. Choose Use this device to recreate it.");
      else await upload(token, null); // new file; never overwrites an existing file
      return;
    }
    if (local === remoteFingerprint) { markSynced(remote.sha, local); return; }
    if (!settings.baseSha) {
      ask(remote, "An existing cloud save was found. Choose whether to use the cloud progress or keep this device's progress.");
      return;
    }
    if (remote.sha === settings.baseSha) {
      if (local !== settings.baseFingerprint) await upload(token, remote);
      else markSynced(remote.sha, local);
      return;
    }
    if (local !== settings.baseFingerprint) {
      ask(remote, "Both this device and the cloud have changed since the last sync. No data was overwritten.");
      return;
    }
    if (isEditing()) { setMessage("New cloud progress is available. Finish editing, then sync again."); return; }
    download(remote);
  }

  function schedule(delay = 2500) {
    if (!connected() || !settings.auto || conflict) return;
    if (busy) { queued = true; return; }
    clearTimeout(timer);
    timer = setTimeout(() => { timer = null; void sync(); }, delay);
  }
  async function sync(resolution = null) {
    if (!connected() || busy) return;
    if (navigator.onLine === false) { lastCheckOK = false; setMessage("Offline — local progress is saved and will sync when you reconnect."); return; }
    busy = true; queued = false; lastCheckOK = false; display();
    try { await reconcile(settings.token, resolution); }
    catch (error) { setMessage(error.message); }
    finally { busy = false; display(); if (queued && !conflict) schedule(); }
  }
  async function connect() {
    const input = el("syncToken14");
    const token = input?.value.trim() || "";
    if (!token.startsWith("github_pat_")) { setMessage("Enter a fine-grained personal access token beginning with github_pat_."); return; }
    if (busy) return;
    busy = true; setMessage("Verifying access to your private repository…");
    try {
      await verifyPrivate(token);
      // Read through the Contents API before retaining the token.
      await getRemote(token);
      settings.token = token;
      settings.auto = true;
      saveSettings();
      if (input) input.value = "";
      renderSave();
      setMessage("Connected. Checking cloud progress…");
    } catch (error) {
      setMessage(error.message);
      return;
    } finally { busy = false; display(); }
    await sync();
  }
  const basePersist = persist;
  persist = function() {
    delete state.github13; delete state.github14;
    basePersist();
    const next = currentFingerprint();
    if (next !== observed) {
      observed = next;
      if (connected()) { setMessage("Local changes saved. Cloud sync pending."); schedule(); }
    }
  };
  const originalSave = renderSave;
  renderSave = function() {
    originalSave();
    el("save").insertAdjacentHTML("afterbegin", panel());
    display();
  };
  document.querySelector("header").insertAdjacentHTML("beforeend", ' <span class="badge gold" id="syncBadge14"></span>');
  document.addEventListener("click", e => {
    const id = e.target.closest("button")?.id;
    if (id === "syncConnect14") void connect();
    else if (id === "syncNow14") void sync();
    else if (id === "syncDisconnect14" && !busy && confirm("Disconnect cloud sync on this device? Your private repository and local progress will remain intact.")) {
      clearTimeout(timer); timer = null; settings.token = ""; conflict = null; saveSettings();
      renderSave(); setMessage("Disconnected. Your local progress and cloud file were not deleted.");
    } else if (id === "syncUseCloud14" && conflict && confirm("Replace this device's progress with the cloud save? A local recovery copy will be retained.")) void sync("cloud");
    else if (id === "syncUseLocal14" && conflict && confirm("Replace the cloud save with this device's progress? Previous cloud versions are retained in GitHub commit history.")) void sync("local");
    else if (id === "syncRecovery14") {
      try {
        const value = localStorage.getItem(RECOVERY_KEY);
        if (value) {
          const url = URL.createObjectURL(new Blob([value], {type: "application/json"}));
          const a = document.createElement("a"); a.href = url; a.download = "time-stranger-previous-local-progress.json"; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      } catch { setMessage("Could not read the local recovery backup."); }
    }
  });
  document.addEventListener("change", e => {
    if (e.target.id === "syncAuto14") {
      settings.auto = e.target.checked; saveSettings();
      if (settings.auto) schedule(0); else { clearTimeout(timer); timer = null; }
      display();
    }
  });
  window.addEventListener("online", () => { if (settings.auto) schedule(0); });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && settings.auto) schedule(0);
  });
  window.addEventListener("focus", () => { if (settings.auto) schedule(0); });
  setInterval(() => {
    if (document.visibilityState === "visible" && settings.auto && connected() && !busy && !conflict) void sync();
  }, 45000);
  renderSave();
  if (connected() && settings.auto) schedule(0);
})();
