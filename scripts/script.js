import { marked } from 'https://cdn.jsdelivr.net/npm/marked@15.0.7/+esm';
import dompurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.2.4/+esm';

const deleteButton = document.getElementById("deleteButton");

const messagesContainer = document.getElementById('messagesContainer');

const userInput = document.getElementById('userInput');

const sendButtonContainer = document.getElementById('sendButtonContainer');

const sendButton = document.getElementById('sendButton');

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

let conversationHistory = [];

let maxCharacters = 8000;

function parseMarkdown(text) {

    const rawHTML = marked(text);

    return dompurify.sanitize(rawHTML, { FORBID_ATTR: ['style'] });

}

function calculateHistorySize(history) {

    return history.reduce((total, message) => {

        return total + message.role.length + message.content.length;

    }, 0);

}

function adjustHistory() {

    while (conversationHistory.length > 1 && calculateHistorySize(conversationHistory) > maxCharacters) {

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

    const userMessage = userInput.value;

    if (!userMessage) return;

    conversationHistory.push({ role: 'user', content: userMessage });

    addMessage('user', userMessage);

    userInput.value = '';

    userInput.style.height = 'auto';

    sendButtonContainer.classList.remove('expanded');

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

function addCopyButtonToPre(pre) {

    if (!pre.querySelector('.copyButton')) {

        const button = document.createElement('button');

        button.innerText = 'copy';

        button.classList.add('copyButton', 'noSelect');

        pre.appendChild(button);

        button.addEventListener('click', () => {

            const codeElement = pre.querySelector('code');

            if (codeElement) {

                navigator.clipboard.writeText(codeElement.innerText);

                button.innerText = 'copied';

                setTimeout(() => button.innerText = 'copy', 2000);

            }

        });

    }

}

const observer = new MutationObserver((mutationsList) => {

    mutationsList.forEach(mutation => {

        if (mutation.type === 'childList') {

            mutation.addedNodes.forEach(node => {

                if (node.nodeType === Node.ELEMENT_NODE) {

                    if (node.matches('pre')) {

                        addCopyButtonToPre(node);

                    } else {

                        node.querySelectorAll('pre').forEach(pre => addCopyButtonToPre(pre));

                    }

                }

            });

        }

    });

});

observer.observe(messagesContainer, { childList: true, subtree: true });

document.querySelectorAll('pre').forEach(pre => addCopyButtonToPre(pre));

userInput.addEventListener('input', function () {

    this.style.height = 'auto';

    const newHeight = Math.min(this.scrollHeight, 200);

    this.style.height = newHeight + 'px';

    sendButtonContainer.classList.toggle('expanded', newHeight > 54);

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