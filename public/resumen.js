const QUIZ_SLUG = "bio-bloque-iii";
const THEME_STORAGE_KEY = "quiz_theme";
const themeToggleEl = document.getElementById("themeToggle");

const summaryContentEl = document.getElementById("summaryContent");
const summaryFileEl = document.getElementById("summaryFile");
const btnSummaryImportEl = document.getElementById("btnSummaryImport");
const summaryImportStatusEl = document.getElementById("summaryImportStatus");

function getTheme() {
  const t = document.documentElement.dataset.theme;
  return t === "light" ? "light" : "dark";
}

function setTheme(theme) {
  const next = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  if (themeToggleEl) {
    const isLight = next === "light";
    const label = isLight ? "Modo oscuro" : "Modo claro";
    const textEl = themeToggleEl.querySelector(".banner-btn__text");
    if (textEl) textEl.textContent = label;
    else themeToggleEl.textContent = label;
    themeToggleEl.setAttribute("aria-pressed", String(isLight));
    themeToggleEl.title = isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro";
  }
}

function initTheme() {
  let stored = null;
  try {
    stored = localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    stored = null;
  }

  if (stored !== "light" && stored !== "dark") {
    const prefersDark =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    stored = prefersDark ? "dark" : "light";
  }

  setTheme(stored);

  if (themeToggleEl) {
    themeToggleEl.addEventListener("click", () => {
      const next = getTheme() === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // ignore
      }
      setTheme(next);
    });
  }
}

initTheme();

function setSummaryStatus(message, { isError = false } = {}) {
  if (!summaryImportStatusEl) return;
  summaryImportStatusEl.textContent = String(message || "");
  summaryImportStatusEl.classList.toggle("feedback--bad", Boolean(isError));
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = isJson ? data?.mensaje || JSON.stringify(data) : String(data);
    throw new Error(msg || "Error");
  }
  return data;
}

async function loadSummaryFromServer() {
  if (!summaryContentEl) return;
  try {
    const data = await fetchJson(`/api/quizzes/${encodeURIComponent(QUIZ_SLUG)}/summary?t=${Date.now()}`, {
      cache: "no-store"
    });
    const html = typeof data?.html === "string" ? data.html.trim() : "";
    if (html) summaryContentEl.innerHTML = `<section class="card">${html}</section>`;
  } catch {
    // Si no hay resumen guardado, se queda el contenido por defecto del HTML.
  }
}

async function importSummaryDocx() {
  if (!summaryFileEl?.files?.length) return;

  const file = summaryFileEl.files[0];
  if (!file) return;

  if (btnSummaryImportEl) btnSummaryImportEl.disabled = true;
  setSummaryStatus("Actualizando resumen…");

  try {
    const form = new FormData();
    form.append("file", file);

    const data = await fetchJson(`/api/quizzes/${encodeURIComponent(QUIZ_SLUG)}/summary/import?t=${Date.now()}`, {
      method: "POST",
      body: form
    });

    const html = typeof data?.html === "string" ? data.html.trim() : "";
    if (summaryContentEl && html) summaryContentEl.innerHTML = `<section class="card">${html}</section>`;

    setSummaryStatus(data?.mensaje || "Resumen actualizado");
    summaryFileEl.value = "";
  } catch (err) {
    setSummaryStatus(err?.message || "No se pudo actualizar el resumen.", { isError: true });
  } finally {
    if (btnSummaryImportEl) btnSummaryImportEl.disabled = !summaryFileEl?.files?.length;
  }
}

if (summaryFileEl && btnSummaryImportEl) {
  summaryFileEl.addEventListener("change", () => {
    btnSummaryImportEl.disabled = !summaryFileEl.files?.length;
    setSummaryStatus("");
  });
  btnSummaryImportEl.addEventListener("click", importSummaryDocx);
}

loadSummaryFromServer();
