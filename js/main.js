document.documentElement.classList.add("js");

const navLinks = document.getElementById("nav-links");
const toggle = document.querySelector(".nav-toggle");

function setMenu(open) {
  if (!navLinks || !toggle) return;
  navLinks.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.textContent = open ? "✕" : "☰";
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

if (toggle && navLinks) {
  toggle.addEventListener("click", () => {
    setMenu(!navLinks.classList.contains("open"));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("in");
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

(function showSentStatus() {
  if (!new URLSearchParams(location.search).has("sent")) return;
  const status = document.querySelector(".form-status");
  if (!status) return;
  status.hidden = false;
  status.textContent = location.pathname.includes("contact")
    ? "Dispatch received. We'll reply as soon as we can."
    : "You're on the watch. We'll be in touch.";
})();
