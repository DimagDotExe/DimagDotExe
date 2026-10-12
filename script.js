
(() => {
  "use strict";

  /*
   * SETUP:
   * Replace the empty string with your real contact email.
   * Example format: "hello@example.com"
   * Do not use an email address unless you own or control it.
   */
  const CONTACT_EMAIL = "";

  const menuToggle = document.getElementById("menu-toggle");
  const siteNav = document.getElementById("site-nav");
  const progressBar = document.getElementById("progress-bar");
  const yearElement = document.getElementById("current-year");
  const contactForm = document.getElementById("contact-form");
  const formStatus = document.getElementById("form-status");

  // Current copyright year.
  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }

  // Accessible mobile navigation.
  function closeMenu() {
    if (!menuToggle || !siteNav) return;

    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    siteNav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }

  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      const shouldOpen = !isOpen;

      menuToggle.setAttribute("aria-expanded", String(shouldOpen));
      menuToggle.setAttribute(
        "aria-label",
        shouldOpen ? "Close navigation" : "Open navigation"
      );

      siteNav.classList.toggle("is-open", shouldOpen);
      document.body.classList.toggle("menu-open", shouldOpen);
    });

    siteNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 680) closeMenu();
    });
  }

  // Scroll progress bar.
  let scrollFramePending = false;

  function updateScrollProgress() {
    if (!progressBar) return;

    const pageHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    const percentage =
      pageHeight > 0 ? (window.scrollY / pageHeight) * 100 : 0;

    progressBar.style.width =
      `${Math.min(100, Math.max(0, percentage))}%`;

    scrollFramePending = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!scrollFramePending) {
        window.requestAnimationFrame(updateScrollProgress);
        scrollFramePending = true;
      }
    },
    { passive: true }
  );

  updateScrollProgress();

  // Reveal sections when they enter the viewport.
  const revealItems = document.querySelectorAll(".reveal");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -30px 0px"
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  // Contact form: validate, then prepare an email.
  if (contactForm && formStatus) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      formStatus.textContent = "";

      if (!contactForm.reportValidity()) return;

      const formData = new FormData(contactForm);
      const name = String(formData.get("name") || "").trim();
      const senderEmail = String(formData.get("email") || "").trim();
      const topic = String(formData.get("topic") || "").trim();
      const message = String(formData.get("message") || "").trim();

      if (!name || !senderEmail || !topic || !message) {
        formStatus.textContent = "Please complete every field before continuing.";
        return;
      }

      if (!CONTACT_EMAIL.trim()) {
        formStatus.textContent =
          "The website owner has not configured a contact email yet. " +
          "Please use one of the official social profile links on this page.";
        return;
      }

      const subject = `[DIMAG.exe] ${topic}`;
      const body = [
        `Name: ${name}`,
        `Reply email: ${senderEmail}`,
        `Enquiry type: ${topic}`,
        "",
        "Message:",
        message
      ].join("\n");

      const mailto =
        `mailto:${CONTACT_EMAIL.trim()}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;

      formStatus.textContent =
        "Your email app should open with the message prepared. Review it and press Send there.";

      window.location.href = mailto;
    });
  }
})();
