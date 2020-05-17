const STORAGE_NAME = "zoom";
$(() => {
  const button = $(".toggle-zoom");
  const savedStatus = localStorage.getItem(STORAGE_NAME);

  button.on("click", () => {
    const wasActive = button.hasClass("active");

    document.body.style.zoom = wasActive ? 1 : 1.2;

    if (wasActive) {
      localStorage.removeItem(STORAGE_NAME);
    } else {
      localStorage.setItem(STORAGE_NAME, true);
    }
    setTimeout(() => pwd.resize(), 300);
    ga("send", "event", "Nav", "text-size", wasActive ? "enabled" : "disabled");
  });

  if (savedStatus) {
    button.click();
  }
});
