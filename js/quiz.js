"use strict";

/**
 * This script dynamically generates a quiz interface 
 * based on HTML markup generated from Markdown by Jekyll.
 * 
 * Amount of possible choices is arbitrary.
 * 
 * Usage:
 *  Markdown syntax for questions:
 *      For single-choice questions:
 *          Question
 *           - ( ) Wrong choice
 *           - (x) Correct choice
 *           - ( ) Wrong choice
 * 
 *      For multi-choice questions:
 *          Question
 *           - [ ] Wrong choice
 *           - [x] Correct choice
 *           - [x] Correct choice
 * 
 *      For open ended questions:
 *          Question
 *          > Expected answer
 * 
 * Note: don't mix choice types, it will lead to parsing errors and choice will be ignored
 * Note: validation results will be logged to the browser console.
 */

// test
// document.documentElement.setAttribute('data-theme', 'dark');
{
    let questions = [];

    function getQuestionContentId(questionIndex) {
        return `question-${questionIndex}-content`;
    }

    // Case-insensitive string comparison. Returns true on match.
    function strcmpi(a, b) {
        return typeof a === 'string' && typeof b === 'string'
            ? a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
            : a === b;
    }


    function validateQuestion(event) {
        const buttonElement = event.target;
        const questionId = buttonElement.dataset.questionId;
        const questionContextElement = document.getElementById(getQuestionContentId(questionId));
        const questionMetadata = questions[questionId];

        const isOpenEnded = questionContextElement.classList.contains('open-ended');
        if (isOpenEnded) {
            return validateQuestionWithAnswer(questionContextElement, questionMetadata);
        } else {
            return validateQuestionWithChoices(questionContextElement, questionMetadata);
        }
    }

    function validateQuestionWithAnswer(questionContextElement, questionMetadata) {
        console.log(questionContextElement, questionMetadata);
        const answerElement = questionContextElement.querySelector("input.answer");
        const givenAnswer = answerElement.value;
        const expectedAnswer = questionMetadata.expectedAnswer;

        if (strcmpi(givenAnswer, expectedAnswer)) {
            answerElement.classList.add("correct-choice");
            answerElement.disabled = true;
        } else {
            answerElement.classList.add("wrong-choice");
        }

        answerElement.classList.add("font-semibold", "chosen-choice");
        answerElement.addEventListener("input", function () {
            answerElement.classList.remove("wrong-choice", "font-semibold");
        }, { once: true });
    }

    function validateQuestionWithChoices(questionContextElement, questionMetadata) {
        questionContextElement.querySelectorAll('.choice').forEach((choiceElement, choiceIndex) => {
            const checkboxElement = choiceElement.querySelector('input');
            const labelElement = choiceElement.querySelector('label');
            const choice = checkboxElement.checked;
            const expectedChoice = questionMetadata.expectedAnswer[choiceIndex];

            if (choice) labelElement.classList.add("chosen-choice");

            if (choice && !expectedChoice) {
                labelElement.classList.add("wrong-choice");
                // mark up only "active" (checked) correct answers
            } else if (expectedChoice) {
                labelElement.classList.add("correct-choice");
            }
            checkboxElement.disabled = true;
        });
    }

    function addTwitterShareButton() {
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

    function render() {
        const QuestionTypes = Object.freeze({
            Undetermined: -1,
            SingleChoice: 0,
            MultiChoice: 1,
            OpenEnded: 2,
        });

        const questionHeaders = document.querySelectorAll('p.quiz');
        if (questionHeaders.length == 0) {
            return;
        }

        // Render all question based on server-side rendered HTML based on Markdown
        questionHeaders.forEach((questionHeader, questionIndex) => {
            const answerField = questionHeader.nextElementSibling;

            if (!answerField || (answerField.tagName !== 'UL' && answerField.tagName !== 'BLOCKQUOTE')) {
                console.error(`Invalid answer field: "${answerField}".`);
                return;
            }

            const questionContentId = getQuestionContentId(questionIndex);
            const questionText = questionHeader.textContent.trim();
            questionHeader.outerHTML = `
                <div class="quiz no-select">
                    <div class="quiz-title">${questionText}</div>
                    <div class="quiz-question-content" id="${questionContentId}"></div>
                </div>
                `;
            const questionContextElement = document.getElementById(questionContentId);

            questions[questionIndex] = {
                type: QuestionTypes.Undetermined,
                expectedAnswer: [],
                givenAnswer: [],
                isAnswered: false
            };
            const questionMetadata = questions[questionIndex];

            // Open-ended question
            if (answerField.tagName === 'BLOCKQUOTE') {
                questionMetadata.type = QuestionTypes.OpenEnded;
                questionMetadata.expectedAnswer = answerField.textContent.trim();

                const html = `<input placeholder="Answer" class="answer" autocomplete="off" />`;
                questionContextElement.insertAdjacentHTML('beforeend', html);
                questionContextElement.classList.add("open-ended");
            } else {
                // Question with choice
                answerField.querySelectorAll('li').forEach((choice, choiceIndex) => {
                    const text = choice.textContent.trim();
                    const choiceId = `choice-${questionIndex}-${choiceIndex}`;
                    const choiceName = `choice-${questionIndex}`;

                    const prefixOptionsWhitelist = ['[ ]', '[x]', '( )', '(x)']
                    const textPrefix = text.slice(0, 3);

                    if (!prefixOptionsWhitelist.includes(textPrefix)) {
                        console.error(`Invalid question format: "${text}"`);
                        return;
                    }

                    const choiceType = textPrefix[0] == '[' ? QuestionTypes.MultiChoice : QuestionTypes.SingleChoice;
                    if (questionMetadata['type'] !== QuestionTypes.Undetermined && questionMetadata['type'] != choiceType) {
                        console.error(`Mixed question type: "${text}". Previous choice: ${questionMetadata['type']}`);
                        return;
                    }
                    questionMetadata['type'] = choiceType;
                    // TODO: check for more than 1 "correct" choices for single-choice question

                    const htmlType = choiceType ? "checkbox" : "radio";
                    questionMetadata['expectedAnswer'][choiceIndex] = textPrefix[1] == 'x';

                    const html = `
                    <div class="choice no-select">
                        <input type="${htmlType}" class="form-control-sm given-answer" 
                            id="${choiceId}" name="${choiceName}">
                        </input>
                        <label class="control-label" for="${choiceId}">
                            ${text.slice(3)}
                        </label>
                    </div>`;
                    questionContextElement.insertAdjacentHTML('beforeend', html);
                });
                const questionMetaDescription = questionMetadata['type'] === QuestionTypes.MultiChoice ? 'Multiple Choice Question (Select all that apply)' : 'Single Choice Question';
                const descriptionHTML = `<div class="question-description">${questionMetaDescription}</div>`;
                questionContextElement.insertAdjacentHTML('beforebegin', descriptionHTML);
            }

            const buttonElementId = `check-button-${questionIndex}`;
            const verifyActionButtonHTML = `<button id="${buttonElementId}" data-question-id="${questionIndex}" type="button" class="check">Check</button>`;
            questionContextElement.insertAdjacentHTML('beforeend', verifyActionButtonHTML);
            document.getElementById(buttonElementId).addEventListener('click', validateQuestion);

            answerField.remove();
        });

    }

    addEventListener("load", render);
}