// Get references to the HTML elements
const inputText = document.getElementById('inputText');
const submitButton = document.getElementById('submitButton');
const resultOutputDiv = document.getElementById('resultOutput');
const logOutputDiv = document.getElementById('logOutput');

let model; // This variable will hold our loaded TensorFlow.js model instance
// Predefined phrases for semantic similarity task.
// Their embeddings will be calculated once the model is loaded.
const predefinedPhrases = [
    { text: "How do I reset my password?", embedding: null },
    { text: "Where is customer support?", embedding: null },
    { text: "I need help with my bill.", embedding: null },
    { text: "Tell me about your product features.", embedding: null },
    { text: "What are your operating hours?", embedding: null }
];

/**
 * Logs events to the new log output div with a timestamp and message type.
 * @param {string} message - The message to log.
 * @param {string} type - The type of message ('info', 'success', 'error').
 */
function logEvent(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.classList.add('log-entry');
    logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> <span class="log-message ${type}">${message}</span>`;
    logOutputDiv.prepend(logEntry); // Add new logs to the top
    // Optionally keep the log clean by removing old entries
    if (logOutputDiv.children.length > 50) { // Keep max 50 log entries
        logOutputDiv.removeChild(logOutputDiv.lastChild);
    }
}

/**
 * Function to switch between tabs (Result and Log).
 * @param {Event} evt - The click event object.
 * @param {string} tabName - The ID of the tab content to display ('Result' or 'Log').
 */
function openTab(evt, tabName) {
    let i, tabcontent, tabbuttons;

    // Get all elements with class="tab-content" and hide them
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove('active');
    }

    // Get all elements with class="tab-button" and remove the "active" class
    tabbuttons = document.getElementsByClassName("tab-button");
    for (i = 0; i < tabbuttons.length; i++) {
        tabbuttons[i].classList.remove('active');
    }

    // Show the current tab content, and add an "active" class to the clicked button
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
}

// Set the default tab to "Result" on page load
document.addEventListener('DOMContentLoaded', () => {
    // Ensure the Result tab is active when the page first loads
    document.getElementById('Result').classList.add('active');
    // Ensure the corresponding button is also active
    document.querySelector('.tab-button[onclick*="openTab(event, \'Result\')"]').classList.add('active');
});


/**
 * Loads the Universal Sentence Encoder (USE) model from TensorFlow.js.
 * This function is called once when the page loads.
 */
async function loadModel() {
    resultOutputDiv.innerText = "Initializing application...";
    logEvent("Application starting...");
    logEvent("Loading the Universal Sentence Encoder model (this might take a moment)...");
    submitButton.disabled = true; // Disable button while loading

    try {
        // Load the USE model from the CDN
        model = await use.load();
        logEvent("Model loaded successfully!", 'success');

        // Calculate embeddings for predefined phrases
        logEvent("Calculating embeddings for predefined phrases...");
        for (let i = 0; i < predefinedPhrases.length; i++) {
            const phraseEmbeddings = await model.embed(predefinedPhrases[i].text);
            predefinedPhrases[i].embedding = phraseEmbeddings.arraySync()[0];
            logEvent(`Embedded phrase: "${predefinedPhrases[i].text.substring(0, 30)}..."`, 'info');
        }
        logEvent("Predefined phrase embeddings calculated.", 'success');


        resultOutputDiv.innerText = "Model loaded successfully! Enter text and click 'Run Task' for semantic similarity.";
        submitButton.disabled = false; // Enable button once model is ready
    } catch (error) {
        resultOutputDiv.innerText = `Error loading model: ${error.message}. Check Log tab for details.`;
        logEvent(`ERROR: Failed to load model: ${error.message}`, 'error');
        console.error("Model loading error:", error);
    }
}

/**
 * Calculates the cosine similarity between two vectors (embeddings).
 * @param {number[]} vecA - The first vector.
 * @param {number[]} vecB - The second vector.
 * @returns {number} The cosine similarity score (between -1 and 1).
 */
function calculateCosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0; // Avoid division by zero if a vector is zero
    }

    return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Handles the click event for the submit button.
 * It takes the input text, processes it with the loaded model,
 * performs semantic similarity, and displays the result and logs events.
 */
submitButton.addEventListener('click', async () => {
    const text = inputText.value.trim();

    if (!text) {
        resultOutputDiv.innerText = "Please enter some text in the input field before running the task.";
        logEvent("Validation: Input text field is empty.", 'info');
        return;
    }

    if (!model) {
        resultOutputDiv.innerText = "Model is not loaded yet. Please wait or refresh the page.";
        logEvent("Error: Attempted to run task before model was loaded.", 'error');
        return;
    }

    resultOutputDiv.innerText = "Processing text with the Universal Sentence Encoder model and finding similarity...";
    logEvent(`User input received: "${text.substring(0, 50)}..."`, 'info');
    logEvent("Generating embeddings for user input...", 'info');
    submitButton.disabled = true;

    try {
        const embeddings = await model.embed(text);
        const inputEmbedding = embeddings.arraySync()[0];
        logEvent("User input embeddings generated successfully.", 'success');

        let bestMatch = { text: "No close match found.", similarity: -1 };
        logEvent("Comparing user input to predefined phrases...", 'info');

        // Iterate through predefined phrases and find the most similar one
        for (const phrase of predefinedPhrases) {
            // Ensure the phrase has an embedding before comparison
            if (phrase.embedding) {
                const similarity = calculateCosineSimilarity(inputEmbedding, phrase.embedding);
                logEvent(`Compared with "${phrase.text.substring(0, 30)}...": Similarity = ${similarity.toFixed(4)}`, 'info');
                if (similarity > bestMatch.similarity) {
                    bestMatch = { text: phrase.text, similarity: similarity };
                }
            }
        }

        // Display the result in the Result tab
        resultOutputDiv.innerText = `Input text processed.\n\nMost similar predefined phrase: "${bestMatch.text}"\nSimilarity score: ${bestMatch.similarity.toFixed(4)}`;
        logEvent(`Semantic similarity task completed. Best match found: "${bestMatch.text.substring(0, 30)}..." with score ${bestMatch.similarity.toFixed(4)}.`, 'success');

    } catch (error) {
        resultOutputDiv.innerText = `An error occurred while running the task: ${error.message}. Check Log tab for details.`;
        logEvent(`ERROR: Failed to process text for similarity: ${error.message}`, 'error');
        console.error("Task execution error:", error);
    } finally {
        submitButton.disabled = false; // Ensure button is re-enabled
    }
});

// Immediately call loadModel() when the script starts to load the ML model
loadModel();
