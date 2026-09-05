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

function bindForm(form, successText) {
  if (!form) return;
  const status = form.querySelector(".form-status") || form.parentElement.querySelector(".form-status");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (status) {
      status.hidden = false;
      status.textContent = successText;
    }
    form.reset();
  });
}

bindForm(document.querySelector(".watch-form"), "You're on the watch. We'll be in touch.");
bindForm(document.getElementById("contact-form"), "Dispatch received. We'll reply as soon as we can.");
