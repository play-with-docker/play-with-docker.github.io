const NEUTRAL = "neutral";
const POSITIVE = "positive";
const NEGATIVE = "negative";

function showFeedback(type, message, settings = {}) {
  // hide any selected feedback
  const $currentlySelected = $(".feedback-footer-item:visible");
  const $feedbackItem = $(".feedback-footer-item-" + type);
  
  $currentlySelected.hide();
  $feedbackItem.show(500);

  const $feedbackItemLabel = $feedbackItem.find(".feedback-footer-item-label");

  $feedbackItemLabel.text(message);
  
  if(!settings.dontHide){
    setTimeout(() => $feedbackItem.hide(500), 5000);
  }
}

const feedbackFooter = {
  neutralFeedback: (...args) => showFeedback(NEUTRAL, ...args),
  positiveFeedback: (...args) => showFeedback(POSITIVE, ...args),
  negativeFeedback: (...args) => showFeedback(NEGATIVE, ...args)
};

window.feedbackFooter = feedbackFooter;
