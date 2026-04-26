const QUIZ_SLUG = "bio-bloque-iii";
const THEME_STORAGE_KEY = "quiz_theme";

const quizTitleEl = document.getElementById("quizTitle");
const quizDescEl = document.getElementById("quizDesc");
const quizMetaEl = document.getElementById("quizMeta");
const flashEl = document.getElementById("flash");
const themeToggleEl = document.getElementById("themeToggle");

const alumnoEl = document.getElementById("alumno");
const gradoEl = document.getElementById("grado");
const fechaEl = document.getElementById("fecha");

const formEl = document.getElementById("quizForm");
const questionsEl = document.getElementById("questions");
const btnClearEl = document.getElementById("btnClear");
const btnHistoryEl = document.getElementById("btnHistory");
const quizFileEl = document.getElementById("quizFile");
const btnImportEl = document.getElementById("btnImport");
const importStatusEl = document.getElementById("importStatus");

const resultadoEl = document.getElementById("resultado");
const nombreResultadoEl = document.getElementById("nombreResultado");
const puntajeEl = document.getElementById("puntaje");
const mensajeEl = document.getElementById("mensaje");
const folioEl = document.getElementById("folio");
const tiempoEl = document.getElementById("tiempo");
const historialEl = document.getElementById("historial");
const historialBodyEl = document.getElementById("historialBody");

let startedAtMs = Date.now();
let timerId = null;
let pendingImportFile = null;

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

function formatDuration(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

function setTiempo(seconds) {
  if (!tiempoEl) return;
  tiempoEl.textContent = `Tiempo: ${formatDuration(seconds)}`;
}

function getElapsedSeconds() {
  return Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function resetTimer() {
  stopTimer();
  startedAtMs = Date.now();
  setTiempo(0);
  timerId = setInterval(() => setTiempo(getElapsedSeconds()), 1000);
}

function resetAttemptUI() {
  formEl.reset();
  resetFeedback();
  resultadoEl.hidden = true;
  nombreResultadoEl.textContent = "";
  puntajeEl.textContent = "";
  mensajeEl.textContent = "";
  folioEl.textContent = "";
  if (tiempoEl) tiempoEl.textContent = "";
}

function setImportStatus(message) {
  if (!importStatusEl) return;
  importStatusEl.textContent = String(message || "");
}

function formatDateTime(value) {
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return String(value || "");
    return d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(value || "");
  }
}

function formatPercentFromScore10(value) {
  const score10 = Number(value);
  if (!Number.isFinite(score10)) return String(value ?? "");
  const pct = Number((score10 * 10).toFixed(1));
  const txt = Number.isInteger(pct) ? String(pct) : pct.toFixed(1);
  return `${txt}%`;
}

function renderHistoryTable(rows) {
  if (!Array.isArray(rows) || !rows.length) return `<div class="muted">Aún no hay calificaciones registradas.</div>`;

  const body = rows
    .map((r) => {
      const folio = r.id_result ?? "";
      const fechaHora = r.created_at ? formatDateTime(r.created_at) : "";
      const correctas = r.correct_count ?? "";
      const incorrectas = r.incorrect_count ?? "";
      const calif = formatPercentFromScore10(r.score_10);
      return `
        <tr>
          <td>#${escapeHtml(folio)}</td>
          <td>${escapeHtml(fechaHora)}</td>
          <td>${escapeHtml(correctas)}</td>
          <td>${escapeHtml(incorrectas)}</td>
          <td>${escapeHtml(calif)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="historywrap">
      <table class="history">
        <thead>
            <tr>
            <th>N. de intento</th>
            <th>Fecha y hora</th>
            <th>Correctas</th>
            <th>Incorrectas</th>
            <th>Calificación (%)</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function setFlash(message) {
  if (!message) {
    flashEl.hidden = true;
    flashEl.textContent = "";
    return;
  }
  flashEl.hidden = false;
  flashEl.textContent = String(message);
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripLeadingQuestionNumber(value) {
  const s = String(value || "").trim();
  return s
    .replace(/^\s*(?:pregunta\s*)?(?:no\.?\s*)?\d+\s*(?:\.\-\s*|\.\s*|\)\s*|:\s*|-\s*)/i, "")
    .trim();
}

let loadedQuiz = null;

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function withShuffledAttempt(quiz) {
  const questions = Array.isArray(quiz?.questions)
    ? quiz.questions.map((q) => ({
        ...q,
        options: Array.isArray(q?.options) ? shuffleInPlace([...q.options]) : []
      }))
    : [];
  shuffleInPlace(questions);
  return { ...quiz, questions };
}

function renderQuiz(quiz) {
  quizTitleEl.textContent = quiz.title || "Examen";
  quizDescEl.textContent = quiz.description || "";
  if (quizMetaEl) {
    const count = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
    quizMetaEl.textContent = count ? `Preguntas: ${count}` : "";
  }

  const html = (quiz.questions || [])
    .map((q, idx) => {
      const prompt = stripLeadingQuestionNumber(q.prompt);
      const optionsHtml = (q.options || [])
        .map((o, optIdx) => {
          const labelKey = String.fromCharCode("A".charCodeAt(0) + optIdx);
          return `
            <label class="option">
              <input type="radio" name="q_${q.id_question}" value="${escapeHtml(o.id_option)}">
              <span class="option__text"><strong>${escapeHtml(labelKey)})</strong> ${escapeHtml(o.text)}</span>
            </label>
          `;
        })
        .join("");

      return `
        <section class="question" id="question-${escapeHtml(q.id_question)}" data-qid="${escapeHtml(q.id_question)}">
          <h3 class="question__title">${idx + 1}. ${escapeHtml(prompt)}</h3>
          <div class="question__layout">
            <div class="question__main">
              <div class="options">${optionsHtml}</div>
              <p class="feedback" id="feedback-${escapeHtml(q.id_question)}"></p>
            </div>
            <aside class="explain" id="explain-${escapeHtml(q.id_question)}" hidden>
              <div class="explain__title">Explicación</div>
              <div class="explain__text" id="explainText-${escapeHtml(q.id_question)}"></div>
            </aside>
          </div>
        </section>
      `;
    })
    .join("");

  questionsEl.innerHTML = html || `<div class="muted">No hay preguntas disponibles.</div>`;
}

function resetFeedback() {
  document.querySelectorAll(".question").forEach((q) => {
    q.classList.remove("is-correct", "is-incorrect", "is-missing");
  });
  document.querySelectorAll(".option").forEach((o) => {
    o.classList.remove("option--solution");
  });
  document.querySelectorAll(".feedback").forEach((f) => {
    f.textContent = "";
    f.className = "feedback";
  });
  document.querySelectorAll(".explain").forEach((el) => {
    el.hidden = true;
    el.classList.remove("explain--muted", "explain--error");
  });
  document.querySelectorAll(".explain__text").forEach((el) => {
    el.textContent = "";
  });
}

function clearForm() {
  if (loadedQuiz) renderQuiz(withShuffledAttempt(loadedQuiz));
  resetAttemptUI();
  setFlash("");
  resetTimer();
}

async function loadQuiz() {
  const quiz = await fetchJson(`/api/quizzes/${encodeURIComponent(QUIZ_SLUG)}?t=${Date.now()}`, { cache: "no-store" });
  loadedQuiz = quiz;
  renderQuiz(quiz);
  resetTimer();
  return quiz;
}

function collectAnswers() {
  const answers = [];
  document.querySelectorAll(".question").forEach((q) => {
    const qid = Number(q.dataset.qid);
    if (!Number.isInteger(qid) || qid <= 0) return;

    const selected = q.querySelector(`input[name="q_${qid}"]:checked`);
    if (!selected) return;

    const optionId = Number(selected.value);
    if (!Number.isInteger(optionId) || optionId <= 0) return;
    answers.push({ question_id: qid, option_id: optionId });
  });
  return answers;
}

function markResults(result) {
  resetFeedback();

  const incorrect = new Set(result.incorrect_question_ids || []);
  const missing = new Set(result.missing_question_ids || []);
  const correctOptionIdsByQuestion = result.correct_option_ids_by_question || {};
  const explanationsByQuestion = result.explanations_by_question || {};
  const explanationsStatus = String(result.explanations_status || "");

  document.querySelectorAll(".question").forEach((q) => {
    const qid = Number(q.dataset.qid);
    const feedback = document.getElementById(`feedback-${qid}`);
    const explainBox = document.getElementById(`explain-${qid}`);
    const explainTextEl = document.getElementById(`explainText-${qid}`);
    if (!feedback) return;

    const explanation = explanationsByQuestion?.[qid];
    if (explainBox && explainTextEl) {
      if (typeof explanation === "string" && explanation.trim().length) {
        explainTextEl.textContent = explanation.trim();
        explainBox.hidden = false;
      } else if (incorrect.has(qid) || missing.has(qid)) {
        if (explanationsStatus === "disabled") {
          explainTextEl.textContent =
            "Explicación no disponible. Configura la integración de explicaciones en el servidor (OpenAI o Wikipedia).";
          explainBox.classList.add("explain--muted");
          explainBox.hidden = false;
        } else if (explanationsStatus === "error") {
          explainTextEl.textContent = "No se pudo generar la explicación en este intento.";
          explainBox.classList.add("explain--error");
          explainBox.hidden = false;
        }
      }
    }

    if (missing.has(qid)) {
      q.classList.add("is-missing");
      feedback.textContent = "Sin responder.";
      feedback.classList.add("feedback--muted");
      return;
    }

    if (incorrect.has(qid)) {
      q.classList.add("is-incorrect");
      feedback.textContent = "Incorrecta. La correcta está resaltada en amarillo.";
      feedback.classList.add("feedback--bad");

      const correctOptionId = Number(correctOptionIdsByQuestion[qid]);
      if (Number.isInteger(correctOptionId) && correctOptionId > 0) {
        const input = q.querySelector(`input[type="radio"][value="${correctOptionId}"]`);
        const label = input?.closest(".option");
        if (label) label.classList.add("option--solution");
      }
      return;
    }

    q.classList.add("is-correct");
    feedback.textContent = "Correcta.";
    feedback.classList.add("feedback--ok");
  });
}

function showSummary(result) {
  const total = Number(result.total_questions || 0);
  const correct = Number(result.correct_count || 0);
  const answered = Number(result.answered_count || 0);
  const percentage = Number(result.percentage || 0);
  const score10 = result.score_10;
  const durationSeconds = Number.isFinite(Number(result.duration_seconds)) ? Number(result.duration_seconds) : null;

  const alumno = alumnoEl.value.trim();
  nombreResultadoEl.textContent = alumno ? `Alumno: ${alumno}` : "";
  puntajeEl.textContent = `${correct} de ${total} correctas`;
  mensajeEl.textContent = `Respondidas: ${answered} de ${total} | Porcentaje: ${percentage}% | Calificación: ${score10} / 10`;
  folioEl.textContent = result.id_attempt ? `N. de intento: #${result.id_attempt}` : "";
  if (tiempoEl) tiempoEl.textContent = durationSeconds === null ? "" : `Tiempo: ${formatDuration(durationSeconds)}`;

  resultadoEl.hidden = false;
  resultadoEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function submitQuiz() {
  setFlash("");

  const durationSeconds = getElapsedSeconds();
  stopTimer();

  const payload = {
    student_name: alumnoEl.value.trim(),
    grade: gradoEl.value.trim(),
    exam_date: fechaEl.value,
    answers: collectAnswers(),
    duration_seconds: durationSeconds
  };

  const result = await fetchJson(`/api/quizzes/${encodeURIComponent(QUIZ_SLUG)}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (result && (result.duration_seconds === undefined || result.duration_seconds === null)) {
    result.duration_seconds = durationSeconds;
  }

  markResults(result);
  showSummary(result);
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await submitQuiz();
  } catch (err) {
    setFlash(String(err?.message || err));
  }
});

btnClearEl.addEventListener("click", () => clearForm());

async function loadHistory() {
  if (!historialEl || !historialBodyEl) return;
  historialEl.hidden = false;
  historialBodyEl.innerHTML = `<div class="muted">Cargando…</div>`;

  const data = await fetchJson(`/api/quizzes/${encodeURIComponent(QUIZ_SLUG)}/history?limit=100&t=${Date.now()}`, {
    cache: "no-store"
  });
  historialBodyEl.innerHTML = renderHistoryTable(data.rows || []);
  historialEl.scrollIntoView({ behavior: "smooth", block: "center" });
}

if (btnHistoryEl) {
  btnHistoryEl.addEventListener("click", async () => {
    try {
      setFlash("");
      await loadHistory();
    } catch (err) {
      setFlash(String(err?.message || err));
    }
  });
}

// Init
try {
  fechaEl.valueAsDate = new Date();
} catch {
  // ignore
}

initTheme();
loadQuiz().catch((err) => setFlash(String(err?.message || err)));

async function importQuiz() {
  if (!pendingImportFile) throw new Error("Selecciona un archivo de Word (.docx) primero.");

  const formData = new FormData();
  formData.append("file", pendingImportFile);

  const res = await fetchJson(`/api/quizzes/${encodeURIComponent(QUIZ_SLUG)}/import`, { method: "POST", body: formData });

  pendingImportFile = null;
  if (quizFileEl) quizFileEl.value = "";
  if (btnImportEl) btnImportEl.disabled = true;
  const imported = Number(res?.questions_imported);
  setImportStatus(
    Number.isFinite(imported) && imported > 0
      ? `Examen actualizado: ${imported} preguntas. Ya puedes volver a practicar.`
      : "Examen actualizado. Ya puedes volver a practicar."
  );

  await loadQuiz();
  clearForm();
}

if (quizFileEl && btnImportEl) {
  btnImportEl.disabled = true;

  quizFileEl.addEventListener("change", async () => {
    pendingImportFile = null;
    btnImportEl.disabled = true;
    setImportStatus("");

    const file = quizFileEl.files?.[0];
    if (!file) return;

    const name = String(file.name || "").toLowerCase();
    const isWord = name.endsWith(".docx");
    if (!isWord) {
      pendingImportFile = null;
      btnImportEl.disabled = true;
      setImportStatus("Archivo inválido. Solo se acepta Word (.docx).");
      return;
    }

    pendingImportFile = file;
    btnImportEl.disabled = false;
    setImportStatus(`Archivo listo: ${file.name}`);
  });

  btnImportEl.addEventListener("click", async () => {
    try {
      if (!confirm("Esto reemplazará todas las preguntas del examen. ¿Continuar?")) return;
      setFlash("");
      btnImportEl.disabled = true;
      setImportStatus("Actualizando examen...");
      await importQuiz();
    } catch (err) {
      const msg = String(err?.message || err);
      setFlash(msg);
      setImportStatus(msg);
      btnImportEl.disabled = !pendingImportFile;
    }
  });
}
