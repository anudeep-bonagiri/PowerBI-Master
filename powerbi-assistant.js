// Add your Gemini API key here
const GEMINI_API_KEY = 'Enter Your Own API Key Here';

document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('query-input');
    const askBtn = document.getElementById('ask-btn');
    const speakBtn = document.getElementById('speak-btn');
    const saveBtn = document.getElementById('save-btn');
    const clearBtn = document.getElementById('clear-btn');
    const responseContainer = document.getElementById('response');
    const responseText = document.getElementById('response-text');
    const chatHistory = document.getElementById('chat-history');

    let latestResponse = '';
    let chatLog = JSON.parse(localStorage.getItem('powerbi_chat_log')) || [];

    function updateChatUI(question, reply) {
        const chatItem = document.createElement('div');
        chatItem.classList.add('chat-item');
        chatItem.innerHTML = `
            <div class="chat-question">${question}</div>
            <div class="chat-response">${reply}</div>
        `;
        chatHistory.appendChild(chatItem);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Load chat from localStorage on page load
    chatLog.forEach(entry => {
        updateChatUI(entry.question, entry.response);
    });

    async function askPowerBIQuestion(question) {
        try {
            responseText.textContent = 'Thinking...';
            responseContainer.style.display = 'block';

            if (!question || question.length < 5) {
                throw new Error('Please enter a valid Power BI question.');
            }

            const context = `
You are the Power BI Master, an AI assistant designed to help users with:
- Writing DAX formulas
- Troubleshooting visuals
- Data modeling, relationships, filters
- Power Query, transformations
- Publishing and optimizing dashboards
Be concise, helpful, and technical when needed.
`;

            const requestPayload = {
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 64,
                    maxOutputTokens: 2048
                },
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: `${context}\n\nUser question: ${question}` }
                        ]
                    }
                ]
            };

            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestPayload)
            });

            const data = await response.json();

            if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
                throw new Error('Unexpected response format.');
            }

            const reply = data.candidates[0].content.parts[0].text;
            responseText.textContent = reply;
            latestResponse = reply;

            chatLog.push({ question, response: reply });
            localStorage.setItem('powerbi_chat_log', JSON.stringify(chatLog));
            updateChatUI(question, reply);

        } catch (error) {
            console.error('Error:', error);
            responseText.textContent = 'Error: ' + error.message;
        }
    }

    function speakResponse() {
        if ('speechSynthesis' in window && latestResponse) {
            const utterance = new SpeechSynthesisUtterance(latestResponse);
            window.speechSynthesis.speak(utterance);
        }
    }

    function saveChatAsText() {
        let chatText = '💬 Power BI Assistant Chat Log\n\n';
        chatLog.forEach((entry, i) => {
            chatText += `🧑 Q${i + 1}: ${entry.question}\n🤖 A${i + 1}: ${entry.response}\n\n`;
        });

        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'powerbi_chat_log.txt';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    askBtn.addEventListener('click', () => {
        const question = inputField.value.trim();
        askPowerBIQuestion(question);
    });

    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') askBtn.click();
    });

    speakBtn.addEventListener('click', () => {
        speakResponse();
    });

    saveBtn.addEventListener('click', () => {
        saveChatAsText();
    });

    clearBtn.addEventListener('click', () => {
        if (confirm("Clear all chat history?")) {
            localStorage.removeItem('powerbi_chat_log');
            chatLog = [];
            chatHistory.innerHTML = '';
        }
    });
});
