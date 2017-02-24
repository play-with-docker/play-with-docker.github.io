$(document).ready(function () {
    $('p.quiz').each(function(index) {
        var $this = $(this);
        var options = $this.next();

        if (!options.is('ul')) {
            return;
        }

        var question = $(this).text();
        $this.wrap('<div class="form-group"><label class="control-label">' + question + '</label></div>');
        var label = $this.parent();
        var formGroup = label.parent();

        $this.remove();

        options.find('li').each(function() {
            $this = $(this);
            var text = $this.text().trim();
            $this.text = '';
            if (text.startsWith('[ ]')) {
                formGroup.append('<div class="checkbox"><label><input type="checkbox" class="possible-answer" data-answer="false" name="question-' + index + '">' + text.replace(/^\[ \]/, '') + '</label></div>');
            }
            if (text.startsWith('[x]')) {
                formGroup.append('<div class="checkbox"><label><input type="checkbox" class="possible-answer" data-answer="true" name="question-' + index + '"> ' + text.replace(/^\[x\]/, '') + '</label></div>');
            }
            if (text.startsWith('( )')) {
                formGroup.append('<div class="radio"><label><input type="radio" class="possible-answer" data-answer="false" name="question-' + index + '">' + text.replace(/^\( \)/, '') + '</label></div>');
            }
            if (text.startsWith('(x)')) {
                formGroup.append('<div class="radio"><label><input type="radio" class="possible-answer" data-answer="true" name="question-' + index + '"> ' + text.replace(/^\(x\)/, '') + '</label></div>');
            }
        });
        options.remove();
        

        //console.log($this.after('<fieldset><legend>' + question + '</legend></fieldset>'));
    });

    $('p.quiz-submit').each(function() {
        $this = $(this);

        $this.replaceWith('<button type="button" class="btn btn-default submit-quiz">' + $this.text() + '</button>');
    });

    $('button.submit-quiz').click(validateQuiz);


    function validateQuiz() {
        $('input.possible-answer').each(function(i, o) {
            var self = $(this);
            if (o.checked && self.attr('data-answer') == 'false') {
                self.parent().parent().addClass('wrong-answer');
            }
            if (self.attr('data-answer') == 'true') {
                self.parent().parent().addClass('right-answer');
            }
        });
    }
});
