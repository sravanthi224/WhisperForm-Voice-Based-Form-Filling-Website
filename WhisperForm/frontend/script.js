const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Speak any text
function speakText(message, callback = null) {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'en-US';
    if (callback) utterance.onend = callback;
    window.speechSynthesis.speak(utterance);
}

// Alert + speech
function speakAlert(message) {
    speakText(message);
    alert(message);
}

// Start recognition
function startSpeechRecognition(fieldId) {
    if (!SpeechRecognition) {
        speakAlert('Speech Recognition not supported in this browser.');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = function (event) {
        const speechResult = event.results[0][0].transcript.trim();
        console.log('Recognized:', speechResult);

        if (fieldId === 'command') {
            handleVoiceCommand(speechResult.toLowerCase());
        } else {
            const field = document.getElementById(fieldId);
            if (field) {
                if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
                    field.value = speechResult;
                } else if (field.tagName === 'SELECT') {
                    selectDropdownOption(field, speechResult);
                }
            }
        }
    };

    recognition.onerror = function (event) {
        console.error('Speech recognition error:', event.error);
        speakText('Speech recognition failed.');
    };
}

// Command handling
function handleVoiceCommand(command) {
    if (command.includes('submit')) {
        const form = document.querySelector('form');
        if (form.checkValidity()) {
            form.requestSubmit();
        } else {
            speakAlert('Please fill all required fields.');
        }
    } else if (command.includes('go back') || command.includes('back')) {
        speakText('Going back to form selection.');
        window.location.href = 'form-selection.html';
    } else {
        speakAlert('Command not recognized. Say submit or go back.');
    }
}

function goBack() {
    window.location.href = 'form-selection.html';
}

function isElementVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function selectDropdownOption(selectElement, speechValue) {
    const options = Array.from(selectElement.options);
    const match = options.find(option =>
        option.text.toLowerCase() === speechValue.toLowerCase()
    );

    if (match) {
        selectElement.value = match.value;
    } else {
        speakAlert('No matching option found for: ' + speechValue);
    }
}

function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

// Save response to localStorage using ID as keys
function saveFormResponse(formId, formName, responseData) {
    const timestamp = new Date().toLocaleString();
    const allResponses = JSON.parse(localStorage.getItem('formResponses') || '{}');

    if (!allResponses[formId]) allResponses[formId] = [];

    allResponses[formId].push({
        timestamp,
        responseData
    });

    localStorage.setItem('formResponses', JSON.stringify(allResponses));
    console.log(`Saved response for ${formId}`);
}

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        // Speak label on focus
        form.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('focus', () => {
                const label = form.querySelector(`label[for="${field.id}"]`);
                if (label) speakText(label.textContent);
            });
        });

        // Mic buttons start recognition
        form.querySelectorAll('button.mic-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const fieldId = btn.getAttribute('data-field-id');
                const label = form.querySelector(`label[for="${fieldId}"]`);
                const labelText = label ? label.textContent : 'Field';
                speakText(labelText, () => startSpeechRecognition(fieldId));
            });
        });

        // Handle form submission
        form.addEventListener('submit', event => {
            event.preventDefault();

            const fields = form.querySelectorAll('input, textarea, select');
            const responseData = {};
            let allFieldsFilled = true;

            fields.forEach(field => {
                const id = field.id;
                const value = field.value.trim();

                if (field.required && !value) {
                    allFieldsFilled = false;
                }

                responseData[id] = value;
            });

            if (!allFieldsFilled) {
                speakAlert('Please fill all required fields.');
                return;
            }

            const formId = window.location.pathname.split('/').pop().split('.')[0]; // e.g., registration
            const formName = capitalizeWords(formId.replace(/-/g, ' ')) + ' Form';

            saveFormResponse(formId, formName, responseData);

            speakAlert('Form submitted successfully!');
            form.reset();
            setTimeout(() => goBack(), 300);
        });
    });

    // Voice command button
    document.querySelector('.voice-btn')?.addEventListener('click', () => {
        speakText("Speak to submit or go back", () => startSpeechRecognition('command'));
    });

    // Intro speech
    const formName = document.querySelector('h1')?.textContent || "form";
    const intro = new SpeechSynthesisUtterance(`You are now filling the ${formName}`);
    intro.lang = 'en-US';
    intro.rate = 1;
    window.speechSynthesis.speak(intro);
});
