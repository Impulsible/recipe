// js/quotes.js
// Lightweight quotes with translations for offline-first behaviour.
// Languages supported: en, yo (Yoruba), ig (Igbo), ha (Hausa), ef (Efik/Ibibio), tv (Tiv)

(() => {
  const quoteText = document.getElementById('quoteText');
  const quoteLang = document.getElementById('quoteLang');

  // Example quotes and translations (add more as you like)
  const QUOTES = [
    {
      id: 1,
      en: "Good food is the foundation of genuine happiness.",
      yo: "Ounjẹ to dára ni ìpilẹ̀ ayọ̀ gidi.",
      ig: "Nri ọma bụ ntọala nke ezigbo ọṅụ.",
      ha: "Abinci mai kyau shi ne tushen farin ciki na gaskiya.",
      ef: "Afia udia mmo ison ndien ke ediọk idem.",
      tv: "Ior vwase u boor u ken u are."
    },
    {
      id: 2,
      en: "Cook with love, serve with joy.",
      yo: "Sẹ́ ìfẹ́ mú inú rẹ́, sìn ní ayọ̀.",
      ig: "Siri nri na ịhụnanya, were ọṅụ kwụọ ya.",
      ha: "Da daɗi a dafa, a yi farin ciki a bai wa.",
      ef: "Sio ke ufọk, idaha idem mmo ikañ.",
      tv: "Se iven a mura, i gen u la."
    },
    {
      id: 3,
      en: "Healthy choices, happy lives.",
      yo: "Yiyan ilera, ìyè ayọ.",
      ig: "Nhọrọ ahụike, ndụ obi ụtọ.",
      ha: "Zaɓuɓɓukan lafiya, rayuwa mai farin ciki.",
      ef: "Ukpọkpọ idaha, idem anye ison.",
      tv: "Iora u a wen, a vegh u ken."
    }
  ];

  function showRandomQuote(lang = 'en') {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const text = q[lang] || q.en;
    if (quoteText) quoteText.textContent = text;
  }

  // Initialize
  showRandomQuote(quoteLang?.value || 'en');

  // Change on language select
  quoteLang?.addEventListener('change', (e) => {
    showRandomQuote(e.target.value || 'en');
  });

  // Also update quote every 30s for a bit of life
  setInterval(() => {
    showRandomQuote(quoteLang?.value || 'en');
  }, 30000);
})();
