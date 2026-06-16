document.addEventListener('DOMContentLoaded', () => {
    const corpusInput = document.getElementById('corpus');
    const nValueSlider = document.getElementById('n-value');
    const nValueDisplay = document.getElementById('n-value-display');
    const outputLengthSlider = document.getElementById('output-length');
    const lengthDisplay = document.getElementById('length-display');
    const seedPhraseInput = document.getElementById('seed-phrase');
    const generateBtn = document.getElementById('generate-btn');
    const outputBox = document.getElementById('output-box');

    // Update displays on slider input
    nValueSlider.addEventListener('input', (e) => {
        nValueDisplay.textContent = e.target.value;
    });

    outputLengthSlider.addEventListener('input', (e) => {
        lengthDisplay.textContent = e.target.value;
    });

    // Generate Text
    generateBtn.addEventListener('click', () => {
        const corpus = corpusInput.value.trim();
        const n = parseInt(nValueSlider.value);
        const length = parseInt(outputLengthSlider.value);
        const seedPhrase = seedPhraseInput.value.trim();

        if (!corpus) {
            outputBox.innerHTML = '<p style="color: #ef4444;">Please provide a text corpus first!</p>';
            return;
        }

        generateBtn.textContent = "Generating...";
        generateBtn.disabled = true;

        // Slight delay to allow UI to update
        setTimeout(() => {
            try {
                const generatedText = generateNGramText(corpus, n, length, seedPhrase);
                if (generatedText) {
                    outputBox.innerHTML = `<p>${generatedText}</p>`;
                } else {
                    outputBox.innerHTML = '<p style="color: #ef4444;">Corpus is too short for the selected N value.</p>';
                }
            } catch (error) {
                console.error(error);
                outputBox.innerHTML = '<p style="color: #ef4444;">An error occurred during generation.</p>';
            } finally {
                generateBtn.textContent = "Generate Text";
                generateBtn.disabled = false;
            }
        }, 50);
    });

    function generateNGramText(text, n, maxWords, seedPhrase = "") {
        // Simple word tokenization (splitting by whitespace)
        // Keep punctuation attached to words for simpler formatting
        const tokens = text.trim().split(/\s+/);
        
        if (tokens.length < n) {
            return null; // Not enough words
        }

        // Build N-Gram Map
        // Key: string of n-1 words
        // Value: array of next words
        const nGramMap = new Map();
        
        for (let i = 0; i <= tokens.length - n; i++) {
            const history = tokens.slice(i, i + n - 1).join(' ');
            const nextWord = tokens[i + n - 1];

            if (!nGramMap.has(history)) {
                nGramMap.set(history, []);
            }
            nGramMap.get(history).push(nextWord);
        }

        // Generate Text
        const keys = Array.from(nGramMap.keys());
        let currentHistory = null;
        let output = [];

        if (seedPhrase) {
            const seedTokens = seedPhrase.trim().split(/\s+/);
            
            // If seed has enough words for a history (n-1)
            if (seedTokens.length >= n - 1) {
                const targetHistory = seedTokens.slice(-(n - 1)).join(' ');
                if (nGramMap.has(targetHistory)) {
                    currentHistory = targetHistory;
                    output = [...seedTokens];
                }
            }
            
            // Try to find a key that starts with the seed phrase
            if (!currentHistory) {
                const seedStrLower = seedPhrase.trim().toLowerCase();
                const matchingKeys = keys.filter(k => k.toLowerCase().startsWith(seedStrLower));
                
                if (matchingKeys.length > 0) {
                    currentHistory = matchingKeys[Math.floor(Math.random() * matchingKeys.length)];
                    output = currentHistory.split(' ');
                } else {
                    // Try to find any key containing the seed phrase
                    const containingKeys = keys.filter(k => k.toLowerCase().includes(seedStrLower));
                    if (containingKeys.length > 0) {
                        currentHistory = containingKeys[Math.floor(Math.random() * containingKeys.length)];
                        output = currentHistory.split(' ');
                    }
                }
            }
        }

        // Fallback if no matching seed found or no seed provided
        if (!currentHistory) {
            currentHistory = keys[Math.floor(Math.random() * keys.length)];
            output = currentHistory.split(' ');
        }

        for (let i = 0; i < maxWords - (n - 1); i++) {
            const possibleNextWords = nGramMap.get(currentHistory);
            
            if (!possibleNextWords || possibleNextWords.length === 0) {
                break; // Dead end
            }

            // Pick a random next word
            const nextWord = possibleNextWords[Math.floor(Math.random() * possibleNextWords.length)];
            output.push(nextWord);

            // Update history
            const historyTokens = currentHistory.split(' ');
            historyTokens.shift();
            historyTokens.push(nextWord);
            currentHistory = historyTokens.join(' ');
        }

        return output.join(' ');
    }
});
