// Drawer Toggle
const toggleBtn = document.getElementById("toggleFilters");
const filtersCard = document.getElementById("filtersCard");
const closeBtn = document.getElementById("closeFilters");
const overlay = document.getElementById("drawerOverlay");

toggleBtn.addEventListener("click", () => {
  filtersCard.classList.toggle("visible");
  overlay.classList.toggle("visible");
  toggleBtn.setAttribute("aria-expanded", filtersCard.classList.contains("visible"));
});

closeBtn.addEventListener("click", () => {
  filtersCard.classList.remove("visible");
  overlay.classList.remove("visible");
});

overlay.addEventListener("click", () => {
  filtersCard.classList.remove("visible");
  overlay.classList.remove("visible");
});

// Filter buttons
document.getElementById("applyFilters").addEventListener("click", () => {
  alert("Filters applied!");
  filtersCard.classList.remove("visible");
  overlay.classList.remove("visible");
});

document.getElementById("clearFilters").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterArea").value = "";
  document.getElementById("dietSelect").value = "";
  document.getElementById("caloriesRange").value = 800;
  document.getElementById("calLabel").textContent = 800;
});

// Update calories label
const calRange = document.getElementById("caloriesRange");
const calLabel = document.getElementById("calLabel");
calRange.addEventListener("input", () => {
  calLabel.textContent = calRange.value;
});

// Quotes
const quotes = {
  en: ["Eat healthy!", "Plan your meals.", "Cooking is love."],
  yo: ["Jeun rere!", "Gbero ounje re.", "Idana ni ife."],
  ig: ["Rie nke oma!", "Choro nri gi.", "Idu nri bu ihe n'ife."],
  ha: ["Ci lafiya!", "Tsara abincinka.", "Dafa abinci shi ne kauna."],
  ef: ["Idem utom!", "Emem edem!", "Uyai inyang."],
  tv: ["Kwagh eren!", "Hwer u ve?", "Tiv quote."]
};

const quoteText = document.getElementById("quoteText");
const newQuoteBtn = document.getElementById("newQuoteBtn");
const quoteLang = document.getElementById("quoteLang");

function displayQuote() {
  const lang = quoteLang.value;
  const list = quotes[lang] || quotes.en;
  const random = list[Math.floor(Math.random() * list.length)];
  quoteText.textContent = random;
}

newQuoteBtn.addEventListener("click", displayQuote);
quoteLang.addEventListener("change", displayQuote);
displayQuote();
