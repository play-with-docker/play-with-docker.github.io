"use strict";

addEventListener("load", () => {
    let questions = {};
    const paragraphs = document.querySelectorAll('p.quiz');

    if (paragraphs.length == 0) {
        return;
    }

    const carouselHTML = `
        <div id="quiz" class="carousel slide" data-interval="0" data-ride="carousel">
            <ol class="carousel-indicators"></ol>
            <div class="carousel-inner" role="listbox"></div>
            <a class="left carousel-control" href="#quiz" role="button" data-slide="prev">
                <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
                <span class="sr-only">Previous</span>
            </a>
            <a class="right carousel-control" href="#quiz" role="button" data-slide="next">
                <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>
                <span class="sr-only">Next</span>
            </a>
        </div>
    `;

    document.querySelector('.post-content').insertAdjacentHTML('beforeend', carouselHTML);

    paragraphs.forEach((paragraph, index) => {
        const options = paragraph.nextElementSibling;

        if (!options || options.tagName !== 'UL') {
            return;
        }

        const question = paragraph.textContent;
        paragraph.outerHTML = `
            <div class="item">
                <div class="container">
                    <div class="carousel-caption">
                        <h1>${question}</h1>
                        <div class="form-group" id="question${index}"></div>
                    </div>
                </div>
            </div>
        `;
        const formGroup = document.getElementById(`question${index}`);

        options.querySelectorAll('li').forEach(option => {
            const text = option.textContent.trim();
            option.textContent = '';

            if (text.startsWith('[ ]')) {
                formGroup.insertAdjacentHTML('beforeend', `<div class="checkbox"><label class="control-label"><input type="checkbox" class="form-control-sm possible-answer" data-question="question${index}" data-answer="false" name="question-${index}">${text.replace(/^\[ \]/, '')}</label></div>`);
            } else if (text.startsWith('[x]')) {
                formGroup.insertAdjacentHTML('beforeend', `<div class="checkbox"><label class="control-label"><input type="checkbox" class="form-control-sm possible-answer" data-question="question${index}" data-answer="true" name="question-${index}"> ${text.replace(/^\[x\]/, '')}</label></div>`);
                questions[`question${index}`] = { expected: 1, correct: 0, wrong: 0 };
            } else if (text.startsWith('( )')) {
                formGroup.insertAdjacentHTML('beforeend', `<div class="radio"><label class="control-label"><input type="radio" class="form-control-sm possible-answer" data-question="question${index}" data-answer="false" name="question-${index}">${text.replace(/^\( \)/, '')}</label></div>`);
            } else if (text.startsWith('(x)')) {
                formGroup.insertAdjacentHTML('beforeend', `<div class="radio"><label class="control-label"><input type="radio" class="form-control-sm possible-answer" data-question="question${index}" data-answer="true" name="question-${index}"> ${text.replace(/^\(x\)/, '')}</label></div>`);
                questions[`question${index}`] = { expected: 1, correct: 0, wrong: 0 };
            }
        });

        options.remove();
        document.querySelector('.carousel-indicators').insertAdjacentHTML('beforeend', `<li data-target="#quiz" data-slide-to="${index}"></li>`);
    });

    document.querySelectorAll('.item').forEach(item => {
        item.parentNode.querySelector('.carousel-inner').appendChild(item);
    });

    document.querySelector('.item').classList.add('active');
    document.querySelector('.item:last-child .carousel-caption').insertAdjacentHTML('beforeend', '<p><br/><a class="btn btn-lg btn-primary submit-quiz" href="#" role="button">Submit your answers</p>');
    document.querySelector('ol.carousel-indicators li').classList.add('active');
    document.querySelector('a.submit-quiz').addEventListener('click', validateQuiz);

    function validateQuiz() {
        document.querySelectorAll('input.possible-answer').forEach(input => {
            const self = input;
            const parent = self.parentElement.parentElement;
            const dataQuestion = self.getAttribute('data-question');
            const dataAnswer = self.getAttribute('data-answer');

            if (self.checked && dataAnswer === 'false') {
                parent.classList.add('quiz-error');
                questions[dataQuestion].wrong++;
            } else if (self.checked && dataAnswer === 'true') {
                questions[dataQuestion].correct++;
            }
            if (dataAnswer === 'true') {
                parent.classList.add('quiz-success');
            }
            self.disabled = true;
        });

        const result = { correct: 0, total: 0 };

        for (const key in questions) {
            const q = questions[key];

            result.total++;
            if (q.wrong === 0 && q.correct === q.expected) {
                result.correct++;
            }
        }

        const title = document.querySelector('.post-title').textContent;
        const hashtags = 'dockerbday';
        const text = encodeURIComponent(`I've just completed the docker birthday tutorial ${title} and got ${result.correct} out of ${result.total}`);

        const submitQuizLink = document.querySelector('a.submit-quiz');
        submitQuizLink.outerHTML = `<h3>You've got ${result.correct} out of ${result.total}</h3>
            <a class="twitter-share-button" href="https://twitter.com/intent/tweet?hashtags=${hashtags}&text=${text}" data-size="large">Tweet</a>`;

        fetch('https://platform.twitter.com/widgets.js')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load script');
                }
                return response.text();
            })
            .then(scriptText => {
                const scriptElement = document.createElement('script');
                scriptElement.textContent = scriptText;
                document.body.appendChild(scriptElement);
            })
            .catch(error => {
                console.error('Error loading script:', error);
            });

    }

});
