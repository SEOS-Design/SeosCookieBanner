const PRODUCTION_API_URL = 'https://seos-cookie-banner-api.vercel.app';

// FUNCTION TO SE IF IT'S RUNNING ON LOCALHOST CURRENTLY
const isLocalhost =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

//CHOOSE THE RIGHT URL AUTOMATICALLY
const API_BASE_URL = isLocalhost ? 'http://127.0.0.1:3000' : PRODUCTION_API_URL;

let client_consent_id_cache = null;

const SHORT_LIVED_COOKIE_HOURS = 1;
const LONG_LIVED_COOKIE_DAYS = 30;

// Element IDs for the different banners
const BANNER_ID = 'cookie-banner';
const SETTINGS_ID = 'cookie-settings';
const POLICY_ID = 'cookie-policy';

//========================================================================
// HTML INJECTION for easy plug in
//========================================================================

// Function for loading DOMpurify dynamically and protect policy fetching from XSS attacks
async function ensureDOMPurify() {
  if (typeof DOMPurify !== 'undefined') return true;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/dompurify@3.0.6/dist/purify.min.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load DOMPurify'));
    document.head.appendChild(script);
  });
}

function injectStyles() {
  if (document.querySelector('link[href*="style.css"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = isLocalhost ? 'css/style.css' : 'https://seos-cookie-banner.vercel.app/css/style.css';
  document.head.appendChild(link);
}

function injectBannerHTML() {
  // if section already exists, dont inject again
  if (document.getElementById('cookie-sectionId')) return;

  const bannerHTML = `
    <section class="cookie-section " id="cookie-sectionId">
        <div class="cookie" id="${BANNER_ID}" style="display: flex;">
            <div class="cookie-header">
                <div class="cookie-icon-container">
                    <svg class="cookie-icon-svg" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 10C18.0222 10 16.0888 10.5865 14.4443 11.6853C12.7998 12.7841 11.5181 14.3459 10.7612 16.1732C10.0043 18.0004 9.8063 20.0111 10.1922 21.9509C10.578 23.8907 11.5304 25.6725 12.9289 27.0711C14.3275 28.4696 16.1093 29.422 18.0491 29.8079C19.9889 30.1937 21.9996 29.9957 23.8268 29.2388C25.6541 28.4819 27.2159 27.2002 28.3147 25.5557C29.4135 23.9112 30 21.9778 30 20C29.305 20.214 28.5648 20.2345 27.8591 20.0593C27.1533 19.8841 26.5087 19.5198 25.9945 19.0056C25.4803 18.4913 25.116 17.8467 24.9407 17.1409C24.7655 16.4352 24.786 15.695 25 15C24.305 15.214 23.5648 15.2345 22.8591 15.0593C22.1533 14.8841 21.5087 14.5198 20.9945 14.0056C20.4803 13.4913 20.116 12.8467 19.9407 12.1409C19.7655 11.4352 19.786 10.695 20 10Z" />
                        <path d="M16.5 16.5V16.51" /><path d="M24 23.5V23.51" /><path d="M20 20V20.01" /><path d="M19 25V25.01" /><path d="M15 22V22.01" />
                    </svg>
                </div>
                <h2>We value your privacy</h2>
            </div>
            <div class="cookie-content">
                <div class="cookie-body">
                    <p>We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                    <a class="policy-link" href="#" onclick="showPolicy(); return false;"> Read our Cookie policy</a></p>
                </div>
            </div>
            <div class="cookie-buttons">
                <button class="btn-customize" onclick="openSettings()">Customize
                    <svg class="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9.33334 11.3333H3.33334" /><path d="M12.6667 4.66666H6.66666" />
                        <path d="M11.3333 13.3333C12.4379 13.3333 13.3333 12.4379 13.3333 11.3333C13.3333 10.2288 12.4379 9.33334 11.3333 9.33334C10.2288 9.33334 9.33334 10.2288 9.33334 11.3333C9.33334 12.4379 10.2288 13.3333 11.3333 13.3333Z" />
                        <path d="M4.66666 6.66666C5.77123 6.66666 6.66666 5.77123 6.66666 4.66666C6.66666 3.56209 5.77123 2.66666 4.66666 2.66666C3.56209 2.66666 2.66666 3.56209 2.66666 4.66666C2.66666 5.77123 3.56209 6.66666 4.66666 6.66666Z" />
                    </svg>
                </button>
                <div class="main-actions">
                    <button class="btn-reject" onclick="acceptEssential()">Necessary only</button>
                    <button class="btn-save" onclick="acceptAll()">Accept all</button>
                </div>
            </div>
        </div>

        <div class="cookie" id="${SETTINGS_ID}" style="display: none;">
            <div class="cookie-header">
                <div class="cookie-icon-container">
                    <svg class="cookie-icon-svg" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 10C18.0222 10 16.0888 10.5865 14.4443 11.6853C12.7998 12.7841 11.5181 14.3459 10.7612 16.1732C10.0043 18.0004 9.8063 20.0111 10.1922 21.9509C10.578 23.8907 11.5304 25.6725 12.9289 27.0711C14.3275 28.4696 16.1093 29.422 18.0491 29.8079C19.9889 30.1937 21.9996 29.9957 23.8268 29.2388C25.6541 28.4819 27.2159 27.2002 28.3147 25.5557C29.4135 23.9112 30 21.9778 30 20C29.305 20.214 28.5648 20.2345 27.8591 20.0593C27.1533 19.8841 26.5087 19.5198 25.9945 19.0056C25.4803 18.4913 25.116 17.8467 24.9407 17.1409C24.7655 16.4352 24.786 15.695 25 15C24.305 15.214 23.5648 15.2345 22.8591 15.0593C22.1533 14.8841 21.5087 14.5198 20.9945 14.0056C20.4803 13.4913 20.116 12.8467 19.9407 12.1409C19.7655 11.4352 19.786 10.695 20 10Z" />
                        <path d="M16.5 16.5V16.51" /><path d="M24 23.5V23.51" /><path d="M20 20V20.01" /><path d="M19 25V25.01" /><path d="M15 22V22.01" />
                    </svg>
                </div>
                <h2>Cookie Settings</h2>
            </div>
            <div class="cookie-content" id="scroll-area">
                <div class="cookie-body">
                    <p>Manage your preferences below. Strictly necessary cookies are always active.</p>
                </div>
                <div id="settings-container" class="cookie-settings-container">
                    <div class="cookie-category-card">
                        <div class="category-text-wrapper">
                            <h5>Strictly Necessary <span class="badge">REQUIRED</span></h5>
                            <p>Essential for the website to function properly.</p>
                        </div>
                        <div class="toggle-switch always-active"><div class="toggle-slider"></div></div>
                    </div>
                    <div class="cookie-category-card" onclick="toggleCookie(this.querySelector('#performance-toggle'))">
                        <div class="category-text-wrapper">
                            <h5>Analytics and Performance</h5>
                            <p>Helps us understand how the website is used.</p>
                        </div>
                        <div class="toggle-switch" id="performance-toggle"><div class="toggle-slider"></div></div>
                    </div>
                    <div class="cookie-category-card" onclick="toggleCookie(this.querySelector('#functional-toggle'))">
                        <div class="category-text-wrapper">
                            <h5>Functional</h5>
                            <p>Remembers your personal preferences.</p>
                        </div>
                        <div class="toggle-switch" id="functional-toggle"><div class="toggle-slider"></div></div>
                    </div>
                    <div class="cookie-category-card" onclick="toggleCookie(this.querySelector('#marketing-toggle'))">
                        <div class="category-text-wrapper">
                            <h5>Marketing</h5>
                            <p>Used to deliver relevant ads and track visitors.</p>
                        </div>
                        <div class="toggle-switch" id="marketing-toggle"><div class="toggle-slider"></div></div>
                    </div>
                </div>
            </div>
            <div class="scroll-shadow" id="bottom-shadow"></div>
            <div class="cookie-buttons">
                <button class="btn-back" onclick="backToBanner()">Return</button>
                <div class="main-actions">
                    <button class="btn-reject" onclick="acceptEssential()">Necessary only</button>
                    <button class="btn-save" onclick="saveSettings()">Save preferences</button>
                </div>
            </div>
        </div>

        <div class="cookie" id="${POLICY_ID}" style="display: none;">
            <div class="cookie-header">
                <div class="cookie-icon-container">
                    <svg class="cookie-icon-svg" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 10C18.0222 10 16.0888 10.5865 14.4443 11.6853C12.7998 12.7841 11.5181 14.3459 10.7612 16.1732C10.0043 18.0004 9.8063 20.0111 10.1922 21.9509C10.578 23.8907 11.5304 25.6725 12.9289 27.0711C14.3275 28.4696 16.1093 29.422 18.0491 29.8079C19.9889 30.1937 21.9996 29.9957 23.8268 29.2388C25.6541 28.4819 27.2159 27.2002 28.3147 25.5557C29.4135 23.9112 30 21.9778 30 20C29.305 20.214 28.5648 20.2345 27.8591 20.0593C27.1533 19.8841 26.5087 19.5198 25.9945 19.0056C25.4803 18.4913 25.116 17.8467 24.9407 17.1409C24.7655 16.4352 24.786 15.695 25 15C24.305 15.214 23.5648 15.2345 22.8591 15.0593C22.1533 14.8841 21.5087 14.5198 20.9945 14.0056C20.4803 13.4913 20.116 12.8467 19.9407 12.1409C19.7655 11.4352 19.786 10.695 20 10Z" />
                        <path d="M16.5 16.5V16.51" /><path d="M24 23.5V23.51" /><path d="M20 20V20.01" /><path d="M19 25V25.01" /><path d="M15 22V22.01" />
                    </svg>
                </div>
                <h2 id="policy-version-title">Cookie Policy</h2>
            </div>
            <div class="cookie-content">
                <div id="policy-content-area"><p>Fetching latest policy..</p></div>
            </div>
            <div class="cookie-buttons">
                <button class="btn-save" onclick="closePolicy()">Close</button>
            </div>
        </div>
    </section>`;

  document.body.insertAdjacentHTML('beforeend', bannerHTML);

  const footerHTML = `
  <footer id="cookie-footer-container" style="position: static; width: 100%; padding: 40px 20px; text-align: center; display: block; clear: both;">
    <button class="cookie-settings-btn" onclick="openSettings()">Open cookie settings</button>
  </footer>`;
  document.body.insertAdjacentHTML('beforeend', footerHTML);
}

//========================================================================
// COOKIE HELPERS
//========================================================================

// genererates a new ID
function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  console.warn('[Crypto] randomUUID saknas, använder fallback-metod');
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// sets a cookie with a specified lifespan in days
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();

  //Security attributes
  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';

  //Warning in production without HTTPS
  if (
    !isSecure &&
    window.location.hostname !== '127.0.0.1' &&
    window.location.hostname !== 'localhost'
  ) {
    console.warn('[Security] Insecure cookie - deploy with HTTPS!');
  }
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax${secureFlag}`;
}

// Retrieves the value of a specific cookie by name
function getCookie(name) {
  const cookies = document.cookie.split('; ');
  const cookie = cookies.find((c) => c.startsWith(name + '='));
  return cookie ? cookie.split('=')[1] : null;
}

// Gets existing client ID from cookie OR creates a new one
// Sets 'client_consent_id' cookie to 365 days
function getOrCreateClientId() {
  if (client_consent_id_cache) {
    console.log('cache exists with: ', client_consent_id_cache);
    return client_consent_id_cache;
  }

  let clientId = getCookie('client_consent_id');
  console.log('Client ID: ', clientId);
  if (!clientId) {
    console.log('Generating new guid');
    clientId = generateUUID();
    setCookie('client_consent_id', clientId, 365);
    console.log('Setting cookie: ', clientId);
  }

  client_consent_id_cache = clientId;
  return clientId;
}

//========================================================================
// BANNER VISIBILITY CONTROL
//========================================================================

// Hides all banners and modals
function hideAllBanners() {
  document.getElementById(BANNER_ID).style.display = 'none';
  document.getElementById(SETTINGS_ID).style.display = 'none';
  document.getElementById(POLICY_ID).style.display = 'none';
}

// Shows the main cookie banner
function showCookieBanner() {
  hideAllBanners();
  document.getElementById(BANNER_ID).style.display = 'flex';
}

// Shows the settings modal
function showSettingsModal() {
  hideAllBanners();
  document.getElementById(SETTINGS_ID).style.display = 'flex';
}

// Shows the policy modal
function showPolicyModal() {
  hideAllBanners();
  document.getElementById(POLICY_ID).style.display = 'flex';
}

//========================================================================
// CONSENT PAYLOAD BUILDERS
//========================================================================

// Creates payload for 'Accept all'
function acceptAllConsent() {
  const clientId = getOrCreateClientId();

  return {
    necessary: true,
    analytics: true,
    marketing: true,
    functional: true,
    client_id: clientId,
    domain: window.location.hostname,
    status: 'all',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };
}

// Creates payload for 'Essential only'
function acceptEssentialConsent() {
  const clientId = getOrCreateClientId();

  return {
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
    client_id: clientId,
    domain: window.location.hostname,
    status: 'necessary_only',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };
}

//========================================================================
// BACKEND COMMUNICATION
//========================================================================

// Sends the consent payload to the backend for logging
async function saveConsentAndSend(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setCookie('consent_status', payload.status, LONG_LIVED_COOKIE_DAYS);

      const data = await response.json().catch(() => null);
      console.log('[Backend] Consent recorded successfully:', data);
    } else {
      console.error('[Backend] Consent POST failed, status:', response.status);

      const errorData = await response.json().catch(() => ({}));
      console.error('Error details:', errorData);
      return;
    }
  } catch (error) {
    console.error('[Backend] Network error - could not reach server:', error);
  }
}

//========================================================================
// Google consent mode
//========================================================================

// Sends the consent update signal to gtag
// Maps categories to GCM'S storage parameters
function applyGoogleConsentFromPayload(payload) {
  if (typeof gtag !== 'function') {
    console.warn('gtag is not defined, cannot apply consent');
    return;
  }
  gtag('consent', 'update', {
    // Button: Analytics and performance
    analytics_storage: payload.analytics ? 'granted' : 'denied',

    // Button: marketing
    ad_storage: payload.marketing ? 'granted' : 'denied',
    ad_user_data: payload.marketing ? 'granted' : 'denied',
    ad_personalization: payload.marketing ? 'granted' : 'denied',

    // Button: functional
    functionality_storage: payload.functional ? 'granted' : 'denied',
    personalization_storage: payload.functional ? 'granted' : 'denied',

    // Button: Strictly necessary
    security_storage: 'granted',
  });
  console.log('[Google] Consent mode updated:', {
    analytics: payload.analytics ? 'granted' : 'denied',
    marketing: payload.marketing ? 'granted' : 'denied',
    functional: payload.functional ? 'granted' : 'denied',
  });
}
// Sends a Custom Event to GTM to trigger tag firing (e.g., the GA4 tag).
// This is the signal that releases the blocked tag.
function triggerGTMConsentEvent() {
  if (typeof gtag === 'function') {
    // Naem must mach Custom Event Trigger i GTM
    gtag('event', 'consent_granted_full');
    console.log('[GTM] Firing custom event: consent_granted_full');
  }
}

// Inject specific third-party scripts (Optional, if not done via GTM).
function injectScriptsByConsent(payload) {}
//========================================================================
// USER ACTION HANDLERS
//========================================================================

function acceptAll() {
  const payload = acceptAllConsent();
  setCookie('consent_status', payload.status, SHORT_LIVED_COOKIE_HOURS / 24);
  hideAllBanners();
  applyGoogleConsentFromPayload(payload);
  triggerGTMConsentEvent();
  injectScriptsByConsent(payload);
  saveConsentAndSend(payload);
}

function acceptEssential() {
  const payload = acceptEssentialConsent();
  setCookie('consent_status', payload.status, SHORT_LIVED_COOKIE_HOURS / 24);
  hideAllBanners();
  applyGoogleConsentFromPayload(payload);
  saveConsentAndSend(payload);
}

//========================================================================
// CUSTOM SETTINGS HANDLER
//========================================================================

// Prepares ands shows teh settings modal by reading current cookie choices
function openSettings() {
  let choices = { analytics: false, marketing: false, functional: false };
  const choicesJson = getCookie('consent_choices');
  // Load existing choices if they exist
  if (choicesJson) {
    try {
      choices = JSON.parse(choicesJson);
    } catch (e) {
      console.error('Error parsing consent_choices cookie:', e);
    }
  } else {
    // If no choices, set current state based on consent_status if it exists
    const status = getCookie('consent_status');
    if (status === 'all') {
      choices = { analytics: true, marketing: true, functional: true };
    }
  }

  // Function for applying active class to toggles based on loaded choices
  const applyToggleState = (id, isActive) => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.toggle('active', isActive);
    }
  };

  // Apply the states to the actual html toggle elements
  applyToggleState('performance-toggle', choices.analytics);
  applyToggleState('marketing-toggle', choices.marketing);
  applyToggleState('functional-toggle', choices.functional);

  showSettingsModal();

  setTimeout(() => {
    checkScrollStatus();
  }, 10);
}

function checkScrollStatus() {
  const scrollArea = document.getElementById('scroll-area');
  const bottomShadow = document.getElementById('bottom-shadow');

  if (scrollArea && bottomShadow) {
    const hasScroll = scrollArea.scrollHeight > scrollArea.clientHeight;

    bottomShadow.style.opacity = hasScroll ? '1' : '0';

    scrollArea.onscroll = () => {
      const scrollBottom = scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight;

      if (scrollBottom < 15) {
        bottomShadow.style.opacity = '0';
      } else {
        bottomShadow.style.opacity = '1';
      }
    };
  }
}

function saveSettings() {
  const clientId = getOrCreateClientId();

  // Read toggle states from DOM
  const analytics =
    document.getElementById('performance-toggle')?.classList.contains('active') || false;
  const marketing =
    document.getElementById('marketing-toggle')?.classList.contains('active') || false;
  const functional =
    document.getElementById('functional-toggle')?.classList.contains('active') || false;

  // build the main payload
  const payload = {
    necessary: true,
    analytics: analytics,
    marketing: marketing,
    functional: functional,
    client_id: clientId,
    domain: window.location.hostname,
    status: 'custom',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };

  // Save detailed choices in a separate long lived cookie
  const choices = { analytics, marketing, functional };
  setCookie('consent_choices', JSON.stringify(choices), LONG_LIVED_COOKIE_DAYS);

  setCookie('consent_status', 'custom', SHORT_LIVED_COOKIE_HOURS / 24);

  // Apply Google consent mode
  applyGoogleConsentFromPayload(payload);

  if (analytics) {
    triggerGTMConsentEvent();
  }

  // Inject scripts based on custom payload
  // injectScriptsByConsent(payload);

  // Send to backend
  saveConsentAndSend(payload);

  // Hide modal
  hideAllBanners();
  console.log('[Settings] Custom choices saved:', choices);
}

// Back to main banner
function backToBanner() {
  showCookieBanner();
}

function closePolicy() {
  // If cookie exists, hide all. Otherwise, show banner again.
  if (getCookie('consent_status')) {
    hideAllBanners();
  } else {
    showCookieBanner();
  }
}

//toggle switch
function toggleCookie(element) {
  if (element) {
    element.classList.toggle('active');
  }
}

//========================================================================
// POLICY FETCHING
//========================================================================

async function showPolicy() {
  const domain = window.location.hostname;
  const policyUrl = `${API_BASE_URL}/consent/policy/latest?domain=${domain}`;

  showPolicyModal();

  const contentArea = document.getElementById('policy-content-area');
  const titleArea = document.getElementById('policy-version-title');

  // Show loading state
  contentArea.innerHTML = '<p>Loading cookie policy...</p>';

  try {
    await ensureDOMPurify();

    const response = await fetch(policyUrl);

    if (response.ok) {
      const data = await response.json();

      contentArea.innerHTML = DOMPurify.sanitize(data.content, {
        ADD_ATTR: ['target', 'rel'],
      });
    } else {
      titleArea.innerText = 'Could not load policy.';
      contentArea.innerHTML = `<p>Could not find an active policy for this domain</p>`;
    }
  } catch (error) {
    console.error('[Policy] Failed to fetch:', error);
    titleArea.innerText = 'Network Error';
    contentArea.innerHTML = `<p>Could not connect to the server to fetch policy.</p>`;
  }
}
//========================================================================
// INITIALIZATION
//========================================================================

function loadAndApplySavedConsent() {
  const consentStatus = getCookie('consent_status');

  if (!consentStatus) {
    console.log('[Init] No saved consent');
    return;
  }

  console.log('[Init] Found saved consent:', consentStatus);

  // Reconstruct consent payload (WITHOUT timestamp/client_id - we're not sending to backend)
  let payload;

  if (consentStatus === 'all') {
    payload = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      status: 'all',
    };
  } else if (consentStatus === 'necessary_only') {
    payload = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
      status: 'necessary_only',
    };
  } else if (consentStatus === 'custom') {
    const choicesJson = getCookie('consent_choices');
    if (choicesJson) {
      const choices = JSON.parse(choicesJson);
      payload = {
        necessary: true,
        analytics: choices.analytics || false,
        marketing: choices.marketing || false,
        functional: choices.functional || false,
        status: 'custom',
      };
    }
  }

  if (payload) {
    // Apply consent to Google (GTM will handle the rest)
    applyGoogleConsentFromPayload(payload);
    if (payload.analytics === true) {
      triggerGTMConsentEvent();
      injectScriptsByConsent(payload);
    }
  }
}

function initializeBanner() {
  injectStyles();
  injectBannerHTML();

  setTimeout(() => {
    getOrCreateClientId();

    loadAndApplySavedConsent();

    const consentStatus = getCookie('consent_status');
    if (consentStatus) {
      hideAllBanners();
      console.log('[Init] Consent found - banner hidden');
    } else {
      showCookieBanner();
      console.log('[Init] No consent - showing banner');
    }
  }, 50);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBanner);
} else {
  initializeBanner();
}
