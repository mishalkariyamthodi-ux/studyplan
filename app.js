// ---------- Data (saved in localStorage so it works offline) ----------
const KEY = "studyplan.tasks";
let tasks = JSON.parse(localStorage.getItem(KEY) || "[]");
let filter = "all";

const $ = (id) => document.getElementById(id);
const save = () => localStorage.setItem(KEY, JSON.stringify(tasks));

// ---------- Render ----------
function render() {
  const list = $("list");
  list.innerHTML = "";
  const shown = tasks.filter(t =>
    filter === "all" ? true : filter === "done" ? t.done : !t.done);

  shown.forEach(t => {
    const li = document.createElement("li");
    const late = t.due && !t.done && t.due < new Date().toISOString().slice(0, 10);
    li.className = (t.done ? "done " : "") + (late ? "late" : "");

    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = t.done;
    cb.setAttribute("aria-label", "Mark done");
    cb.onchange = () => { t.done = cb.checked; save(); render(); };

    const info = document.createElement("div");
    info.className = "info";
    const title = document.createElement("span");
    title.className = "t"; title.textContent = t.title;   // textContent = safe from XSS
    const meta = document.createElement("small");
    meta.textContent = t.subject + (t.due ? " · due " : "");
    if (t.due) {
      const d = document.createElement("span");
      d.className = "d"; d.textContent = t.due;
      meta.appendChild(d);
    }
    info.append(title, meta);

    const del = document.createElement("button");
    del.className = "del"; del.textContent = "✕";
    del.setAttribute("aria-label", "Delete task");
    del.onclick = () => { tasks = tasks.filter(x => x.id !== t.id); save(); render(); };

    li.append(cb, info, del);
    list.appendChild(li);
  });

  const doneCount = tasks.filter(t => t.done).length;
  $("summary").textContent = tasks.length
    ? `${doneCount} of ${tasks.length} tasks done` : "";
  $("empty").hidden = tasks.length > 0;
}

// ---------- Events ----------
$("task-form").addEventListener("submit", (e) => {
  e.preventDefault();
  tasks.unshift({
    id: Date.now(),
    title: $("title").value.trim(),
    subject: $("subject").value,
    due: $("due").value,
    done: false
  });
  save(); render();
  e.target.reset();
});

$("filters").addEventListener("click", (e) => {
  if (e.target.dataset.f) {
    filter = e.target.dataset.f;
    document.querySelectorAll("#filters button")
      .forEach(b => b.classList.toggle("on", b === e.target));
    render();
  }
});

// ---------- Online / offline indicator ----------
function updateStatus() {
  $("status").textContent = navigator.onLine ? "Online" : "Offline: your tasks are still saved";
}
window.addEventListener("online", updateStatus);
window.addEventListener("offline", updateStatus);
updateStatus();

// ---------- Install button ----------
let promptEvent;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); promptEvent = e; $("install").hidden = false;
});
$("install").onclick = async () => {
  $("install").hidden = true;
  promptEvent.prompt();
};

// ---------- Register service worker ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("serviceWorker.js")
      .catch(err => console.error("SW failed:", err)));
}

render();
