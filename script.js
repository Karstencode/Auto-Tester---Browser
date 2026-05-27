/*
    Copyright (C) <2026>  <Karsten Wong>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// Global state
let currentModule = null;
let currentModuleName = null;
let selectedSections = [];
let testQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let redemptionList = [];
let isRedemptionMode = false;
let selectedLanguage = 'French';
let summaryHistory = [];
let currentEditingModuleName = null;

// Test Creator State
let creatorSections = [];
let currentEditingModule = null;
let editingQAIndex = -1;
let editingSectionName = null;
let qaInsertIndex = null;
let qaInsertSection = null;
let activeSectionName = null;
let isProcessingAnswer = false;
let isProcessingRedemption = false;

// Special characters for different languages
const specialChars = {
    'French': ['à', 'â', 'ä', 'é', 'è', 'ê', 'ë', 'ç', 'ù', 'û', 'ü', 'ô', 'ö', 'œ', 'æ', 'î', 'ï', 'ñ'],
    'Spanish': ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'],
    'German': ['ä', 'ö', 'ü', 'ß'],
    'Italian': ['à', 'è', 'é', 'ì', 'ò', 'ù'],
    'Portuguese': ['ã', 'õ', 'ç', 'á', 'é', 'í', 'ó', 'ú', 'â', 'ê', 'ô'],
    'Latin': ['ā', 'ē', 'ī', 'ō', 'ū', 'ȳ', 'ă', 'ĕ', 'ĭ', 'ŏ', 'ŭ']
};

// Sample modules (can be expanded or loaded from JSON)
const sampleModules = {
    'test.py': {
        settings: {
            ask_no_qs_in_test: true,
            no_qs_in_test: 1,
            ask_random: true,
            random: false,
            ask_sections: true,
            sections: ["section 1"]
        },
        question_dict: {
            "section 1": [
                { question: "How are you?", answer: "im fine", value: 1 }
            ],
            "section 2": [
                { question: "What is 2+2?", answer: "4", value: 1 }
            ]
        }
    },
    'Sample French': {
        settings: {
            ask_no_qs_in_test: true,
            no_qs_in_test: 5,
            ask_random: true,
            random: true,
            ask_sections: true,
            sections: []
        },
        question_dict: {
            "Greetings": [
                { question: "Bonjour means...", answer: "hello", value: 1 },
                { question: "Au revoir means...", answer: "goodbye", value: 1 }
            ],
            "Numbers": [
                { question: "One in French", answer: "un", value: 1 },
                { question: "Two in French", answer: "deux", value: 1 },
                { question: "Three in French", answer: "trois", value: 1 }
            ]
        }
    },
    'Sample Latin': {
        settings: {
            ask_no_qs_in_test: true,
            no_qs_in_test: 4,
            ask_random: false,
            random: false,
            ask_sections: true,
            sections: []
        },
        question_dict: {
            "1st Declension": [
                { question: "Nominative singular of rosa", answer: "rosa", value: 1 },
                { question: "Accusative singular of rosa", answer: "rosam", value: 1 }
            ],
            "Conjugations": [
                { question: "Present 1st person singular of amo", answer: "amo", value: 1 },
                { question: "Present 2nd person singular of amo", answer: "amas", value: 1 }
            ]
        }
    }
};

const builtInSampleModuleNames = ['test.py', 'Sample French', 'Sample Latin'];
const importedModules = new Set();

// DOM Elements
const screens = {
    moduleSelect: document.getElementById('moduleSelect'),
    sectionSelect: document.getElementById('sectionSelect'),
    testSettings: document.getElementById('testSettings'),
    quiz: document.getElementById('quiz'),
    results: document.getElementById('results'),
    testCreator: document.getElementById('testCreator')
};

const modal = document.getElementById('fileUploadModal');
const closeModal = document.querySelector('.close');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    populateModuleList();
    setupEventListeners();
});

function populateModuleList() {
    const moduleList = document.getElementById('moduleList');
    moduleList.innerHTML = '';
    
    Object.keys(sampleModules).forEach(moduleName => {
        const item = document.createElement('div');
        item.className = 'module-item';

        const btn = document.createElement('button');
        btn.className = 'module-btn';
        btn.textContent = moduleName;
        btn.onclick = () => selectModule(moduleName);
        item.appendChild(btn);

        if (importedModules.has(moduleName)) {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-secondary module-edit-btn';
            editBtn.textContent = 'Edit';
            editBtn.title = `Edit ${moduleName}`;
            editBtn.onclick = (e) => {
                e.stopPropagation();
                editModule(moduleName);
            };
            item.appendChild(editBtn);

            const unloadBtn = document.createElement('button');
            unloadBtn.className = 'btn btn-secondary module-edit-btn';
            unloadBtn.textContent = 'Unload';
            unloadBtn.title = `Remove ${moduleName} from imported modules`;
            unloadBtn.onclick = (e) => {
                e.stopPropagation();
                unloadModule(moduleName);
            };
            item.appendChild(unloadBtn);
        }

        moduleList.appendChild(item);
    });
}

// ------------------
// Inline add helpers
// ------------------
function beginAddSection() {
    if (document.querySelector('.inline-section-form')) return;
    
    const container = document.getElementById('sectionsContainer');
    const existingTopButton = document.querySelector('.permanent-top-button');
    
    const form = document.createElement('div');
    form.className = 'inline-section-form persistent-form';
    form.innerHTML = `
        <input type="text" class="inline-section-input" placeholder="Section name...">
        <button class="btn-inline-save">Save</button>
        <button class="btn-inline-cancel">Cancel</button>
    `;

    if (existingTopButton) {
        container.insertBefore(form, existingTopButton.nextSibling);
    } else {
        container.prepend(form);
    }

    const input = form.querySelector('.inline-section-input');
    input.focus();

    form.querySelector('.btn-inline-save').onclick = () => {
        const name = input.value.trim();
        addNewSectionInline(name);
        form.remove();
    };

    form.querySelector('.btn-inline-cancel').onclick = () => form.remove();

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') form.querySelector('.btn-inline-save').click();
    });

}

function addNewSectionInline(name) {
    if (!name) {
        alert('Please enter a section name');
        return;
    }
    if (creatorSections.some(s => s.name === name)) {
        alert('Section already exists');
        return;
    }
    const newSection = { name: name, qaPairs: [] };
    creatorSections.push(newSection);
    activeSectionName = newSection.name;
    updateCurrentSectionDisplay();
    renderSections();
}

function beginAddQuestion() {
    if (!activeSectionName) {
        alert('Please create or select a section first');
        return;
    }
    if (document.querySelector('.inline-qa-form')) return;
    const container = document.getElementById('sectionsContainer');

    // Locate the header node for the active (non-reversed) section
    let headerNode = null;
    Array.from(container.children).forEach(node => {
        if (node.classList && node.classList.contains('creator-section-header') && !node.classList.contains('reversed')) {
            const title = node.querySelector('.section-name-input, .section-name-text');
            if (title) {
                const value = title.value ?? title.textContent;
                if (value === activeSectionName) headerNode = node;
            }
        }
    });

    const form = document.createElement('div');
    form.className = 'inline-qa-form';
    form.innerHTML = `
        <input type="text" class="inline-qa-question" placeholder="Question...">
        <input type="text" class="inline-qa-answer" placeholder="Answer...">
        <button class="btn-inline-save">Save</button>
        <button class="btn-inline-cancel">Cancel</button>
    `;

    // Insert form after the last element of this section
    if (headerNode) {
        let insertAfter = headerNode;
        let next = headerNode.nextSibling;
        while (next && !(next.classList && next.classList.contains('creator-section-header'))) {
            insertAfter = next;
            next = next.nextSibling;
        }
        insertAfter.parentNode.insertBefore(form, insertAfter.nextSibling);
    } else {
        container.appendChild(form);
    }

    const qInput = form.querySelector('.inline-qa-question');
    const aInput = form.querySelector('.inline-qa-answer');
    qInput.focus();

    form.querySelector('.btn-inline-save').onclick = () => {
        const q = qInput.value.trim();
        const a = aInput.value.trim();
        addNewQuestionInline(activeSectionName, q, a);
        form.remove();
    };

    form.querySelector('.btn-inline-cancel').onclick = () => form.remove();

    qInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') form.querySelector('.btn-inline-save').click(); });
    aInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') form.querySelector('.btn-inline-save').click(); });
}

function addNewQuestionInline(sectionName, question, answer) {
    if (!question) { alert('Please enter a question'); return; }
    if (!answer) { alert('Please enter an answer'); return; }
    const section = creatorSections.find(s => s.name === sectionName);
    if (!section) { alert('Section not found'); return; }
    section.qaPairs.push({ question, answer });
    renderSections();
}

function selectModule(moduleName) {
    currentModuleName = moduleName;
    currentModule = sampleModules[moduleName];
    showScreen('sectionSelect');
    populateSectionList();
}

function editModule(moduleName, placeInCustomSection = false) {
    const moduleData = sampleModules[moduleName];
    if (!moduleData) {
        alert('Unable to find module to edit.');
        return;
    }
    currentEditingModuleName = moduleName;
    initializeTestCreator(moduleData, moduleName, placeInCustomSection);
    showScreen('testCreator');
}

function unloadModule(moduleName) {
    if (!importedModules.has(moduleName)) return;
    if (!confirm(`Unload imported module "${moduleName}"? This will remove it from the current session.`)) return;
    delete sampleModules[moduleName];
    importedModules.delete(moduleName);
    if (currentModuleName === moduleName) {
        currentModuleName = null;
        currentModule = null;
    }
    if (currentEditingModuleName === moduleName) {
        currentEditingModuleName = null;
        currentEditingModule = null;
    }
    populateModuleList();
    showScreen('moduleSelect');
}

function populateSectionList() {
    const sectionList = document.getElementById('sectionList');
    const sectionInfo = document.getElementById('sectionInfo');
    const sections = Object.keys(currentModule.question_dict);
    
    sectionInfo.textContent = `The test has ${sections.length} sections, including:`;
    
    sectionList.innerHTML = '';
    sections.forEach(section => {
        const div = document.createElement('div');
        div.className = 'section-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = section;
        checkbox.value = section;
        
        const label = document.createElement('label');
        label.htmlFor = section;
        label.textContent = section;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        sectionList.appendChild(div);
    });
}

function setupEventListeners() {
    // Module selection
    document.getElementById('loadCustomModule').addEventListener('click', () => {
        modal.classList.add('show');
    });
    
    document.getElementById('createNewModule').addEventListener('click', () => {
        initializeTestCreator();
        showScreen('testCreator');
    });
    
    // Modal
    closeModal.addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    document.getElementById('uploadFile').addEventListener('click', uploadCustomModule);
    
    // Section selection
    document.getElementById('startTest').addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('#sectionList input[type="checkbox"]:checked');
        if (checkboxes.length === 0) {
            alert('Please select at least one section');
            return;
        }
        
        selectedSections = Array.from(checkboxes).map(cb => cb.value);
        showScreen('testSettings');
        setupTestSettings();
    });
    
    document.getElementById('backToModules').addEventListener('click', () => {
        showScreen('moduleSelect');
    });
    
    // Test settings
    document.getElementById('confirmSettings').addEventListener('click', startTest);
    
    document.getElementById('backToSections').addEventListener('click', () => {
        showScreen('sectionSelect');
    });
    
    // Quiz
    document.getElementById('submitAnswer').addEventListener('click', submitAnswer);
    document.getElementById('answerInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitAnswer();
    });
    
    // Redemption
    document.getElementById('submitRedemption').addEventListener('click', () => {
        if (window.submitRedemptionAnswer) {
            window.submitRedemptionAnswer();
        }
    });
    document.getElementById('redemptionAnswer').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && window.submitRedemptionAnswer) {
            window.submitRedemptionAnswer();
        }
    });
    
    // Results
    document.getElementById('restartTest').addEventListener('click', () => {
        selectedSections = [];
        testQuestions = [];
        currentQuestionIndex = 0;
        score = 0;
        redemptionList = [];
        isRedemptionMode = false;
        modal.classList.remove('show');
        showScreen('moduleSelect');
    });
    
    // Test Creator (inline add modes)
    const vocabToggle = document.getElementById('vocabModeToggle');
    if (vocabToggle) {
        vocabToggle.addEventListener('change', () => {
            if (editingQAIndex !== -1 || qaInsertIndex !== null) {
                clearQAInput();
            }
            renderSections();
        });
    }
    const saveButton = document.getElementById('saveTestModule');
    if (saveButton) {
        saveButton.addEventListener('click', saveTestModule);
    }
    const backButton = document.getElementById('backFromCreator');
    if (backButton) {
        backButton.addEventListener('click', () => {
            showScreen('moduleSelect');
        });
    }
}

function uploadCustomModule() {
    const fileInput = document.getElementById('jsonFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.settings || !data.question_dict) {
                throw new Error('Invalid format');
            }

            const rawName = data.name || file.name.replace(/\.json$/i, '');
            let moduleName = rawName.trim() || 'Custom Module';
            if (builtInSampleModuleNames.includes(moduleName)) {
                moduleName = `${moduleName} (Imported)`;
            }
            if (sampleModules[moduleName] && !builtInSampleModuleNames.includes(moduleName)) {
                moduleName = `${moduleName} (${Date.now()})`;
            }

            sampleModules[moduleName] = data;
            importedModules.add(moduleName);
            currentModule = null;
            currentEditingModuleName = null;
            currentEditingModule = null;
            modal.classList.remove('show');
            fileInput.value = '';
            populateModuleList();
            showScreen('moduleSelect');
        } catch (error) {
            alert('Error loading file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function setupTestSettings() {
    let totalQuestions = 0;
    selectedSections.forEach(section => {
        totalQuestions += currentModule.question_dict[section].length;
    });
    
    document.getElementById('totalQuestions').textContent = totalQuestions;
    document.getElementById('numQuestions').value = currentModule.settings.ask_no_qs_in_test 
        ? Math.min(currentModule.settings.no_qs_in_test, totalQuestions)
        : totalQuestions;
    document.getElementById('numQuestions').max = totalQuestions;
    
    if (currentModule.settings.ask_random) {
        document.getElementById('randomOrder').checked = currentModule.settings.random;
    } else {
        document.getElementById('randomOrder').checked = currentModule.settings.random;
        document.getElementById('randomOrder').disabled = true;
    }
}

function startTest() {
    summaryHistory = [];
    const numQuestions = parseInt(document.getElementById('numQuestions').value);
    const isRandom = document.getElementById('randomOrder').checked;
    
    if (numQuestions <= 0) {
        alert('Please enter a valid number of questions');
        return;
    }
    
    // Build test questions array
    testQuestions = [];
    selectedSections.forEach(section => {
        currentModule.question_dict[section].forEach((q, index) => {
            testQuestions.push({
                question: q.question,
                answer: q.answer,
                section: section,
                index: index
            });
        });
    });
    
    if (isRandom) {
        shuffleArray(testQuestions);
    }
    
    // Limit to requested number
    testQuestions = testQuestions.slice(0, numQuestions);
    
    currentQuestionIndex = 0;
    score = 0;
    redemptionList = [];
    isRedemptionMode = false;
    
    showScreen('quiz');
    displayQuestion();
}

function displayQuestion() {
    if (currentQuestionIndex >= testQuestions.length) {
        if (redemptionList.length > 0) {
            showRedemptionRound();
        } else {
            showResults();
        }
        return;
    }
    
    const question = testQuestions[currentQuestionIndex];
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('answerInput').value = '';
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').classList.remove('show', 'correct', 'incorrect');
    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
    document.getElementById('totalTestQuestions').textContent = testQuestions.length;
    document.getElementById('score').textContent = score;
    
    const progress = ((currentQuestionIndex) / testQuestions.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    
    setupCharacterPicker(question.question);
    
    document.getElementById('answerInput').focus();
}

function submitAnswer() {
    if (isProcessingAnswer) return;
    isProcessingAnswer = true;
    try {
        const userAnswer = document.getElementById('answerInput').value.trim();
        const question = testQuestions[currentQuestionIndex];
        
        if (!userAnswer) {
            isProcessingAnswer = false;
            alert('Please enter an answer');
            return;
        }
        
        // Simple case-insensitive comparison
        const isCorrect = checkAnswer(userAnswer, question.answer);
        
        summaryHistory.push({
            question: question.question,
            userAnswer: userAnswer,
            correctAnswer: question.answer,
            correct: isCorrect,
            testIndex: currentQuestionIndex,
            stage: 'initial'
        });
        
        const feedback = document.getElementById('feedback');
        
        if (isCorrect) {
            score += 1;
            feedback.textContent = `✓ Correct! Answer: ${question.answer} Score: ${score}`;
            feedback.classList.add('show', 'correct');
        } else {
            feedback.textContent = `✗ Incorrect! Answer: ${question.answer} Score: ${score}`;
            feedback.classList.add('show', 'incorrect');
            redemptionList.push(currentQuestionIndex);
        }
        
        document.getElementById('score').textContent = score;
        
        setTimeout(() => {
            currentQuestionIndex++;
            displayQuestion();
            isProcessingAnswer = false;
        }, 1500);
    } catch (error) {
        isProcessingAnswer = false;
        console.error('Error in submitAnswer:', error);
        alert('An error occurred. Please try again.');
    }
}

function renderSummary() {
    const stats = document.getElementById('summaryStats');
    const list = document.getElementById('summaryList');
    const total = summaryHistory.length;
    const correctCount = summaryHistory.filter(item => item.correct).length;
    const incorrectCount = total - correctCount;

    if (stats) {
        stats.textContent = `Correct: ${correctCount} / ${total} · Incorrect: ${incorrectCount}`;
    }
    if (!list) return;
    list.innerHTML = '';

    summaryHistory.forEach((item, index) => {
        const entry = document.createElement('div');
        entry.className = 'summary-entry';
        entry.innerHTML = `
            <div class="summary-question"><strong>Q${index + 1}:</strong> ${escapeHtml(item.question)}</div>
            <div class="summary-answer ${item.correct ? 'correct' : 'incorrect'}">Your answer: ${escapeHtml(item.userAnswer)} — ${item.correct ? 'Correct' : 'Incorrect'}</div>
            <div class="summary-correct">Correct answer: ${escapeHtml(item.correctAnswer)}</div>
        `;
        list.appendChild(entry);
    });
}

function checkAnswer(userAnswer, correctAnswer, customCheckFunction = null) {
    // Case-insensitive, trim whitespace comparison
    try {
        return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    } catch (e) {
        console.error('Error checking answer:', e);
        return false;
    }
}

function setupCharacterPicker(question, langSelectorId = 'languageSelector', charPickerId = 'charPicker', inputId = 'answerInput') {
    const langSelector = document.getElementById(langSelectorId);
    const charPicker = document.getElementById(charPickerId);
    
    langSelector.innerHTML = '';
    charPicker.innerHTML = '';
    
    Object.keys(specialChars).forEach(lang => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lang-btn' + (lang === selectedLanguage ? ' active' : '');
        btn.textContent = lang;
        btn.onclick = () => selectLanguage(lang, langSelectorId, charPickerId, inputId);
        langSelector.appendChild(btn);
    });
    
    const chars = specialChars[selectedLanguage] || [];
    chars.forEach(char => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'char-btn';
        btn.textContent = char;
        btn.onclick = (e) => {
            e.preventDefault();
            insertCharacter(char, inputId);
        };
        charPicker.appendChild(btn);
    });
}

function selectLanguage(lang, langSelectorId, charPickerId, inputId) {
    selectedLanguage = lang;
    
    document.getElementById(langSelectorId).querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === lang) {
            btn.classList.add('active');
        }
    });
    
    const charPicker = document.getElementById(charPickerId);
    charPicker.innerHTML = '';
    
    const chars = specialChars[lang] || [];
    chars.forEach(char => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'char-btn';
        btn.textContent = char;
        btn.onclick = (e) => {
            e.preventDefault();
            insertCharacter(char, inputId);
        };
        charPicker.appendChild(btn);
    });
}

function insertCharacter(char, inputId = 'answerInput') {
    const input = document.getElementById(inputId);
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    input.value = value.substring(0, start) + char + value.substring(end);
    input.selectionStart = input.selectionEnd = start + 1;
    input.focus();
}

function showRedemptionRound() {
    showScreen('results');
    document.getElementById('redemptionContainer').style.display = 'block';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('redemptionMessage').textContent = `You have ${redemptionList.length} question(s) to retry:`;
    
    let redemptionIndex = 0;
    
    function showNextRedemptionQuestion() {
        if (redemptionIndex >= redemptionList.length) {
            document.getElementById('redemptionContainer').style.display = 'none';
            document.getElementById('finalScore').textContent = score;
            return;
        }
        
        const qIndex = redemptionList[redemptionIndex];
        const question = testQuestions[qIndex];
        document.getElementById('redemptionQuestion').textContent = question.question;
        document.getElementById('redemptionAnswer').value = '';
        document.getElementById('redemptionFeedback').textContent = '';
        document.getElementById('redemptionFeedback').classList.remove('show', 'correct', 'incorrect');
        setupCharacterPicker(question.question, 'redemptionLanguageSelector', 'redemptionCharPicker', 'redemptionAnswer');
    }
    
    window.submitRedemptionAnswer = function() {
        if (isProcessingRedemption) return;
        isProcessingRedemption = true;
        try {
            const userAnswer = document.getElementById('redemptionAnswer').value.trim();
            const qIndex = redemptionList[redemptionIndex];
            const question = testQuestions[qIndex];
            
            if (!userAnswer) {
                isProcessingRedemption = false;
                alert('Please enter an answer');
                return;
            }
            
            const isCorrect = checkAnswer(userAnswer, question.answer);
            
            const feedback = document.getElementById('redemptionFeedback');
            const summaryEntry = summaryHistory.find(item => item.testIndex === qIndex);
            if (summaryEntry) {
                summaryEntry.userAnswer = userAnswer;
                summaryEntry.correct = isCorrect;
                summaryEntry.stage = 'redemption';
            }
            
            if (isCorrect) {
                score += 1;
                feedback.textContent = `✓ Correct! Answer: ${question.answer} Score: ${score}`;
                feedback.classList.add('show', 'correct');
            } else {
                feedback.textContent = `✗ Incorrect! Answer: ${question.answer} Score: ${score}`;
                feedback.classList.add('show', 'incorrect');
            }
            
            document.getElementById('finalScore').textContent = score;
            
            redemptionIndex++;
            
            setTimeout(() => {
                isProcessingRedemption = false;
                if (redemptionIndex < redemptionList.length) {
                    showNextRedemptionQuestion();
                } else {
                    document.getElementById('redemptionContainer').style.display = 'none';
                    showResults();
                }
            }, 1500);
        } catch (error) {
            isProcessingRedemption = false;
            console.error('Error in submitRedemptionAnswer:', error);
            alert('An error occurred. Please try again.');
        }
    };
    
    showNextRedemptionQuestion();
}

function showResults() {
    showScreen('results');
    document.getElementById('finalScore').textContent = score;
    document.getElementById('redemptionContainer').style.display = 'none';
    document.getElementById('redemptionMessage').textContent = `Test completed! You scored ${score} out of ${testQuestions.length}.`;
    renderSummary();
}

function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ============================================
// TEST CREATOR FUNCTIONS
// ============================================

function initializeTestCreator(moduleData = null, moduleName = '', placeInCustomSection = false) {
    creatorSections = [];
    currentEditingModuleName = moduleName || null;
    currentEditingModule = {
        settings: {
            ask_no_qs_in_test: true,
            no_qs_in_test: 5,
            ask_random: true,
            random: false,
            ask_sections: true,
            sections: []
        },
        question_dict: {}
    };
    
    if (moduleData) {
        currentEditingModule = JSON.parse(JSON.stringify(moduleData));
        if (placeInCustomSection) {
            const customSectionName = `${moduleName} (Custom)`;
            const combinedPairs = [];

            Object.values(moduleData.question_dict).forEach(pairs => {
                pairs.forEach(pair => {
                    combinedPairs.push({ question: pair.question, answer: pair.answer });
                });
            });

            creatorSections = [{ name: customSectionName, qaPairs: combinedPairs }];
        } else {
            creatorSections = Object.keys(moduleData.question_dict).map(sectionName => ({
                name: sectionName,
                qaPairs: moduleData.question_dict[sectionName].map(pair => ({
                    question: pair.question,
                    answer: pair.answer
                }))
            }));
        }
    } else {
        // Initialise with one section label and insert quesstion and insert section labels but no questions boxes
        creatorSections = [
            { name: 'Section 1', qaPairs: [] }
        ];
    }
    
    editingQAIndex = -1;
    editingSectionName = null;
    
    document.getElementById('moduleNameInput').value = moduleName || '';
    document.getElementById('vocabModeToggle').checked = false;
    document.getElementById('creatorNumQuestions').value = moduleData?.settings?.no_qs_in_test || 5;
    document.getElementById('creatorRandomOrder').checked = moduleData?.settings?.random || false;
    document.getElementById('sectionsContainer').innerHTML = '';

    activeSectionName = creatorSections.length > 0 ? creatorSections[0].name : null;
    updateCurrentSectionDisplay();
    renderSections();

    if (!moduleData) {
        beginAddQuestion();
    }

}

function removeSection(sectionName) {
    const removedIndex = creatorSections.findIndex(s => s.name === sectionName);
    if (removedIndex === -1) return;
    if (removedIndex === 0) {
        alert('Cannot remove the first section — its vocab would have nowhere to go.');
        return;
    }
    if (confirm(`Are you sure you want to remove "${sectionName}"?`)) {
        const removed = creatorSections[removedIndex];
        const upperSection = creatorSections[removedIndex - 1];
        upperSection.qaPairs.push(...removed.qaPairs);
        creatorSections.splice(removedIndex, 1);
        if (editingSectionName === sectionName) {
            clearQAInput();
        }
        if (activeSectionName === sectionName) {
            activeSectionName = upperSection.name;
        }
        updateCurrentSectionDisplay();
        renderSections();
    }
}

function removeQAPair(sectionName, index) {
    const section = creatorSections.find(s => s.name === sectionName);
    if (section) {
        section.qaPairs.splice(index, 1);
        renderSections();
    }
}

function addOrUpdateQA() {
    const qEl = document.getElementById('qaInputQuestion');
    const aEl = document.getElementById('qaInputAnswer');
    const question = qEl ? qEl.value.trim() : (prompt('Question:') || '').trim();
    const answer = aEl ? aEl.value.trim() : (prompt('Answer:') || '').trim();
    let targetSectionName = activeSectionName;
    
    if (!question) {
        alert('Please enter a question');
        return;
    }
    
    if (!answer) {
        alert('Please enter an answer');
        return;
    }
    
    if (editingQAIndex !== -1) {
        targetSectionName = editingSectionName;
    } else if (qaInsertIndex !== null) {
        targetSectionName = qaInsertSection;
    }
    
    if (!targetSectionName) {
        alert('Please create a section first before adding vocabulary.');
        return;
    }
    
    const sectionObj = creatorSections.find(s => s.name === targetSectionName);
    if (!sectionObj) {
        alert('Section not found');
        return;
    }
    
    if (editingQAIndex !== -1) {
        sectionObj.qaPairs[editingQAIndex] = { question, answer };
    } else if (qaInsertIndex !== null && qaInsertSection === sectionObj.name) {
        sectionObj.qaPairs.splice(qaInsertIndex, 0, { question, answer });
    } else {
        sectionObj.qaPairs.push({ question, answer });
    }
    
    clearQAInput();
    renderSections();
}

function clearQAInput() {
    const qEl = document.getElementById('qaInputQuestion');
    const aEl = document.getElementById('qaInputAnswer');
    const clearBtn = document.getElementById('clearQABtn');
    if (qEl) qEl.value = '';
    if (aEl) aEl.value = '';
    editingQAIndex = -1;
    editingSectionName = null;
    qaInsertIndex = null;
    qaInsertSection = null;
    const addBtn = document.getElementById('addUpdateQABtn');
    if (addBtn) addBtn.textContent = 'Add Question';
    if (clearBtn) clearBtn.style.display = 'none';
    updateCurrentSectionDisplay();
}

function editQAPair(sectionName, index) {
    const container = document.getElementById('sectionsContainer');
    const section = creatorSections.find(s => s.name === sectionName);
    if (!section || !section.qaPairs[index]) return;

    // find header node
    let headerNode = null;
    Array.from(container.children).forEach(node => {
        if (node.classList && node.classList.contains('creator-section-header') && !node.classList.contains('reversed')) {
            const title = node.querySelector('.section-name-input, .section-name-text');
            if (title) {
                const value = title.value ?? title.textContent;
                if (value === sectionName) headerNode = node;
            }
        }
    });
    if (!headerNode) return;

    // locate the target vocab row
    let count = 0;
    let node = headerNode.nextSibling;
    let targetNode = null;
    while (node && !(node.classList && node.classList.contains('creator-section-header'))) {
        if (node.classList && node.classList.contains('creator-vocab-row')) {
            if (count === index) { targetNode = node; break; }
            count++;
        }
        node = node.nextSibling;
    }
    if (!targetNode) return;

    const pair = section.qaPairs[index];
    const form = document.createElement('div');
    form.className = 'inline-qa-form';
    form.innerHTML = `
        <input type="text" class="inline-qa-question" value="${escapeHtml(pair.question)}">
        <input type="text" class="inline-qa-answer" value="${escapeHtml(pair.answer)}">
        <button class="btn-inline-save">Save</button>
        <button class="btn-inline-cancel">Cancel</button>
    `;

    targetNode.parentNode.insertBefore(form, targetNode);
    targetNode.style.display = 'none';

    const qInput = form.querySelector('.inline-qa-question');
    const aInput = form.querySelector('.inline-qa-answer');

    form.querySelector('.btn-inline-save').onclick = () => {
        const q = qInput.value.trim();
        const a = aInput.value.trim();
        if (!q) { alert('Please enter a question'); return; }
        if (!a) { alert('Please enter an answer'); return; }
        section.qaPairs[index] = { question: q, answer: a };
        renderSections();
    };

    form.querySelector('.btn-inline-cancel').onclick = () => {
        form.remove();
        targetNode.style.display = '';
    };
}

function insertQAPair(sectionName, index) {
    const container = document.getElementById('sectionsContainer');
    const section = creatorSections.find(s => s.name === sectionName);
    if (!section) return;
    // find header node
    let headerNode = null;
    Array.from(container.children).forEach(node => {
        if (node.classList && node.classList.contains('creator-section-header') && !node.classList.contains('reversed')) {
            const title = node.querySelector('.section-name-input, .section-name-text');
            if (title && title.value === sectionName || title && title.textContent === sectionName) headerNode = node;
        }
    });
    if (!headerNode) return;

    // find insertion point (node representing the pair at index or after last)
    let node = headerNode.nextSibling;
    let count = 0;
    let insertBeforeNode = null;
    while (node && !(node.classList && node.classList.contains('creator-section-header'))) {
        if (node.classList && node.classList.contains('creator-vocab-row')) {
            if (count === index) { insertBeforeNode = node; break; }
            count++;
        }
        node = node.nextSibling;
    }

    const form = document.createElement('div');
    form.className = 'inline-qa-form';
    form.innerHTML = `
        <input type="text" class="inline-qa-question" placeholder="Question...">
        <input type="text" class="inline-qa-answer" placeholder="Answer...">
        <button class="btn-inline-save">Save</button>
        <button class="btn-inline-cancel">Cancel</button>
    `;

    if (insertBeforeNode) {
        insertBeforeNode.parentNode.insertBefore(form, insertBeforeNode);
    } else {
        // Find the next section header (reversed or next real section)
        // and insert before it, so the form doesn't end up under the reversed section
        let nextHeader = headerNode.nextSibling;
        while (nextHeader && !(nextHeader.classList && nextHeader.classList.contains('creator-section-header'))) {
            nextHeader = nextHeader.nextSibling;
        }
        if (nextHeader) {
            nextHeader.parentNode.insertBefore(form, nextHeader);
        } else {
            container.appendChild(form);
        }
    }

    const qInput = form.querySelector('.inline-qa-question');
    const aInput = form.querySelector('.inline-qa-answer');
    qInput.focus();

    form.querySelector('.btn-inline-save').onclick = () => {
        const q = qInput.value.trim();
        const a = aInput.value.trim();
        if (!q) { alert('Please enter a question'); return; }
        if (!a) { alert('Please enter an answer'); return; }
        section.qaPairs.splice(index, 0, { question: q, answer: a });
        renderSections();
    };

    form.querySelector('.btn-inline-cancel').onclick = () => form.remove();
}

function insertSectionPrompt(beforeIndex) {
    const sectionName = prompt('Enter section name:');
    if (!sectionName || !sectionName.trim()) return;
    if (creatorSections.some(s => s.name === sectionName)) {
        alert('Section already exists');
        return;
    }
    const newSection = { name: sectionName.trim(), qaPairs: [] };
    creatorSections.splice(beforeIndex, 0, newSection);
    activeSectionName = newSection.name;
    updateCurrentSectionDisplay();
    renderSections();
}

function insertSectionAt(sectionName, splitIndex) {
    const sectionIndex = creatorSections.findIndex(s => s.name === sectionName);
    if (sectionIndex === -1) return;
    const section = creatorSections[sectionIndex];
    const newSectionName = prompt('Enter new section name:');
    if (!newSectionName || !newSectionName.trim()) return;
    const trimmedName = newSectionName.trim();
    if (creatorSections.some(s => s.name === trimmedName)) {
        alert('Section name already exists');
        return;
    }

    const movedPairs = section.qaPairs.splice(splitIndex);
    const newSection = { name: trimmedName, qaPairs: movedPairs };
    creatorSections.splice(sectionIndex + 1, 0, newSection);
    activeSectionName = newSection.name;
    updateCurrentSectionDisplay();
    renderSections();
}

function updateCurrentSectionDisplay() {
    const display = document.getElementById('currentSectionDisplay');
    if (!display) return;
    const addButton = document.getElementById('addUpdateQABtn');
    if (!activeSectionName && editingQAIndex === -1 && qaInsertIndex === null) {
        display.textContent = 'No section selected. Create a section to begin adding vocabulary.';
        if (addButton) addButton.disabled = true;
    } else {
        display.innerHTML = `Current section: <strong>${escapeHtml(activeSectionName)}</strong>. New items will be added here.`;
        if (addButton) addButton.disabled = false;
    }
}

function renameSection(oldName, newName) {
    if (newName === oldName) return;
    if (!newName) {
        alert('Section name cannot be empty.');
        renderSections();
        return;
    }
    if (creatorSections.some(s => s.name === newName)) {
        alert('Section name already exists.');
        renderSections();
        return;
    }
    const section = creatorSections.find(s => s.name === oldName);
    if (!section) return;
    section.name = newName;
    if (activeSectionName === oldName) {
        activeSectionName = newName;
    }
    if (editingSectionName === oldName) {
        editingSectionName = newName;
    }
    if (qaInsertSection === oldName) {
        qaInsertSection = newName;
    }
    renderSections();
}

function isVocabModeEnabled() {
    return document.getElementById('vocabModeToggle').checked;
}

function getDisplaySections() {
    const display = [];
    if (isVocabModeEnabled()) {
        // All original sections first
        creatorSections.forEach(section => {
            display.push({ ...section, reversedOf: null });
        });
        // Then all reversed sections in the same order
        creatorSections.forEach(section => {
            display.push({
                name: `${section.name} (Reversed)`,
                qaPairs: section.qaPairs.map(pair => ({ question: pair.answer, answer: pair.question })),
                reversedOf: section.name
            });
        });
    } else {
        creatorSections.forEach(section => {
            display.push({ ...section, reversedOf: null });
        });
    }
    return display;
}

// ============================================
// RENDER SECTIONS
// ============================================

function renderSections() {
    const container = document.getElementById('sectionsContainer');
    container.innerHTML = '';
    const sectionsToRender = getDisplaySections();

    // 1. Add permanent top control to insert a section before the first one
    const topControls = document.createElement('div');
    topControls.className = 'insert-separator insert-edge-controls permanent-top-button permanent';
    const topInsertBtn = document.createElement('button');
    topInsertBtn.className = 'btn-insert-row';
    topInsertBtn.textContent = '+ Insert Section';
    topInsertBtn.dataset.action = 'insertSection';
    topInsertBtn.dataset.sectionName = '';
    topInsertBtn.dataset.beforeIndex = 0;
    topControls.appendChild(topInsertBtn);
    container.appendChild(topControls);

    let mainSectionIndex = 0;

    sectionsToRender.forEach((section, sectionIdx) => {
        // Section header/title
        const sectionHeaderRow = document.createElement('div');
        sectionHeaderRow.className = 'creator-section-header';
        if (section.name === activeSectionName && !section.reversedOf) {
            sectionHeaderRow.classList.add('active');
        }
        if (section.reversedOf) {
            sectionHeaderRow.classList.add('reversed');
        }

        let sectionTitle;
        if (section.reversedOf) {
            sectionTitle = document.createElement('span');
            sectionTitle.className = 'section-name-text';
            sectionTitle.textContent = section.name;
        } else {
            sectionTitle = document.createElement('input');
            sectionTitle.type = 'text';
            sectionTitle.className = 'section-name-input';
            sectionTitle.value = section.name;
            sectionTitle.dataset.sectionIndex = mainSectionIndex;
            sectionTitle.addEventListener('blur', (e) => renameSection(section.name, e.target.value.trim()));
            sectionTitle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') sectionTitle.blur();
            });
            mainSectionIndex++;
        }

        sectionHeaderRow.appendChild(sectionTitle);

        const countBadge = document.createElement('span');
        countBadge.className = 'count-badge';
        countBadge.textContent = section.qaPairs.length;
        sectionHeaderRow.appendChild(countBadge);

        if (!section.reversedOf) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn-remove-section';
            removeBtn.textContent = '✕';
            removeBtn.title = 'Remove section';
            removeBtn.dataset.sectionName = section.name;
            sectionHeaderRow.appendChild(removeBtn);
        }

        sectionHeaderRow.onclick = (e) => {
            if (e.target.classList.contains('btn-remove-section')) return;
            if (e.target.classList.contains('section-name-input')) return;
            if (!section.reversedOf) {
                activeSectionName = section.name;
                updateCurrentSectionDisplay();
                renderSections();
            }
        };

        // Append header first
        container.appendChild(sectionHeaderRow);

        // ---------- NEW: append an inline control block (insertQBtn + insertSBtn)
        // Immediately after the header but before the first question. This keeps the same
        // button format as the interSectionControls / insertSBtn used elsewhere.
        if (!section.reversedOf) {
            const headerInlineControls = document.createElement('div');
            headerInlineControls.className = 'insert-separator permanent';
            const headerInsertQBtn = document.createElement('button');
            headerInsertQBtn.className = 'btn-insert-row';
            headerInsertQBtn.textContent = '+ Insert Question';
            headerInsertQBtn.dataset.action = 'insertQuestion';
            headerInsertQBtn.dataset.sectionName = section.name;
            headerInsertQBtn.dataset.beforeIndex = 0;
            const headerInsertSBtn = document.createElement('button');
            headerInsertSBtn.className = 'btn-insert-row';
            headerInsertSBtn.textContent = '+ Insert Section';
            headerInsertSBtn.dataset.action = 'insertSection';
            headerInsertSBtn.dataset.sectionName = section.name;
            headerInsertSBtn.dataset.beforeIndex = 0;
            headerInlineControls.appendChild(headerInsertQBtn);
            headerInlineControls.appendChild(headerInsertSBtn);
            container.appendChild(headerInlineControls);
        }
        // ---------- END NEW

        // Vocab items under the section
        section.qaPairs.forEach((pair, pairIdx) => {
            const vocabRow = document.createElement('div');
            vocabRow.className = 'creator-vocab-row';
            if (section.reversedOf) vocabRow.classList.add('reversed');
            const question = document.createElement('div');
            question.className = 'vocab-question';
            question.textContent = pair.question;
            const answer = document.createElement('div');
            answer.className = 'vocab-answer';
            answer.textContent = pair.answer;
            const controls = document.createElement('div');
            controls.className = 'vocab-controls';
            if (!section.reversedOf) {
                const editBtn = document.createElement('button');
                editBtn.className = 'btn-vocab-edit';
                editBtn.textContent = 'Edit';
                editBtn.dataset.sectionName = section.name;
                editBtn.dataset.pairIndex = pairIdx;
                controls.appendChild(editBtn);
                const delBtn = document.createElement('button');
                delBtn.className = 'btn-vocab-delete';
                delBtn.textContent = '✕';
                delBtn.title = 'Delete';
                delBtn.dataset.sectionName = section.name;
                delBtn.dataset.pairIndex = pairIdx;
                controls.appendChild(delBtn);
            }
            vocabRow.appendChild(question);
            vocabRow.appendChild(answer);
            vocabRow.appendChild(controls);
            container.appendChild(vocabRow);

            // Add hover insert buttons after each vocab item
            if (!section.reversedOf) {
                const insertSep = document.createElement('div');
                insertSep.className = 'insert-separator';
                const insertQBtn = document.createElement('button');
                insertQBtn.className = 'btn-insert-row';
                insertQBtn.textContent = '+ Insert Question';
                insertQBtn.dataset.action = 'insertQuestion';
                insertQBtn.dataset.sectionName = section.name;
                insertQBtn.dataset.beforeIndex = pairIdx + 1;
                const insertSBtn = document.createElement('button');
                insertSBtn.className = 'btn-insert-row';
                insertSBtn.textContent = '+ Insert Section';
                insertSBtn.dataset.action = 'insertSection';
                insertSBtn.dataset.sectionName = section.name;
                insertSBtn.dataset.beforeIndex = pairIdx + 1;
                insertSep.appendChild(insertQBtn);
                insertSep.appendChild(insertSBtn);
                container.appendChild(insertSep);
            }
        });

    });

    // Attach single event listener for all buttons
    container.removeEventListener('click', handleContainerClick);
    container.addEventListener('click', handleContainerClick);
}
function handleContainerClick(e) {
    if (e.target.classList.contains('btn-remove-section')) {
        e.stopPropagation();
        const sectionName = e.target.dataset.sectionName;
        removeSection(sectionName);
    } else if (e.target.classList.contains('btn-vocab-delete')) {
        e.stopPropagation();
        const sectionName = e.target.dataset.sectionName;
        const pairIndex = parseInt(e.target.dataset.pairIndex);
        removeQAPair(sectionName, pairIndex);
    } else if (e.target.classList.contains('btn-vocab-edit')) {
        e.stopPropagation();
        const sectionName = e.target.dataset.sectionName;
        const pairIndex = parseInt(e.target.dataset.pairIndex);
        editQAPair(sectionName, pairIndex);
    } else if (e.target.classList.contains('btn-insert-row')) {
        e.stopPropagation();
        const action = e.target.dataset.action;
        if (action === 'insertQuestion') {
            const sectionName = e.target.dataset.sectionName;
            const beforeIndex = parseInt(e.target.dataset.beforeIndex);
            insertQAPair(sectionName, beforeIndex);
        } else if (action === 'insertSection') {
            const sectionName = e.target.dataset.sectionName;
            const beforeIndex = parseInt(e.target.dataset.beforeIndex);
            if (sectionName) {
                insertSectionAt(sectionName, beforeIndex);
            } else {
                insertSectionPrompt(beforeIndex);
            }
        }
    }
}

function syncSectionNamesFromInputs() {
    const inputs = document.querySelectorAll('.section-name-input');
    inputs.forEach(input => {
        const sectionIndex = parseInt(input.dataset.sectionIndex, 10);
        if (Number.isNaN(sectionIndex) || sectionIndex < 0 || sectionIndex >= creatorSections.length) return;
        const newName = input.value.trim();
        const section = creatorSections[sectionIndex];
        if (!newName || newName === section.name) return;
        const oldName = section.name;
        if (creatorSections.some((s, idx) => idx !== sectionIndex && s.name === newName)) {
            alert('Section name already exists.');
            input.value = oldName;
            return;
        }
        section.name = newName;
        if (activeSectionName === oldName) activeSectionName = newName;
        if (editingSectionName === oldName) editingSectionName = newName;
        if (qaInsertSection === oldName) qaInsertSection = newName;
    });
}

function buildTestJSON() {
    syncSectionNamesFromInputs();
    const moduleName = document.getElementById('moduleNameInput').value.trim() || 'Untitled Module';
    const vocabMode = document.getElementById('vocabModeToggle').checked;
    const numQuestions = parseInt(document.getElementById('creatorNumQuestions').value) || 5;
    const randomOrder = document.getElementById('creatorRandomOrder').checked;
    
    const settings = {
        ask_no_qs_in_test: true,
        no_qs_in_test: numQuestions,
        ask_random: true,
        random: randomOrder,
        ask_sections: true,
        sections: []
    };
    
    const question_dict = {};
    
    // Add regular sections
    creatorSections.forEach(section => {
        const validPairs = section.qaPairs.filter(pair => pair.question.trim() !== '' && pair.answer.trim() !== '');
        if (validPairs.length > 0) {
            settings.sections.push(section.name);
            question_dict[section.name] = validPairs.map(pair => ({
                question: pair.question,
                answer: pair.answer
            }));
            
            // Add reversed section if vocab mode
            if (vocabMode) {
                const reversedName = `${section.name} (Reversed)`;
                settings.sections.push(reversedName);
                question_dict[reversedName] = validPairs.map(pair => ({
                    question: pair.answer,
                    answer: pair.question
                }));
            }
        }
    });
    
    return {
        name: moduleName,
        settings: settings,
        question_dict: question_dict
    };
}

async function saveTestModule() {
    const moduleName = document.getElementById('moduleNameInput').value.trim();
    
    if (!moduleName) {
        alert('Please enter a test module name');
        return;
    }

    const hasValidPairs = creatorSections.some(section =>
        section.qaPairs.some(pair => pair.question.trim() !== '' && pair.answer.trim() !== '')
    );

    if (!hasValidPairs) {
        alert('Please add at least one question/answer pair');
        return;
    }
    
    const testJSON = buildTestJSON();
    
    const oldEditingModuleName = currentEditingModuleName;

    // Remove old entry if this module was renamed
    if (currentEditingModuleName && currentEditingModuleName !== moduleName) {
        delete sampleModules[currentEditingModuleName];
        currentEditingModuleName = moduleName;
    }
    
    // Save to sampleModules
    sampleModules[testJSON.name] = {
        settings: testJSON.settings,
        question_dict: testJSON.question_dict
    };
    
    // Track created or edited modules as imported/custom modules
    if (!builtInSampleModuleNames.includes(testJSON.name)) {
        importedModules.add(testJSON.name);
    }
    if (oldEditingModuleName && oldEditingModuleName !== testJSON.name) {
        importedModules.delete(oldEditingModuleName);
    }
    currentEditingModuleName = testJSON.name;
    
    // Download as JSON
    const saved = await downloadJSON(testJSON);
    if (!saved) {
        alert('Save cancelled. Your module was not downloaded.');
        return;
    }
    
    alert(`Test module "${testJSON.name}" saved and downloaded!`);
    showScreen('moduleSelect');
    populateModuleList();
}

async function downloadJSON(data) {
    const jsonString = JSON.stringify(data, null, 2);

    if (window.showSaveFilePicker) {
        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: `${data.name || 'test_module'}.json`,
                types: [{
                    description: 'JSON Documents',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            const writable = await fileHandle.createWritable();
            await writable.write(jsonString);
            await writable.close();
            return true;
        } catch (error) {
            if (error.name === 'AbortError') {
                return false;
            }
            console.error('Save file picker failed:', error);
        }
    }

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.name || 'test_module'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});
