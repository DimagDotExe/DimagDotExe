
(() => {
  "use strict";

  /* =========================================
     DIMAG.exe — Main Frontend Controller
     Contact: contact.dimag.exe@gmail.com
     ========================================= */

  const CONFIG = Object.freeze({
    contactEmail: "contact.dimag.exe@gmail.com",
    selectors: {
      menuToggle:
        "#menuToggle, #menu-toggle, .menu-toggle, [data-menu-toggle]",
      nav:
        "#navLinks, #nav-links, .nav-links, [data-nav-links]",
      progress:
        "#scrollProgress, #scroll-progress, .scroll-progress, [data-scroll-progress]",
      reveal:
        "[data-reveal], .reveal",
      year:
        "#year, #currentYear, [data-current-year]",
      form:
        "#contactForm, #contact-form, [data-contact-form], form.contact-form",
      formStatus:
        "#formStatus, #form-status, [data-form-status]"
    }
  });

  const SELECTORS = CONFIG.selectors;

  const query = (selector, root = document) =>
    root.querySelector(selector);

  const queryAll = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  /* -----------------------------------------
     1. CURRENT YEAR
     ----------------------------------------- */

  function initCurrentYear() {
    const year = String(new Date().getFullYear());

    queryAll(SELECTORS.year).forEach((element) => {
      element.textContent = year;
    });
  }

  /* -----------------------------------------
     2. RESPONSIVE MOBILE NAVIGATION
     ----------------------------------------- */

  function initNavigation() {
    const toggle = query(SELECTORS.menuToggle);
    const nav = query(SELECTORS.nav);

    if (!toggle || !nav) return;

    const isOpen = () =>
      toggle.getAttribute("aria-expanded") === "true";

    function setMenuState(open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute(
        "aria-label",
        open ? "Close navigation menu" : "Open navigation menu"
      );

      nav.classList.toggle("is-open", open);
      nav.classList.toggle("open", open);

      document.body.classList.toggle("menu-open", open);
    }

    toggle.addEventListener("click", () => {
      setMenuState(!isOpen());
    });

    queryAll("a", nav).forEach((link) => {
      link.addEventListener("click", () => {
        setMenuState(false);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) {
        setMenuState(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (
        isOpen() &&
        !nav.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
        setMenuState(false);
      }
    });

    const desktopQuery = window.matchMedia("(min-width: 769px)");

    desktopQuery.addEventListener("change", (event) => {
      if (event.matches) {
        setMenuState(false);
      }
    });

    setMenuState(false);
  }

  /* -----------------------------------------
     3. SCROLL PROGRESS INDICATOR
     ----------------------------------------- */

  function initScrollProgress() {
    const indicators = queryAll(SELECTORS.progress);

    if (!indicators.length) return;

    let scheduled = false;

    function updateProgress() {
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      const progress =
        scrollableHeight > 0
          ? Math.min(
              100,
              Math.max(0, (window.scrollY / scrollableHeight) * 100)
            )
          : 0;

      indicators.forEach((indicator) => {
        indicator.style.width = `${progress}%`;
        indicator.style.transformOrigin = "left center";
        indicator.setAttribute("aria-valuenow", String(Math.round(progress)));
      });

      scheduled = false;
    }

    function requestUpdate() {
      if (scheduled) return;

      scheduled = true;
      window.requestAnimationFrame(updateProgress);
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });

    updateProgress();
  }

  /* -----------------------------------------
     4. SCROLL REVEAL ANIMATIONS
     ----------------------------------------- */

  function initRevealAnimations() {
    const elements = queryAll(SELECTORS.reveal);

    if (!elements.length) return;

    if (
      prefersReducedMotion.matches ||
      !("IntersectionObserver" in window)
    ) {
      elements.forEach((element) => {
        element.classList.add("is-visible");
        element.classList.add("visible");
      });

      return;
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          entry.target.classList.add("visible");

          currentObserver.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin: "0px 0px -48px 0px",
        threshold: 0.08
      }
    );

    elements.forEach((element) => {
      observer.observe(element);
    });
  }

  /* -----------------------------------------
     5. CONTACT FORM
     Opens a prefilled email draft.
     No server or database is implied.
     ----------------------------------------- */

  function initContactForm() {
    const form = query(SELECTORS.form);

    if (!form) return;

    const statusElement = query(SELECTORS.formStatus, form) ||
      query(SELECTORS.formStatus);

    const submitButton = query(
      'button[type="submit"], input[type="submit"]',
      form
    );

    const field = (name) => {
      const namedField = form.elements.namedItem(name);

      if (namedField && typeof namedField.value === "string") {
        return namedField;
      }

      return query(`[name="${name}"]`, form);
    };

    const nameField = field("name");
    const emailField = field("email");
    const topicField = field("topic");
    const messageField = field("message");

    function setStatus(message, type = "info") {
      if (!statusElement) return;

      statusElement.textContent = message;
      statusElement.setAttribute("role", "status");
      statusElement.setAttribute("aria-live", "polite");
      statusElement.dataset.state = type;
    }

    function cleanValue(element) {
      return element ? element.value.trim() : "";
    }

    function getFormData() {
      return {
        name: cleanValue(nameField),
        email: cleanValue(emailField),
        topic: cleanValue(topicField),
        message: cleanValue(messageField)
      };
    }

    function validateData(data) {
      if (!data.name) {
        setStatus("Please enter your name.", "error");
        nameField?.focus();
        return false;
      }

      if (!data.email) {
        setStatus("Please enter your email address.", "error");
        emailField?.focus();
        return false;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(data.email)) {
        setStatus("Please enter a valid email address.", "error");
        emailField?.focus();
        return false;
      }

      if (!data.message) {
        setStatus("Please enter a message.", "error");
        messageField?.focus();
        return false;
      }

      if (data.name.length > 150) {
        setStatus("Please shorten your name to 150 characters or fewer.", "error");
        nameField?.focus();
        return false;
      }

      if (data.message.length > 10000) {
        setStatus("Your message is too long. Please keep it under 10,000 characters.", "error");
        messageField?.focus();
        return false;
      }

      return true;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (typeof form.reportValidity === "function" && !form.reportValidity()) {
        setStatus("Please check the required fields.", "error");
        return;
      }

      const data = getFormData();

      if (!validateData(data)) return;

      const subjectParts = ["DIMAG.exe website enquiry"];

      if (data.topic) {
        subjectParts.push(data.topic);
      }

      const subject = subjectParts.join(" — ");

      const body = [
        "Hello DIMAG.exe,",
        "",
        data.message,
        "",
        "------------------------------",
        `Name: ${data.name}`,
        `Reply email: ${data.email}`,
        `Topic: ${data.topic || "General enquiry"}`,
        "",
        "Sent using the DIMAG.exe website contact form."
      ].join("\n");

      const mailtoURL =
        `mailto:${CONFIG.contactEmail}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;

      setStatus(
        "Your email draft is ready. If your email app does not open, use the email link below.",
        "success"
      );

      if (submitButton) {
        submitButton.blur();
      }

      /*
       * Opens the visitor's configured email application.
       * The visitor must review and send the message themselves.
       */
      window.location.href = mailtoURL;
    });

    /*
     * Clear the previous error when a visitor edits a field.
     */
    [nameField, emailField, topicField, messageField]
      .filter(Boolean)
      .forEach((element) => {
        element.addEventListener("input", () => {
          if (statusElement?.dataset.state === "error") {
            setStatus("", "info");
          }
        });
      });
  }

  /* -----------------------------------------
     6. EXTERNAL LINKS
     Keeps links opening new tabs safer.
     ----------------------------------------- */

  function initExternalLinks() {
    queryAll('a[target="_blank"]').forEach((link) => {
      const relValues = new Set(
        (link.getAttribute("rel") || "")
          .split(/\s+/)
          .filter(Boolean)
      );

      relValues.add("noopener");
      relValues.add("noreferrer");

      link.setAttribute("rel", Array.from(relValues).join(" "));
    });
  }

  /* -----------------------------------------
     7. ANCHOR NAVIGATION
     Respects reduced-motion preferences.
     ----------------------------------------- */

  function initAnchorNavigation() {
    queryAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");

        if (!href || href === "#") return;

        let target;

        try {
          target = document.querySelector(href);
        } catch {
          return;
        }

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
          behavior: prefersReducedMotion.matches ? "auto" : "smooth",
          block: "start"
        });

        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
        }

        target.focus({ preventScroll: true });

        /*
         * Keep the browser URL aligned with the selected section.
         */
        if (window.history && window.history.pushState) {
          window.history.pushState(null, "", href);
        }
      });
    });
  }

  /* -----------------------------------------
     8. INITIALIZE
     ----------------------------------------- */

  function init() {
    initCurrentYear();
    initNavigation();
    initScrollProgress();
    initRevealAnimations();
    initContactForm();
    initExternalLinks();
    initAnchorNavigation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
