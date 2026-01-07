let rows = [];
let currentSymptom = null;

const OBS_ORDER = {
  "Field observable": 1,
  "Requires inspection / measurement": 2,
  "Internal / inferred": 3
};

const OBS_CLASS = {
  "Field observable": "obs-field",
  "Requires inspection / measurement": "obs-inspection",
  "Internal / inferred": "obs-internal"
};

fetch("data.json")
  .then(r => r.json())
  .then(data => {
    rows = data;
    renderSymptomList();
  })
  .catch(() => {
    document.getElementById("result").innerText =
      "❌ Unable to load troubleshooting data";
  });

function renderSymptomList() {
  const ul = document.getElementById("symptomList");
  ul.innerHTML = "";

  const unique = {};
  rows.forEach(r => {
    unique[r["Symptom ID"]] = r["Symptom on Field"];
  });

  Object.entries(unique).forEach(([id, label]) => {
    const li = document.createElement("li");
    li.textContent = `${id} — ${label}`;
    li.onclick = () => openSymptom(id);
    ul.appendChild(li);
  });
}

function openSymptom(symptomId) {
  currentSymptom = symptomId;

  document.getElementById("symptomList").style.display = "none";
  document.getElementById("searchInput").style.display = "none";
  document.getElementById("backBtn").style.display = "inline-block";

  const container = document.getElementById("result");
  container.innerHTML = "";

  const symptomRows = rows
    .filter(r => r["Symptom ID"] === symptomId)
    .sort(
      (a, b) =>
        OBS_ORDER[a["Observability Level"]] -
        OBS_ORDER[b["Observability Level"]]
    );

  const title = document.createElement("h2");
  title.textContent = `${symptomId} — ${symptomRows[0]["Symptom on Field"]}`;
  container.appendChild(title);

  symptomRows.forEach(r => {
    const card = document.createElement("div");
    card.className = `card ${OBS_CLASS[r["Observability Level"]]}`;

    card.innerHTML = `
      <p><strong>Observability:</strong> ${r["Observability Level"]}</p>
      <p><strong>Sub-issue:</strong> ${r["Sub-Issue (Observable / Physical)"]}</p>
    `;

    if (r["SOP"] && r["SOP"] !== "SOP missing") {
      const steps = r["SOP"].split("\n");
      const ul = document.createElement("ul");

      steps.forEach(s => {
        const li = document.createElement("li");
        const cb = document.createElement("input");
        cb.type = "checkbox";
        li.appendChild(cb);
        li.append(" " + s);
        ul.appendChild(li);
      });

      card.appendChild(ul);
    } else {
      card.innerHTML += `<p class="missing">⚠ SOP missing</p>`;
    }

    if (r["Spare Parts Required"] && r["Spare Parts Required"] !== "Missing") {
      card.innerHTML += `<p><strong>Spare parts:</strong> ${r["Spare Parts Required"]}</p>`;
    }

    if (r["AI agent"]) {
      const ai = document.createElement("div");
      ai.className = "ai-box";

      const agent = r["AI agent"];
      const context = r["Ai context"] || "";

      ai.innerHTML = `
        <p><strong>AI agent:</strong> ${agent}</p>
        <a href="https://bloqit.atlassian.net/wiki/ai?agent=${encodeURIComponent(
          agent
        )}&q=${encodeURIComponent(context)}"
           target="_blank"
           rel="noopener noreferrer">
           🤖 Ask AI for help
        </a>
      `;

      card.appendChild(ai);
    }

    container.appendChild(card);
  });
}

document.getElementById("backBtn").onclick = () => {
  document.getElementById("result").innerHTML = "";
  document.getElementById("symptomList").style.display = "block";
  document.getElementById("searchInput").style.display = "block";
  document.getElementById("backBtn").style.display = "none";
};

document.getElementById("searchInput").oninput = e => {
  const q = e.target.value.toLowerCase();
  const lis = document.querySelectorAll("#symptomList li");
  lis.forEach(li => {
    li.style.display = li.textContent.toLowerCase().includes(q)
      ? "block"
      : "none";
  });
};
