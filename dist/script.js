const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const navLinks = [...document.querySelectorAll('a[href^="#"]')];
const sections = [...document.querySelectorAll("main section[id]")];
const revealItems = [...document.querySelectorAll(".reveal")];

const setHeaderState = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 18);
};

const closeMenu = () => {
  if (!menuButton || !mobileMenu) return;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Abrir menu");
  mobileMenu.classList.remove("is-open");
  document.body.classList.remove("menu-open");
};

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
  mobileMenu?.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => closeMenu());
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 820) closeMenu();
});

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -6%" }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index % 3, 2) * 80}ms`;
  revealObserver.observe(item);
});

const activeNavObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll(".desktop-nav a").forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  { rootMargin: "-42% 0px -48%", threshold: 0 }
);

sections.forEach((section) => activeNavObserver.observe(section));

document.querySelector("[data-year]").textContent = new Date().getFullYear();
setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });
