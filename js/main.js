/* ============================================
   The Solution Architect - Main JavaScript
   thesolutionarchitect.uk
   ============================================ */

(function () {
  'use strict';

  // --- Mobile Menu Toggle ---
  function initMobileMenu() {
    const nav = document.querySelector('.nav');
    const toggle = document.querySelector('.nav__toggle');

    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      nav.classList.toggle('nav--open');
      const isOpen = nav.classList.contains('nav--open');
      toggle.setAttribute('aria-expanded', isOpen);
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    // Close menu when clicking a link
    const navLinks = nav.querySelectorAll('.nav__link');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('nav--open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu on escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
        nav.classList.remove('nav--open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // --- Scroll-based Fade-in Animations ---
  function initScrollAnimations() {
    var elements = document.querySelectorAll('.fade-in');
    if (!elements.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // --- Infographic Gallery Filtering ---
  function initGalleryFilters() {
    var filterBtns = document.querySelectorAll('.filter-btn');
    var galleryItems = document.querySelectorAll('.gallery-item');

    if (!filterBtns.length || !galleryItems.length) return;

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = this.getAttribute('data-filter');

        // Update active button
        filterBtns.forEach(function (b) {
          b.classList.remove('filter-btn--active');
        });
        this.classList.add('filter-btn--active');

        // Filter items
        galleryItems.forEach(function (item) {
          var series = item.getAttribute('data-series');
          if (filter === 'all' || series === filter) {
            item.style.display = '';
            item.style.opacity = '0';
            item.style.transform = 'translateY(10px)';
            setTimeout(function () {
              item.style.opacity = '1';
              item.style.transform = 'translateY(0)';
            }, 50);
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  // --- Lightbox ---
  function initLightbox() {
    var lightbox = document.querySelector('.lightbox');
    if (!lightbox) return;

    var lightboxImage = lightbox.querySelector('.lightbox__image');
    var lightboxTitle = lightbox.querySelector('.lightbox__title');
    var lightboxClose = lightbox.querySelector('.lightbox__close');
    var triggers = document.querySelectorAll('[data-lightbox]');

    function openLightbox(src, title) {
      lightboxImage.src = src;
      lightboxImage.alt = title || 'Infographic';
      if (lightboxTitle) lightboxTitle.textContent = title || '';
      lightbox.classList.add('lightbox--open');
      document.body.style.overflow = 'hidden';
      lightboxClose.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('lightbox--open');
      document.body.style.overflow = '';
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var src = this.getAttribute('data-lightbox');
        var title = this.getAttribute('data-title') || '';
        openLightbox(src, title);
      });

      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var src = this.getAttribute('data-lightbox');
          var title = this.getAttribute('data-title') || '';
          openLightbox(src, title);
        }
      });
    });

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('lightbox--open')) {
        closeLightbox();
      }
    });
  }

  // --- Smooth Scroll for Anchor Links ---
  function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (href === '#') return;

        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          var headerHeight = document.querySelector('.header').offsetHeight || 72;
          var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
      });
    });
  }

  // --- Active Navigation Highlight ---
  function initActiveNav() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var navLinks = document.querySelectorAll('.nav__link');

    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === currentPage) {
        link.classList.add('nav__link--active');
      }
    });
  }

  // --- Initialize Everything ---
  function init() {
    initMobileMenu();
    initScrollAnimations();
    initGalleryFilters();
    initLightbox();
    initSmoothScroll();
    initActiveNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
