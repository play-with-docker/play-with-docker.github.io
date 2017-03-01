$(document).ready(function () {
    var questions = {};
    if ($('p.quiz').length == 0) {
        return;
    }
    $('.post-content').append('<div id="quiz" class="carousel slide" data-interval="0" data-ride="carousel"><ol class="carousel-indicators"></ol><div class="carousel-inner" role="listbox"></div><a class="left carousel-control" href="#quiz" role="button" data-slide="prev"><span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span><span class="sr-only">Previous</span></a><a class="right carousel-control" href="#quiz" role="button" data-slide="next"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span><span class="sr-only">Next</span></a></div>');
    var items = $('.carousel-inner');

    $('p.quiz').each(function(index) {
        var $this = $(this);
        var options = $this.next();

        if (!options.is('ul')) {
            return;
        }

        var question = $(this).text();
        $this.wrap('<div class="item"><div class="container"><div class="carousel-caption"><h1>' + question + '</h1><div class="form-group" id="question' + index + '"></div></div></div></div>');
        var formGroup = $('#question' + index);

        $this.remove();

        var question = {expected: 0, correct: 0, wrong: 0};

        questions['question'+index] = question;
        options.find('li').each(function() {
            $this = $(this);
            var text = $this.text().trim();
            $this.text = '';
            if (text.startsWith('[ ]')) {
                formGroup.append('<div class="checkbox"><label class="control-label"><input type="checkbox" class="form-control-sm possible-answer" data-question="question' + index + '" data-answer="false" name="question-' + index + '">' + text.replace(/^\[ \]/, '') + '</label></div>');
            }
            if (text.startsWith('[x]')) {
                question.expected++;
                formGroup.append('<div class="checkbox"><label class="control-label"><input type="checkbox" class="form-control-sm possible-answer" data-question="question' + index + '" data-answer="true" name="question-' + index + '"> ' + text.replace(/^\[x\]/, '') + '</label></div>');
            }
            if (text.startsWith('( )')) {
                formGroup.append('<div class="radio"><label class="control-label"><input type="radio" class="form-control-sm possible-answer" data-question="question' + index + '" data-answer="false" name="question-' + index + '">' + text.replace(/^\( \)/, '') + '</label></div>');
            }
            if (text.startsWith('(x)')) {
                question.expected++;
                formGroup.append('<div class="radio"><label class="control-label"><input type="radio" class="form-control-sm possible-answer" data-question="question' + index + '" data-answer="true" name="question-' + index + '"> ' + text.replace(/^\(x\)/, '') + '</label></div>');
            }
        });
        options.remove();
        $('.carousel-indicators').append('<li data-target="#quiz" data-slide-to="' + index + '"></li>');
    });
    $('.item').appendTo('.carousel-inner');
    $('.item').first().addClass('active');
    $('.item .carousel-caption').last().append('<p><br/><a class="btn btn-lg btn-primary submit-quiz" href="#" role="button">Submit your answers</p>');
    $('ol.carousel-indicators li').first().addClass('active');

    $('a.submit-quiz').click(validateQuiz);


    function validateQuiz() {
        $('input.possible-answer').each(function(i, o) {
            var self = $(this);
            if (o.checked && self.attr('data-answer') == 'false') {
                self.parent().parent().addClass('quiz-error');
                questions[self.attr('data-question')].wrong++;
            } else if (o.checked && self.attr('data-answer') == 'true') {
                questions[self.attr('data-question')].correct++;
            }
            if (self.attr('data-answer') == 'true') {
                self.parent().parent().addClass('quiz-success');
            }
            self.prop('disabled', true);
        });

        var result = {correct: 0, total: 0};

        for (var i in questions) {
            var q = questions[i];

            result.total++;
            if (q.wrong == 0 && q.correct == q.expected) {
                result.correct++;
            }
        }

        var title = $('.post-title').text();
        var hashtags = 'dockerbday';
        var text = encodeURIComponent('I\'ve just completed the docker birthday tutorial ' + title + ' and got ' + result.correct + ' out of ' + result.total);

        $('a.submit-quiz').replaceWith('<h3>You\'ve got ' + result.correct + ' out of ' + result.total + '</h3><a class="twitter-share-button" href="https://twitter.com/intent/tweet?hashtags=' + hashtags + '&text=' + text + '" data-size="large">Tweet</a>');
        $.getScript('//platform.twitter.com/widgets.js');
    }
});
