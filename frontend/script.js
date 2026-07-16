// ============================================================
// EcoSort AI — Frontend logic
// Backend integration hooks preserved for FastAPI compatibility.
// All existing IDs kept: fileInput, dropzone, dropEmpty, dropPreview,
//   previewImg, predictBtn, mCategory, mRecyclable, mConfidence,
//   mBin, mDecomp, iDisposal, iReuse, iImpact, ringFill
// ============================================================

const fileInput   = document.getElementById("fileInput");
const dropzone    = document.getElementById("dropzone");
const dropEmpty   = document.getElementById("dropEmpty");
const dropPreview = document.getElementById("dropPreview");
const previewImg  = document.getElementById("previewImg");
const predictBtn  = document.getElementById("predictBtn");
const browseBtn   = document.getElementById("browseBtn");
const replaceBtn  = document.getElementById("replaceBtn");
const removeBtn   = document.getElementById("removeBtn");
const imgControls = document.getElementById("imgControls");

const ringFill      = document.getElementById("ringFill");
const resultCard    = document.getElementById("resultCard");
const recyclableBadge = document.getElementById("mRecyclable");

const RING_CIRC = 2 * Math.PI * 34; // matches r=34 in the SVG

let currentImage = null;
let isPredicting = false;

// ---------- File handling ----------
function showPreview(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    dropEmpty.hidden = true;
    dropPreview.hidden = false;
    imgControls.hidden = false;
    dropPreview.classList.add("fade-in");
    currentImage = file;
    predictBtn.disabled = false;
  };
  reader.readAsDataURL(file);
}

function openFilePicker() {
  fileInput.value = "";
  fileInput.click();
}

function removeImage() {
  currentImage = null;
  previewImg.src = "";
  dropPreview.hidden = true;
  imgControls.hidden = true;
  dropEmpty.hidden = false;
  dropEmpty.classList.add("fade-in");
  predictBtn.disabled = true;
  resetPrediction();
}

fileInput.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) showPreview(e.target.files[0]);
});

browseBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  openFilePicker();
});
replaceBtn.addEventListener("click", openFilePicker);
removeBtn.addEventListener("click", removeImage);

// click anywhere on empty dropzone opens picker
dropzone.addEventListener("click", (e) => {
  if (!currentImage && !e.target.closest(".browse-btn")) openFilePicker();
});

// drag & drop
["dragenter", "dragover"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    if (!currentImage) dropzone.classList.add("dragover");
  })
);
["dragleave", "drop"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
  })
);
dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) showPreview(file);
});

// ---------- Predict button ----------
predictBtn.addEventListener("click", () => {
  if (!currentImage || isPredicting) return;
  setPredicting(true);
  runPrediction();
});

function setPredicting(state) {
  isPredicting = state;
  predictBtn.querySelector(".btn-content").hidden = state;
  predictBtn.querySelector(".btn-spinner").hidden = !state;
  predictBtn.disabled = state;
  predictBtn.classList.toggle("loading", state);
}

// ripple effect
predictBtn.addEventListener("click", function (e) {
  if (this.disabled) return;
  const rect = this.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + "px";
  ripple.style.left = e.clientX - rect.left - size / 2 + "px";
  ripple.style.top = e.clientY - rect.top - size / 2 + "px";
  this.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

// ---------- Prediction UI helpers (used by runPrediction) ----------
function setConfidenceRing(percent) {
  const p = Math.max(0, Math.min(100, percent));
  ringFill.style.strokeDashoffset = RING_CIRC - (p / 100) * RING_CIRC;
  document.getElementById("mConfidence").textContent = Math.round(p) + "%";
}

function setRecyclableBadge(isRecyclable) {
  recyclableBadge.hidden = false;
  recyclableBadge.classList.remove("is-yes", "is-no");
  recyclableBadge.classList.add(isRecyclable ? "is-yes" : "is-no");
  recyclableBadge.querySelector(".rb-text").textContent = isRecyclable
    ? "Recyclable"
    : "Non-Recyclable";
}

function resetPrediction() {
    document.getElementById("successMessage").textContent = "";

    document.getElementById("successMessage").style.opacity = "0";
  setConfidenceRing(0);
  document.getElementById("mConfidence").textContent = "0%";
  document.getElementById("mCategory").textContent = "Awaiting";
  document.getElementById("mBin").innerHTML = '<span class="bin-dot"></span><span>—</span>';
  document.getElementById("mDecomp").textContent = "—";
  document.getElementById("iDisposal").textContent =
    "Upload an image and run a prediction to see step-by-step disposal guidance.";
  document.getElementById("iReuse").textContent =
    "Creative ways to repurpose this item will appear here after classification.";
  document.getElementById("iImpact").textContent =
    "Estimated CO2 savings and landfill impact will be shown here.";
  recyclableBadge.hidden = true;
  resultCard.classList.remove("has-result");
  document.querySelectorAll(".info-card").forEach((c) => c.classList.remove("has-result"));
}

function markResultShown() {
  resultCard.classList.add("has-result", "fade-in");
  document.querySelectorAll(".info-card").forEach((c) => {
    c.classList.add("has-result", "fade-in");
  });
}

// expose helpers for runPrediction
window.EcoSortUI = {
  setConfidenceRing,
  setRecyclableBadge,
  resetPrediction,
  markResultShown,
  setPredicting,
  getImage: () => currentImage,
};

// ============================================================
// Placeholder prediction function.
// Connect your FastAPI backend here.
// Do NOT add mock data — wire this to your real API call.
// ============================================================
async function runPrediction() {

    const file = window.EcoSortUI.getImage();

    if (!file) {
        window.EcoSortUI.setPredicting(false);
        return;
    }

    const formData = new FormData();

    formData.append("file", file);

    try {

        const response = await fetch("http://127.0.0.1:8000/predict", {

            method: "POST",

            body: formData

        });

        const data = await response.json();

        if (!data.success) {

            alert("Prediction failed.");

            window.EcoSortUI.setPredicting(false);

            return;

        }

        document.getElementById("mCategory").textContent =
            data.category.toUpperCase();

        window.EcoSortUI.setConfidenceRing(data.confidence);

        const recyclable =
            data.category !== "trash";

        window.EcoSortUI.setRecyclableBadge(recyclable);

        const wasteInfo = {

  glass: {
    bin: "🟢 Green Recycling Bin",
    decomposition: "⏳ 4000+ Years",

    disposal: `
✅ Rinse bottles and jars before recycling.<br>
✅ Remove lids or caps whenever possible.<br>
✅ Separate broken glass if your municipality requires it.<br>
✅ Never mix ceramics or mirrors with recyclable glass.
`,

    reuse: `
♻ Use glass jars for kitchen storage.<br>
♻ Convert bottles into flower vases or lamps.<br>
♻ Create DIY home decorations.<br>
♻ Reuse containers before recycling.
`,

    impact: `
🌍 Glass is 100% recyclable.<br>
🌍 Can be recycled infinitely without quality loss.<br>
🌍 Saves raw materials and manufacturing energy.<br>
🌍 Helps reduce landfill waste significantly.
`
  },



  plastic: {
    bin: "🔵 Plastic Recycling Bin",
    decomposition: "⏳ ~450 Years",

    disposal: `
✅ Wash plastic containers before disposal.<br>
✅ Remove food residue and liquids.<br>
✅ Compress bottles to save recycling space.<br>
✅ Dispose only in designated plastic bins.
`,

    reuse: `
♻ Refill water bottles whenever possible.<br>
♻ Use containers for household storage.<br>
♻ Convert bottles into planters or organizers.<br>
♻ Donate reusable containers.
`,

    impact: `
🌍 Reduces ocean pollution.<br>
🌍 Protects marine wildlife.<br>
🌍 Conserves petroleum resources.<br>
🌍 Reduces greenhouse gas emissions.
`
  },



  paper: {
    bin: "🔵 Blue Recycling Bin",
    decomposition: "⏳ 2–6 Weeks",

    disposal: `
✅ Keep paper clean and dry.<br>
✅ Remove plastic covers or laminates.<br>
✅ Flatten newspapers and cardboard.<br>
✅ Recycle separately from food waste.
`,

    reuse: `
♻ Use printed sheets as rough paper.<br>
♻ Create crafts and gift wrapping.<br>
♻ Reuse cartons for packaging.<br>
♻ Donate old books if usable.
`,

    impact: `
🌍 Saves trees and forests.<br>
🌍 Conserves water resources.<br>
🌍 Reduces energy consumption.<br>
🌍 Lowers carbon emissions.
`
  },



  cardboard: {
    bin: "🔵 Blue Recycling Bin",
    decomposition: "⏳ About 2 Months",

    disposal: `
✅ Fold cardboard boxes flat.<br>
✅ Remove excessive tape when possible.<br>
✅ Keep boxes dry.<br>
✅ Place only clean cardboard in recycling.
`,

    reuse: `
♻ Reuse shipping boxes.<br>
♻ Create storage organizers.<br>
♻ Use for school craft projects.<br>
♻ Donate reusable cartons.
`,

    impact: `
🌍 Reduces deforestation.<br>
🌍 Saves water during manufacturing.<br>
🌍 Conserves natural resources.<br>
🌍 Minimizes landfill accumulation.
`
  },



  metal: {
    bin: "⚙ Metal Recycling Bin",
    decomposition: "⏳ 100–500 Years",

    disposal: `
✅ Rinse cans before recycling.<br>
✅ Crush cans to save storage space.<br>
✅ Separate aluminum from steel if required.<br>
✅ Remove food residues completely.
`,

    reuse: `
♻ Reuse cans for storage.<br>
♻ Make pen holders and organizers.<br>
♻ Create decorative DIY projects.<br>
♻ Donate reusable containers.
`,

    impact: `
🌍 Saves up to 95% manufacturing energy.<br>
🌍 Conserves valuable ores.<br>
🌍 Reduces mining activities.<br>
🌍 Lowers industrial pollution.
`
  },



  trash: {
    bin: "🗑 General Waste Bin",
    decomposition: "⏳ Varies",

    disposal: `
✅ Dispose responsibly in general waste bins.<br>
✅ Avoid mixing recyclable materials.<br>
✅ Separate hazardous waste if applicable.<br>
✅ Follow local waste management rules.
`,

    reuse: `
♻ Minimize unnecessary purchases.<br>
♻ Repair damaged items whenever possible.<br>
♻ Donate reusable products.<br>
♻ Reduce single-use consumption.
`,

    impact: `
🌍 Improper disposal increases landfill waste.<br>
🌍 Generates methane emissions.<br>
🌍 Pollutes soil and groundwater.<br>
🌍 Proper segregation protects ecosystems.
`
  }

};

        const info = wasteInfo[data.category];

        document.getElementById("mBin").textContent =
            info.bin;

        document.getElementById("mDecomp").textContent =
            info.decomposition;

        document.getElementById("iDisposal").innerHTML = `
            <div style="margin-bottom:8px;">📋 <b>Recommended Steps</b></div>
            ${info.disposal}
            `;

        document.getElementById("iReuse").innerHTML = `
            <div style="margin-bottom:8px;">♻ <b>Creative Reuse</b></div>
            ${info.reuse}
            `;

        document.getElementById("iImpact").innerHTML = `
            <div style="margin-bottom:8px;">🌍 <b>Environmental Benefits</b></div>
            ${info.impact}
            `;

        window.EcoSortUI.markResultShown();
        document.getElementById("successMessage").textContent =
        "Classification completed successfully";

        document.getElementById("successMessage").style.opacity = "1";

    }

    catch (error) {

        console.error(error);

        alert("Cannot connect to backend.");

    }

    finally {

        window.EcoSortUI.setPredicting(false);

    }

}

// expose for debugging
window.runPrediction = runPrediction;
