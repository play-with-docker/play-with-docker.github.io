function getSelectedTermInstance() {
  return Object.keys(pwd.instances)
    .map(k => pwd.instances[k])
    .find(i =>
      $(i.terms[0].element)
        .parent()
        .hasClass("active")
    );
}

$(() => {
  var myDropzone = new Dropzone(".import-file-button", {
    headers: { "Cache-Control": "" },
    url() {
      const instance = getSelectedTermInstance();
      const uploadURL =
        pwd.opts.baseUrl +
        "/sessions/" +
        instance.session_id +
        "/instances/" +
        instance.name +
        "/uploads";
      return uploadURL;
    },
    sending(file) {
      feedbackFooter.neutralFeedback("Uploading file", { dontHide: true });
    },
    success(file) {
      feedbackFooter.positiveFeedback("File uploaded successfully");
    },
    error(file) {
      feedbackFooter.negativeFeedback(
        "Something went wrong. Please try again."
      );
    },
    addedfile(file) {
     ga('send', 'event', 'Nav', 'file-added', file.name);
    }
  });
});
