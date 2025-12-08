const API_BASE_URL = 'http://127.0.0.1:3000';

let client_consent_id_cache = null;

function generateUUID() {
  return crypto.randomUUID();
}
// sätt cookie
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

//hämta cookie
function getCookie(name) {
  const cookies = document.cookie.split('; ');
  const cookie = cookies.find((c) => c.startsWith(name + '='));
  return cookie ? cookie.split('=')[1] : null;
}

//
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
    // Sätt cookien till 365 dagar
    setCookie('client_consent_id', clientId, 365);
    console.log('Setting cookie: ', clientId);
  }

  client_consent_id_cache = clientId;
  return clientId;
}

//payload för accept all cookies
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
    policyVersion: '1.0',
    userAgent: navigator.userAgent,
  };
}

//spara payload och skicka till backend för accept all cookies
function saveConsentAndSend(payload) {
  setCookie('consent_status', payload.status, 30);

  fetch(`${API_BASE_URL}/consent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (!res.ok) {
        console.error('Consent POST failed, status:', res.status);
        setCookie('consent_status', '', 0);
      }
      return res.json().catch(() => null);
    })
    .then((data) => {
      console.log('response from backend:', data);
    })
    .catch((err) => {
      console.error('Could not send consent to backend:', err);
      setCookie('consent_status', '', 0);
    });
}

//acceptera alla cookies
function acceptAll() {
  const payload = acceptAllConsent();
  saveConsentAndSend(payload);
  document.getElementById('cookie-banner').style.display = 'none';
}

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
    policyVersion: '1.0',
    userAgent: navigator.userAgent,
  };
}

function acceptEssential() {
  const payload = acceptEssentialConsent();
  saveConsentAndSend(payload);
  document.getElementById('cookie-banner').style.display = 'none';
}

//öppna inställningsmodal
function openSettings() {
  document.getElementById('cookie-banner').style.display = 'none';
  document.getElementById('cookie-policy').style.display = 'none';
  document.getElementById('cookie-settings').style.display = 'block';
}

//toggle switch
function toggleCookie(element) {
  element.classList.toggle('active');
}

// gå tillbaka till huvudbanner
function backToBanner() {
  document.getElementById('cookie-settings').style.display = 'none';
  document.getElementById('cookie-banner').style.display = 'block';
}

function closePolicy() {
  document.getElementById('cookie-policy').style.display = 'none';

  if (!getCookie('consent_status')) {
    document.getElementById('cookie-banner').style.display = 'block';
  }
}

async function showPolicy() {
  const domain = window.location.hostname;

  const policyUrl = `${API_BASE_URL}/consent/policy/latest?domain=${domain}`;

  const policyModal = document.getElementById('cookie-policy');
  const contentArea = document.getElementById('policy-content-area');
  const titleArea = document.getElementById('policy-version-title');

  document.getElementById('cookie-banner').style.display = 'none';
  document.getElementById('cookie-settings').style.display = 'none';

  policyModal.style.display = 'block';
  // contentArea.innerHTML = 'Hämtar policytext...';
  titleArea.innerText = 'Laddar...';

  try {
    const response = await fetch(policyUrl);

    if (response.ok) {
      const data = await response.json();

      titleArea.innerText = `Cookie Policy - Version ${data.version}`;
      contentArea.innerHTML = data.content;
    } else {
      titleArea.innerText = 'Kunde inte ladda policy.';
      contentArea.innerHTML = `<p>Kunde inte hitta  en aktiv policy för denna domän</p>`;
    }
  } catch (error) {
    titleArea.innerText = 'Nätverksfel';
    contentArea.innerHTML = `<p>Kunde inte ansluta till servern för att hämta policy.</p>`;
  }
}

//kolla sidladdning
window.addEventListener('DOMContentLoaded', () => {
  getOrCreateClientId();

  const banner = document.getElementById('cookie-banner');
  banner.style.display = getCookie('consent_status') ? 'none' : 'block';

  document.getElementById('cookie-settings').style.display = 'none';
  document.getElementById('cookie-policy').style.display = 'none';
});
