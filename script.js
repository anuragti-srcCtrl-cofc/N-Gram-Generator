document.addEventListener('DOMContentLoaded', () => {
    const corpusInput = document.getElementById('corpus');
    const nValueSlider = document.getElementById('n-value');
    const nValueDisplay = document.getElementById('n-value-display');
    const outputLengthSlider = document.getElementById('output-length');
    const lengthDisplay = document.getElementById('length-display');
    const creativitySlider = document.getElementById('creativity');
    const creativityDisplay = document.getElementById('creativity-display');
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
    
    creativitySlider.addEventListener('input', (e) => {
        creativityDisplay.textContent = e.target.value;
    });

    // Generate Text
    generateBtn.addEventListener('click', () => {
        const corpus = corpusInput.value.trim();
        const n = parseInt(nValueSlider.value);
        const length = parseInt(outputLengthSlider.value);
        const creativity = parseInt(creativitySlider.value) / 100.0;
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
                const generatedText = generateNGramText(corpus, n, length, seedPhrase, creativity);
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

    function generateNGramText(text, n, maxWords, seedPhrase = "", creativity = 0.3) {
        const tokens = text.trim().split(/\s+/);
        
        if (tokens.length < n) {
            return null;
        }

        // Build N-Gram Map
        const nGramMap = new Map();
        
        for (let i = 0; i <= tokens.length - n; i++) {
            const history = tokens.slice(i, i + n - 1).join(' ');
            const nextWord = tokens[i + n - 1];

            if (!nGramMap.has(history)) {
                nGramMap.set(history, []);
            }
            nGramMap.get(history).push(nextWord);
        }

        const keys = Array.from(nGramMap.keys());
        let currentHistory = null;
        let output = [];

        if (seedPhrase) {
            const seedTokens = seedPhrase.trim().split(/\s+/);
            output = [...seedTokens]; 
            
            const seedStrLower = seedPhrase.trim().toLowerCase();
            const lastWordLower = seedTokens[seedTokens.length - 1].toLowerCase();

            if (seedTokens.length >= n - 1) {
                const targetHistoryLower = seedTokens.slice(-(n - 1)).join(' ').toLowerCase();
                const exactMatch = keys.find(k => k.toLowerCase() === targetHistoryLower);
                if (exactMatch) currentHistory = exactMatch;
            }
            
            if (!currentHistory) {
                const matchingKeys = keys.filter(k => k.toLowerCase().startsWith(seedStrLower));
                if (matchingKeys.length > 0) {
                    currentHistory = matchingKeys[Math.floor(Math.random() * matchingKeys.length)];
                    const keyTokens = currentHistory.split(' ');
                    if (keyTokens.length > seedTokens.length) {
                        output.push(...keyTokens.slice(seedTokens.length));
                    }
                }
            }

            if (!currentHistory) {
                const matchingKeys = keys.filter(k => k.toLowerCase().includes(lastWordLower));
                if (matchingKeys.length > 0) {
                    currentHistory = matchingKeys[Math.floor(Math.random() * matchingKeys.length)];
                }
            }
        }

        if (!currentHistory) {
            currentHistory = keys[Math.floor(Math.random() * keys.length)];
            if (!seedPhrase) {
                output = currentHistory.split(' ');
            }
        }

        const wordsToGenerate = Math.max(0, maxWords - output.length);
        
        for (let i = 0; i < wordsToGenerate; i++) {
            let possibleNextWords = nGramMap.get(currentHistory);
            
            // ANTI-REGURGITATION: 
            // If there's only 1 possible next word, it means we are in a deterministic path
            // exactly copying the text. Based on 'creativity', we randomly do a "Stupid Backoff"
            // where we drop the oldest word in history to find more branching paths.
            if (possibleNextWords && possibleNextWords.length === 1 && Math.random() < creativity) {
                const historyTokens = currentHistory.split(' ');
                
                // Try backing off step by step (N-2, N-3, etc)
                for (let backoff = 1; backoff < historyTokens.length; backoff++) {
                    const shorterHistory = historyTokens.slice(backoff).join(' ');
                    
                    // We only want keys that actually end with our shorter history. 
                    // This creates a smaller n-gram context!
                    const matchingKeys = keys.filter(k => {
                        const kTokens = k.split(' ');
                        const kSuffix = kTokens.slice(-shorterHistory.split(' ').length).join(' ');
                        return kSuffix === shorterHistory;
                    });
                    
                    if (matchingKeys.length > 1) {
                        const branchingWords = [];
                        for (const k of matchingKeys) {
                            branchingWords.push(...nGramMap.get(k));
                        }
                        
                        // Only backoff if it actually gives us more choices
                        if (branchingWords.length > 1) {
                            possibleNextWords = branchingWords;
                            break; 
                        }
                    }
                }
            }
            
            // Failsafe for dead end
            if (!possibleNextWords || possibleNextWords.length === 0) {
                currentHistory = keys[Math.floor(Math.random() * keys.length)];
                possibleNextWords = nGramMap.get(currentHistory);
                
                if (!possibleNextWords || possibleNextWords.length === 0) {
                    break; 
                }
            }

            const nextWord = possibleNextWords[Math.floor(Math.random() * possibleNextWords.length)];
            output.push(nextWord);

            const historyTokens = currentHistory.split(' ');
            historyTokens.shift();
            historyTokens.push(nextWord);
            currentHistory = historyTokens.join(' ');
        }

        return output.join(' ');
    }
});
