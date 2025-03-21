import { marked } from 'https://cdn.jsdelivr.net/npm/marked@15.0.7/+esm';
import dompurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.2.4/+esm';

const deleteButton = document.getElementById("deleteButton");

const messagesContainer = document.getElementById('messagesContainer');

const userInput = document.getElementById('userInput');

const sendButton = document.getElementById('sendButton');

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

let conversationHistory = [];

function parseMarkdown(text) {

    const rawHTML = marked(text);

    return dompurify.sanitize(rawHTML, { FORBID_ATTR: ['style'] });

}

function countTokens(text) {

    const tokens = text.trim().match(/[\wÀ-ÖØ-öø-ÿ']+|[^\s\w]/g);

    return tokens ? tokens.length : 0;

}

function calculateHistoryTokens(history) {

    return history.reduce((total, message) => {

        return total + countTokens(message.content);

    }, 0);

}

function adjustHistory() {

    while (conversationHistory.length > 1 && calculateHistoryTokens(conversationHistory) > 6868) {

        conversationHistory.shift();

    }

}

function addMessage(role, content) {

    const messageDiv = document.createElement('div');

    messageDiv.className = `message ${role}`;

    messageDiv.textContent = content;

    messagesContainer.appendChild(messageDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageDiv;

}

async function sendMessage() {

    const userMessage = userInput.innerText.trim();

    if (!userMessage) return;

    if (countTokens(userMessage) > 6868) {

        alert("Your message exceeds the limit of 8192 tokens. Please shorten it.");

        return;

    }

    conversationHistory.push({ role: 'user', content: userMessage });

    addMessage('user', userMessage);

    userInput.innerText = '';

    userInput.style.height = 'auto';

    adjustHistory();

    const responseElement = addMessage('assistant', '');

    try {

        const response = await fetch('/api/proxy', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ messages: conversationHistory })

        });

        const reader = response.body.getReader();

        const decoder = new TextDecoder();

        let responseText = '';

        while (true) {

            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value);

            responseText += chunk;

            responseElement.innerHTML = parseMarkdown(responseText);

        }

        conversationHistory.push({ role: 'assistant', content: responseText });

        adjustHistory();

    } catch (error) {

        responseElement.textContent = 'Error: ' + error.message;

        console.error(error);

    }

}

userInput.addEventListener('paste', function(e) {

    e.preventDefault();

    const clipboardData = e.clipboardData || window.clipboardData;

    const text = clipboardData.getData('text/plain');

    document.execCommand('insertText', false, text);

});

userInput.addEventListener('keydown', (e) => {

    if (isMobile) return;

    if (e.key === 'Enter' && !e.shiftKey) {

        e.preventDefault();

        sendMessage();

    }

});

deleteButton.addEventListener("click", () => {

    conversationHistory = [];

    messagesContainer.innerHTML = '';

});

sendButton.addEventListener('click', sendMessage);