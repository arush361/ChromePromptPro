// PromptPro Popup Script
/* global chrome */

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('settingsForm');
  const apiKeyInput = document.getElementById('apiKey');
  const testBtn = document.getElementById('testBtn');
  const messageDiv = document.getElementById('message');

  // Load saved API key
  chrome.storage.sync.get(['openaiApiKey'], function(result) {
    if (result.openaiApiKey) {
      apiKeyInput.value = result.openaiApiKey;
    }
  });

  // Save API key
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showMessage('Please enter an API key', 'error');
      return;
    }

    chrome.storage.sync.set({
      openaiApiKey: apiKey
    }, function() {
      showMessage('API key saved successfully!', 'success');
    });
  });

  // Test API key
  testBtn.addEventListener('click', async function() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showMessage('Please enter an API key first', 'error');
      return;
    }

    testBtn.textContent = 'Testing...';
    testBtn.disabled = true;

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (response.ok) {
        showMessage('API key is valid!', 'success');
      } else {
        showMessage('Invalid API key', 'error');
      }
    } catch (error) {
      showMessage('Failed to test API key', 'error');
    } finally {
      testBtn.textContent = 'Test API Key';
      testBtn.disabled = false;
    }
  });

  function showMessage(text, type) {
    messageDiv.innerHTML = `<div class="${type}-message">${text}</div>`;
    setTimeout(() => {
      messageDiv.innerHTML = '';
    }, 3000);
  }
});