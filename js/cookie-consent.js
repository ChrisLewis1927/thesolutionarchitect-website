(function() {
  'use strict';

  var GA_ID = 'G-DF1MYHFXP4';
  var CONSENT_KEY = 'cookie-consent';

  function loadGoogleAnalytics() {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  function showBanner() {
    var banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.style.cssText = 'position:fixed; bottom:0; left:0; right:0; z-index:10000; background:#1B2430; color:#fff; padding:16px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; font-family:Inter,sans-serif; font-size:14px; box-shadow:0 -2px 10px rgba(0,0,0,0.2);';

    banner.innerHTML = '<p style="margin:0; flex:1; line-height:1.5;">This site uses cookies for analytics to understand how visitors use the site. No personal data is collected. <a href="/privacy.html" style="color:#4A6CF7; text-decoration:underline;">Privacy policy</a></p>' +
      '<div style="display:flex; gap:8px; flex-shrink:0;">' +
        '<button id="cookie-reject-btn" style="padding:8px 16px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; border-radius:4px; cursor:pointer; font-size:14px; font-family:inherit;">Reject</button>' +
        '<button id="cookie-accept-btn" style="padding:8px 16px; border:none; background:#4A6CF7; color:#fff; border-radius:4px; cursor:pointer; font-size:14px; font-family:inherit; font-weight:600;">Accept</button>' +
      '</div>';

    document.body.appendChild(banner);

    document.getElementById('cookie-accept-btn').addEventListener('click', function() {
      localStorage.setItem(CONSENT_KEY, 'accepted');
      loadGoogleAnalytics();
      hideBanner();
    });

    document.getElementById('cookie-reject-btn').addEventListener('click', function() {
      localStorage.setItem(CONSENT_KEY, 'rejected');
      hideBanner();
    });
  }

  function hideBanner() {
    var banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      banner.remove();
    }
  }

  // Global function to reset cookie preferences (for privacy page)
  window.resetCookieConsent = function() {
    localStorage.removeItem(CONSENT_KEY);
    hideBanner();
    showBanner();
  };

  // Initialise on page load
  var consent = localStorage.getItem(CONSENT_KEY);
  if (consent === 'accepted') {
    loadGoogleAnalytics();
  } else if (!consent) {
    // No preference stored — show the banner
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
  // If 'rejected', do nothing — no GA, no banner
})();
