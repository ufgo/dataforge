/**
 * DataForge GitHub Pages Interaction Scripts
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const headerLinks = document.querySelectorAll(".nav-link");
  const mobileLinks = document.querySelectorAll(".mobile-link");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const themeToggleBtn = document.getElementById("theme-toggle");
  
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mobileMenu = document.querySelector(".mobile-menu");
  
  // Docs Elements
  const docsLinks = document.querySelectorAll(".docs-link");
  const docSections = document.querySelectorAll(".doc-section");
  const docsSearchInput = document.getElementById("docs-search");
  
  // Subtabs (Themes/Extensions)
  const subTabBtns = document.querySelectorAll(".sub-tab-btn");
  const subTabPanes = document.querySelectorAll(".subtab-pane");
  const applyThemeBtns = document.querySelectorAll(".btn-theme-apply");

  // --- Theme Management ---
  const themes = ["dark-theme", "light-theme", "nordic-theme", "cyberpunk-theme"];
  
  function applyTheme(themeName) {
    // Remove all theme classes
    document.body.classList.remove(...themes);
    // Add current
    document.body.classList.add(themeName);
    localStorage.setItem("dataforge-theme", themeName);
  }

  // Load saved theme or default to dark
  const savedTheme = localStorage.getItem("dataforge-theme") || "dark-theme";
  applyTheme(savedTheme);

  // Header Theme Toggle button (toggles dark / light)
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const currentTheme = document.body.classList.contains("light-theme") ? "dark-theme" : "light-theme";
      applyTheme(currentTheme);
    });
  }

  // "Apply Theme" buttons on Theme Cards
  applyThemeBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const selectedTheme = e.target.getAttribute("data-theme-class");
      if (selectedTheme) {
        applyTheme(selectedTheme);
      }
    });
  });


  // --- Routing & Tab Switching (SPA) ---
  const tabMap = {
    "overview": "overview-tab",
    "docs": "docs-tab",
    "releases": "releases-tab",
    "themes-extensions": "themes-extensions-tab"
  };

  function switchTab(tabId) {
    const paneId = tabMap[tabId];
    if (!paneId) return;

    // Update active nav link classes
    headerLinks.forEach(link => {
      if (link.getAttribute("data-tab") === tabId) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    mobileLinks.forEach(link => {
      if (link.getAttribute("data-tab") === tabId) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Toggle panes visibility
    tabPanes.forEach(pane => {
      if (pane.id === paneId) {
        pane.classList.add("active");
      } else {
        pane.classList.remove("active");
      }
    });

    // Close mobile menu if open
    mobileMenu.classList.remove("open");
    mobileMenuBtn.classList.remove("active");
  }

  // Handle click on navigation links
  headerLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      const tabId = link.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  mobileLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      const tabId = link.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  // --- Mobile Menu Toggle ---
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("open");
      mobileMenuBtn.classList.toggle("active");
    });
  }


  // --- Docs Navigation & Section Toggle ---
  function switchDocSection(targetId) {
    // Standardize targetId (remove leading # if present)
    const cleanId = targetId.replace("#", "");
    
    // Toggle active section
    docSections.forEach(section => {
      if (section.id === `doc-${cleanId}`) {
        section.classList.add("active");
      } else {
        section.classList.remove("active");
      }
    });

    // Toggle active menu link
    docsLinks.forEach(link => {
      const linkHash = link.getAttribute("href").replace("#", "");
      if (linkHash === cleanId) {
        link.classList.add("active");
        // Auto expand parent chapter
        const chapter = link.closest(".docs-chapter");
        if (chapter && chapter.classList.contains("collapsed")) {
          chapter.classList.remove("collapsed");
        }
      } else {
        link.classList.remove("active");
      }
    });
  }

  docsLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      // Don't prevent default, let hash changes trigger it or handle manually
      const href = link.getAttribute("href");
      switchDocSection(href);
      
      // Scroll documentation content to top on mobile/tablet
      if (window.innerWidth <= 960) {
        document.querySelector(".docs-content").scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });


  // --- Docs Live Search Filter ---
  if (docsSearchInput) {
    docsSearchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();

      docsLinks.forEach(link => {
        const text = link.textContent.toLowerCase();
        const sectionId = link.getAttribute("href");
        const targetSection = document.getElementById(`doc-${sectionId.replace("#", "")}`);
        
        let sectionText = "";
        if (targetSection) {
          sectionText = targetSection.textContent.toLowerCase();
        }

        // Show/hide menu items based on query match in link text or section content
        const matches = text.includes(query) || sectionText.includes(query);
        const menuItem = link.parentElement;
        
        if (matches) {
          menuItem.style.display = "block";
        } else {
          menuItem.style.display = "none";
        }
      });
    });
  }


  // --- Sub-Tabs inside Themes & Extensions ---
  subTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetSubtab = btn.getAttribute("data-subtab");

      subTabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      subTabPanes.forEach(pane => {
        if (pane.id === `subtab-${targetSubtab}`) {
          pane.classList.add("active");
        } else {
          pane.classList.remove("active");
        }
      });
    });
  });


  // --- Hash-Based URL Routing (Supports direct links) ---
  function parseUrlHash() {
    const hash = window.location.hash; // e.g. #docs or #intro or #installation
    if (!hash) {
      switchTab("overview");
      return;
    }

    const cleanHash = hash.replace("#", "");

    // 1. Is it a main tab?
    if (tabMap[cleanHash]) {
      switchTab(cleanHash);
      if (cleanHash === "docs") {
        // Default to first doc section
        switchDocSection("intro");
      }
    } 
    // 2. Is it a doc section?
    else {
      // Find matching doc link
      let isDocSection = false;
      docsLinks.forEach(link => {
        if (link.getAttribute("href") === hash) {
          isDocSection = true;
        }
      });

      if (isDocSection) {
        switchTab("docs");
        switchDocSection(cleanHash);
      } else {
        // Fallback
        switchTab("overview");
      }
    }
  }

  // --- Language Management (Russian & English) ---
  const langToggleBtn = document.getElementById("lang-toggle");
  const mobileLangToggleBtn = document.getElementById("mobile-lang-toggle");

  function setLanguage(lang) {
    if (lang === "en") {
      document.body.classList.add("lang-en");
      document.title = "DataForge - Game Database Editor";
      localStorage.setItem("dataforge-lang", "en");
      // Update inputs placeholder
      document.querySelectorAll("[data-placeholder-en]").forEach(el => {
        el.placeholder = el.getAttribute("data-placeholder-en");
      });
    } else {
      document.body.classList.remove("lang-en");
      document.title = "DataForge - Редактор игровых баз данных";
      localStorage.setItem("dataforge-lang", "ru");
      // Update inputs placeholder
      document.querySelectorAll("[data-placeholder-ru]").forEach(el => {
        el.placeholder = el.getAttribute("data-placeholder-ru");
      });
    }
  }

  // Load saved language, auto-detect from browser settings, or default to Russian
  let savedLang = localStorage.getItem("dataforge-lang");
  if (!savedLang) {
    const browserLang = (navigator.language || navigator.userLanguage || "ru").toLowerCase();
    savedLang = browserLang.startsWith("en") ? "en" : "ru";
  }
  setLanguage(savedLang);

  if (langToggleBtn) {
    langToggleBtn.addEventListener("click", () => {
      const currentLang = document.body.classList.contains("lang-en") ? "ru" : "en";
      setLanguage(currentLang);
    });
  }

  if (mobileLangToggleBtn) {
    mobileLangToggleBtn.addEventListener("click", () => {
      const currentLang = document.body.classList.contains("lang-en") ? "ru" : "en";
      setLanguage(currentLang);
      if (mobileMenu) mobileMenu.classList.remove("open");
      if (mobileMenuBtn) mobileMenuBtn.classList.remove("active");
    });
  }

  // --- Docs Collapsible Chapters Click Handler ---
  const chapters = document.querySelectorAll(".docs-chapter");
  chapters.forEach(chapter => {
    const title = chapter.querySelector(".docs-chapter-title");
    if (title) {
      title.addEventListener("click", () => {
        chapter.classList.toggle("collapsed");
      });
    }
  });

  // --- Dynamic Next/Prev Documentation Navigation Footer ---
  const docSectionsList = Array.from(document.querySelectorAll(".doc-section"));
  docSectionsList.forEach((section, index) => {
    const prevSection = docSectionsList[index - 1];
    const nextSection = docSectionsList[index + 1];

    if (!prevSection && !nextSection) return;

    const navDiv = document.createElement("div");
    navDiv.className = "doc-section-nav";

    if (prevSection) {
      const prevId = prevSection.id.replace("doc-", "");
      const prevLink = document.querySelector(`.docs-link[href="#${prevId}"]`);
      if (prevLink) {
        const prevTitleHTML = prevLink.innerHTML;
        const prevBtn = document.createElement("a");
        prevBtn.href = `#${prevId}`;
        prevBtn.className = "doc-nav-btn doc-nav-prev";
        prevBtn.innerHTML = `
          <span class="arrow">←</span>
          <div class="nav-btn-info">
            <span class="nav-label" lang="ru">Назад</span><span class="nav-label" lang="en">Previous</span>
            <span class="nav-title">${prevTitleHTML}</span>
          </div>
        `;
        prevBtn.addEventListener("click", (e) => {
          e.preventDefault();
          switchDocSection(prevId);
          window.location.hash = prevId;
          if (window.innerWidth <= 960) {
            document.querySelector(".docs-content").scrollIntoView({ behavior: "smooth" });
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        });
        navDiv.appendChild(prevBtn);
      }
    }

    if (nextSection) {
      const nextId = nextSection.id.replace("doc-", "");
      const nextLink = document.querySelector(`.docs-link[href="#${nextId}"]`);
      if (nextLink) {
        const nextTitleHTML = nextLink.innerHTML;
        const nextBtn = document.createElement("a");
        nextBtn.href = `#${nextId}`;
        nextBtn.className = "doc-nav-btn doc-nav-next";
        nextBtn.innerHTML = `
          <div class="nav-btn-info">
            <span class="nav-label" lang="ru">Далее</span><span class="nav-label" lang="en">Next</span>
            <span class="nav-title">${nextTitleHTML}</span>
          </div>
          <span class="arrow">→</span>
        `;
        nextBtn.addEventListener("click", (e) => {
          e.preventDefault();
          switchDocSection(nextId);
          window.location.hash = nextId;
          if (window.innerWidth <= 960) {
            document.querySelector(".docs-content").scrollIntoView({ behavior: "smooth" });
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        });
        navDiv.appendChild(nextBtn);
      }
    }

    section.appendChild(navDiv);
  });

  // Listen for hash changes
  window.addEventListener("hashchange", parseUrlHash);
  
  // Initial routing on page load
  parseUrlHash();
});

