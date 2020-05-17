const $postContent = $(".post.content");
const $contentPanel = $(".panel-left");
const $progressBar = $(".progress-bar");

var hideProgressBarDebounced = _.debounce(() => {
  $progressBar.hide(500);
}, 1000);

function scrollHandler() {
  $progressBar.show();

  const scrollTop = $postContent.scrollTop();
  const scrollHeight = $postContent.prop("scrollHeight");
  const height = $postContent.height();
  const progress = ((scrollTop + height) / scrollHeight) * 100;
  const readProgress = Math.ceil(scrollTop ? progress : 0);

  const maxWidth = $contentPanel.position().left + $contentPanel.width();
  const progressInPx = (readProgress * maxWidth) / 100;

  $progressBar.width(progressInPx);
  $progressBar.attr("data-progress", readProgress || null);
  hideProgressBarDebounced();
}

$(() => {
  $postContent.on("scroll", scrollHandler);
  $(window).on("resize", scrollHandler);
});
