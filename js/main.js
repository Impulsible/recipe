// main.js - nav, dark mode, small helpers
document.addEventListener('DOMContentLoaded', () => {
  const openSidebar = document.getElementById('openSidebar');
  const closeSidebar = document.getElementById('closeSidebar');
  const sidebar = document.getElementById('sidebar');
  const darkToggle = document.getElementById('darkModeToggle');
  const yearEl = document.getElementById('year');

  // Year
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Sidebar toggle
  function open() { sidebar.classList.add('open'); sidebar.setAttribute('aria-hidden','false'); }
  function close(){ sidebar.classList.remove('open'); sidebar.setAttribute('aria-hidden','true'); }

  if (openSidebar) openSidebar.addEventListener('click', open);
  if (closeSidebar) closeSidebar.addEventListener('click', close);

  // Close sidebar on outside click (mobile)
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !openSidebar.contains(e.target)) {
      close();
    }
  });

  // Dark mode
  const darkKey = 'rf_dark_mode';
  const saved = localStorage.getItem(darkKey);
  if (saved === 'enabled') document.body.classList.add('dark');

  if (darkToggle) {
    darkToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const enabled = document.body.classList.contains('dark');
      darkToggle.setAttribute('aria-pressed', String(enabled));
      if (enabled) localStorage.setItem(darkKey, 'enabled'); else localStorage.removeItem(darkKey);
    });
  }

  // Keyboard accessibility: Escape closes sidebar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') sidebar.classList.remove('open');
  });

  // small helper to show notifications (toast)
  window.showToast = (msg) => {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    Object.assign(t.style, {position:'fixed',right:'16px',bottom:'18px',padding:'10px 14px',background:'#111',color:'#fff',borderRadius:'8px',zIndex:1000});
    document.body.appendChild(t);
    setTimeout(()=> t.remove(), 2800);
  };
});

// Footer dynamic year
document.getElementById("year").textContent = new Date().getFullYear();

// Last modified date
const lastModified = new Date(document.lastModified);
document.getElementById("lastModified").textContent =
  "Last modified: " + lastModified.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
