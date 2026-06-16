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
            output = [...seedTokens]; // Always ensure the seed phrase is in the output
            
            const seedStrLower = seedPhrase.trim().toLowerCase();
            const lastWordLower = seedTokens[seedTokens.length - 1].toLowerCase();

            // 1. Exact match of the last n-1 words (if seed is long enough)
            if (seedTokens.length >= n - 1) {
                const targetHistoryLower = seedTokens.slice(-(n - 1)).join(' ').toLowerCase();
                const exactMatch = keys.find(k => k.toLowerCase() === targetHistoryLower);
                if (exactMatch) {
                    currentHistory = exactMatch;
                }
            }
            
            // 2. Prefix match on any key using the whole seed (if seed is short)
            if (!currentHistory) {
                const matchingKeys = keys.filter(k => k.toLowerCase().startsWith(seedStrLower));
                if (matchingKeys.length > 0) {
                    currentHistory = matchingKeys[Math.floor(Math.random() * matchingKeys.length)];
                    // Append the remainder of the matched history to the output to bridge the gap
                    const keyTokens = currentHistory.split(' ');
                    if (keyTokens.length > seedTokens.length) {
                        output.push(...keyTokens.slice(seedTokens.length));
                    }
                }
            }

            // 3. Substring match: Find any key containing the last word of the seed
            if (!currentHistory) {
                const matchingKeys = keys.filter(k => k.toLowerCase().includes(lastWordLower));
                if (matchingKeys.length > 0) {
                    currentHistory = matchingKeys[Math.floor(Math.random() * matchingKeys.length)];
                }
            }
        }

        // 4. Ultimate fallback: Random history
        if (!currentHistory) {
            currentHistory = keys[Math.floor(Math.random() * keys.length)];
            // If there was no seed phrase, initialize output with this random history
            if (!seedPhrase) {
                output = currentHistory.split(' ');
            }
        }

        // Generate remaining words
        const wordsToGenerate = Math.max(0, maxWords - output.length);
        
        for (let i = 0; i < wordsToGenerate; i++) {
            let possibleNextWords = nGramMap.get(currentHistory);
            
            // If we hit a dead end, jump to a random history to keep generating
            if (!possibleNextWords || possibleNextWords.length === 0) {
                currentHistory = keys[Math.floor(Math.random() * keys.length)];
                possibleNextWords = nGramMap.get(currentHistory);
                
                if (!possibleNextWords || possibleNextWords.length === 0) {
                    break; // Failsafe, should only happen if corpus is completely ungeneratable
                }
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
