---
---
window.addEventListener('beforeunload', function (e) {
  navigator.sendBeacon("{{site.pwdurl}}/sessions/" + pwd.sessionId + "/close");
  // Cancel the event
  e.preventDefault();
  // Chrome requires returnValue to be set
  e.returnValue = '';
});
