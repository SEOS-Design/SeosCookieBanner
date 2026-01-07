const API_BASE_URL = 'http://127.0.0.1:3000';

let client_consent_id_cache = null;

const SHORT_LIVED_COOKIE_HOURS = 1;
const LONG_LIVED_COOKIE_DAYS = 30;
//========================================================================
// COOKIE HELPERS
//========================================================================

// genererates a new ID
function generateUUID() {
  return crypto.randomUUID();
}

// sets a cookie with a specified lifespan in days
// Kolla om det finns säkrare/enklare metod för att ändra tiden för cookies beroende på sidan.
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

// Element IDs for the different banners
const BANNER_ID = 'cookie-banner';
const SETTINGS_ID = 'cookie-settings';
const POLICY_ID = 'cookie-policy';

// Hides all banners and modals
function hideAllBanners() {
  document.getElementById(BANNER_ID).style.display = 'none';
  document.getElementById(SETTINGS_ID).style.display = 'none';
  document.getElementById(POLICY_ID).style.display = 'none';
}

// Shows the main cookie banner
function showCookieBanner() {
  hideAllBanners();
  document.getElementById(BANNER_ID).style.display = 'block';
}

// Shows the settings modal
function showSettingsModal() {
  hideAllBanners();
  document.getElementById(SETTINGS_ID).style.display = 'block';
}

// Shows the policy modal
function showPolicyModal() {
  hideAllBanners();
  document.getElementById(POLICY_ID).style.display = 'block';
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
    analytics_storage: payload.analytics ? 'granted' : 'denied',
    ad_storage: payload.marketing ? 'granted' : 'denied',
    functionality_storage: payload.functional ? 'granted' : 'denied',
    security_storage: payload.necessary ? 'granted' : 'granted',
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
    // Namnet MÅSTE matcha Custom Event Trigger i GTM
    gtag('event', 'consent_granted_full');
    console.log('[GTM] Firing custom event: consent_granted_full');
  }
}

// Inject specific third-party scripts (Optional, if not done via GTM).
function injectScriptsByConsent(payload) {
  // TODO: Lägg till manuell scriptinjektion här om du inte använder GTM för allt.
}
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
  element.classList.toggle('active');
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
  titleArea.innerText = 'Loading...';
  contentArea.innerHTML = '<p>Loading cookie policy...</p>';

  try {
    const response = await fetch(policyUrl);

    if (response.ok) {
      const data = await response.json();

      titleArea.innerText = `Cookie Policy - Version ${data.version}`;
      contentArea.innerHTML = data.content;
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
window.addEventListener('DOMContentLoaded', () => {
  // Get or create Client ID (for audit)
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
});
