const inputText = document.getElementById('inputText');
const submitButton = document.getElementById('submitButton');
const outputDiv = document.getElementById('output');

let model; // This variable will hold our loaded TensorFlow.js model

// Function to load the Universal Sentence Encoder model
async function loadModel() {
    outputDiv.innerText = "Loading the Universal Sentence Encoder model... (This might take a moment)";
    submitButton.disabled = true; // Disable button while loading

    try {
        // Load the model. The 'universal-sentence-encoder' library is loaded via CDN in index.html
        model = await use.load();
        outputDiv.innerText = "Model loaded successfully! Enter text and click 'Run Task'.";
        submitButton.disabled = false; // Enable button once model is ready
    } catch (error) {
        outputDiv.innerText = `Error loading model: ${error.message}. Please check your console (Ctrl+Shift+I or F12) for details.`;
        console.error("Model loading error:", error);
    }
}

// Function to run the task when the button is clicked
submitButton.addEventListener('click', async () => {
    const text = inputText.value.trim();
    if (!text) {
        outputDiv.innerText = "Please enter some text in the input field.";
        return;
    }

    if (!model) {
        outputDiv.innerText = "Model is not loaded yet. Please wait or refresh the page.";
        return;
    }

    outputDiv.innerText = "Processing text with the model...";
    submitButton.disabled = true; // Disable button during processing

    try {
        // --- This is where the core logic for your "task" goes ---
        // For Universal Sentence Encoder, the task is to generate embeddings (numerical representations of text).
        const embeddings = await model.embed(text);

        // Convert the embeddings (TensorFlow.js Tensors) to a plain JavaScript array
        const embeddingsArray = embeddings.arraySync()[0]; // Get the first (and only) sentence embedding

        // Display a portion of the embeddings in the output
        outputDiv.innerText = `Embeddings (first 10 values of 512 total):\n[${embeddingsArray.slice(0, 10).map(f => f.toFixed(6)).join(', ')}...]`;

        // In a real application, you'd then use these embeddings for something meaningful,
        // like:
        // - Comparing similarity between input text and other texts.
        // - Classifying the text based on its semantic meaning.
        // - Clustering related texts.

    } catch (error) {
        outputDiv.innerText = `Error running task: ${error.message}. Check your console for details.`;
        console.error("Task execution error:", error);
    } finally {
        submitButton.disabled = false; // Re-enable the button
    }
});

// Initialize the model when the page loads
loadModel();