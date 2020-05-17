$(() => {
  $(".show-wizard").click(() => {
     ga('send', 'event', 'Menu', 'click-wizard');
    $("#welcomeModal").modal();
  });
  $("#help").click(() => {
     ga('send', 'event', 'Menu', 'click-help');
    $("#helpModal").modal();
  });

  $("#helpMessage").keyup(() => {
    if ($("#helpMessage")[0].checkValidity()) {
      $("#sendHelp").prop("disabled", false);
    } else {
      $("#sendHelp").prop("disabled", true);
    }
  });
  $("#sendHelp").click(() => {
     ga('send', 'event', 'Feedback', 'send-bug');
    $("#helpModal .modal-body").html(`
<h5 class="modal-title feedback-title">Message sent successfully.</h5>
<div class="row">
  <div class="col-sm">
    <button type="button" data-dismiss="modal" class="btn btn-link float-right">CLOSE</button>
  </div>
</div>
`);
  });
});
