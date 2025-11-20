// sätt cookie
function setCookie(name, value, minutes) {
  const expires = new Date(Date.now() + minutes * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

//hämta cookie
function getCookie(name) {
  const cookies = document.cookie.split('; ');
  const cookie = cookies.find((c) => c.startsWith(name + '='));
  return cookie ? cookie.split('=')[1] : null;
}

//acceptera alla cookies
function acceptAll() {
  setCookie('consent', 'accepted', 1);
  document.getElementById('cookie-banner').style.display = 'none';
}

function acceptEssential() {
  setCookie('consent', 'accepted', 1);
  document.getElementById('cookie-banner').style.display = 'none';
}

//öppna inställningsmodal
function openSettings() {
  document.getElementById('cookie-banner').style.display = 'none';
  document.getElementById('cookie-settings').style.display = 'block';
}

//toggle switch
function toggleCookie(element, category) {
  element.classList.toggle('active');
}

// gå tillbaka till huvudbanner
function backToBanner() {
  document.getElementById('cookie-settings').style.display = 'none';
  document.getElementById('cookie-banner').style.display = 'block';
}

//kolla sidladdning
window.addEventListener('DOMContentLoaded', () => {
  const banner = document.getElementById('cookie-banner');
  banner.style.display = getCookie('consent') ? 'none' : 'block';

  //göm inställningsmodal vid sidladdning
  document.getElementById('cookie-settings').style.display = 'none';
});
