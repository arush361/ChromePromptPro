// PromptPro Content Script - Enhanced UX Version
class PromptProExtension {
  constructor() {
    this.currentInput = null;
    this.floatingButton = null;
    this.modal = null;
    this.isProcessing = false;
    this.lastText = '';
    this.debounceTimer = null;
    this.activeTab = 'improve';
    this.lastCursorPosition = null;
    // Added: store raw markdown so Apply uses original markdown, not rendered HTML
    this.rawEnhancedMarkdown = '';
    // Added: runtime availability cache
    this._runtimeChecked = false;
    this._runtimeAvailable = false;
    
    // Site-specific selectors
    this.siteConfig = {
      'chat.openai.com': {
        selector: '#prompt-textarea, [contenteditable="true"]',
        name: 'ChatGPT'
      },
      'chatgpt.com': {
        selector: '#prompt-textarea, [contenteditable="true"]',
        name: 'ChatGPT'
      },
      'perplexity.ai': {
        selector: 'textarea[placeholder*="Ask"], [contenteditable="true"]',
        name: 'Perplexity'
      },
      'claude.ai': {
        selector: '[contenteditable="true"][role="textbox"], .ProseMirror',
        name: 'Claude'
      },
      'gemini.google.com': {
        selector: '[contenteditable="true"][role="textbox"], textarea',
        name: 'Gemini'
      },
      'copilot.microsoft.com': {
        // Broadened, ordered selectors: specific IDs/placeholders first, generic fallbacks last
        selector: '#searchbox, textarea[placeholder*="Ask" i], textarea[placeholder*="Write" i], [contenteditable="true"][role="textbox"], textarea, [contenteditable="true"]',
        name: 'Microsoft Copilot'
      }
    };
    
    this.personaOptions = [
      { id: 'tutor', label: '📚 Knowledgeable Tutor', description: 'Expert teaching style with clear explanations' },
      { id: 'friend', label: '🎭 Playful Friend', description: 'Casual, friendly, and engaging tone' },
      { id: 'assistant', label: '🤝 Helpful Assistant', description: 'Professional and efficient support' },
      { id: 'tech', label: '🧑‍💻 Tech Expert', description: 'Technical and detailed approach' },
      { id: 'creative', label: '🎨 Creative Writer', description: 'Imaginative and expressive style' },
      { id: 'neutral', label: '🤖 Neutral Chatbot', description: 'Objective and straightforward responses' },
      { id: 'surprise', label: '✨ Surprise me!', description: 'Random persona for variety' }
    ];
    
    this.init();
  }

  // Added: helper to check runtime availability once, guarding against pages where API is unexpectedly unavailable
  runtimeAvailable() {
    if (!this._runtimeChecked) {
      try {
        this._runtimeAvailable = !!(typeof chrome !== 'undefined' && chrome?.runtime && typeof chrome.runtime.sendMessage === 'function');
      } catch (_) {
        this._runtimeAvailable = false;
      }
      this._runtimeChecked = true;
      if (!this._runtimeAvailable) {
        console.warn('[PromptPro] chrome.runtime.sendMessage unavailable in this context.');
      }
    }
    return this._runtimeAvailable;
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupObserver());
    } else {
      this.setupObserver();
    }
  }

  setupObserver() {
    const observer = new MutationObserver(() => {
      this.findAndAttachToInputs();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => this.findAndAttachToInputs(), 1000);
  }

  findAndAttachToInputs() {
    const hostname = window.location.hostname;
    const config = this.siteConfig[hostname];
    
    if (!config) return;
    
    const inputs = document.querySelectorAll(config.selector);
    
    inputs.forEach(input => {
      if (!input.dataset.promptproAttached) {
        this.attachToInput(input);
        input.dataset.promptproAttached = 'true';
      }
    });
  }

  attachToInput(input) {
    input.addEventListener('input', () => this.handleTextInput(input));
    input.addEventListener('keyup', () => this.handleTextInput(input));
    input.addEventListener('click', (e) => this.updateButtonPosition(input, e));
    input.addEventListener('focus', () => {
      this.currentInput = input;
      this.handleTextInput(input);
    });
    
    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (!this.isProcessing && this.currentInput === input) {
          const text = this.getInputText(input);
          if (text.length === 0) {
            this.hideFloatingButton();
          }
        }
      }, 200);
    });
  }

  handleTextInput(input) {
    const text = this.getInputText(input);
    
    if (text.length >= 3) {
      this.lastText = text;
      this.currentInput = input;
      this.showFloatingButton(input);
    } else {
      this.hideFloatingButton();
    }
  }

  getInputText(input) {
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
      return input.value;
    } else {
      return input.textContent || input.innerText || '';
    }
  }

  setInputText(input, text) {
    if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      input.textContent = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  updateButtonPosition(input, event = null) {
    if (!this.floatingButton || !input) return;
    
    const rect = input.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Get cursor position
    let cursorTop = rect.top;
    if (event) {
      cursorTop = event.clientY;
    } else if (input.tagName === 'TEXTAREA') {
      const textBeforeCursor = input.value.substring(0, input.selectionStart);
      const lines = textBeforeCursor.split('\n');
      const lineHeight = parseInt(window.getComputedStyle(input).lineHeight);
      cursorTop = rect.top + (lines.length - 1) * lineHeight;
    }
    
    this.floatingButton.style.position = 'absolute';
    this.floatingButton.style.top = `${cursorTop + scrollTop - 35}px`;
    this.floatingButton.style.left = `${rect.right + scrollLeft - 140}px`;
    this.floatingButton.style.zIndex = '10000';
  }

  showFloatingButton(input) {
    if (this.floatingButton) {
      this.updateButtonPosition(input);
      return;
    }
    
    this.floatingButton = document.createElement('div');
    this.floatingButton.className = 'promptpro-floating-button';
    this.floatingButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
      </svg>
      <span>Improve Prompt</span>
    `;
    
    this.floatingButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showEnhancementModal();
    });
    
    this.updateButtonPosition(input);
    document.body.appendChild(this.floatingButton);
  }

  hideFloatingButton() {
    if (this.floatingButton) {
      this.floatingButton.remove();
      this.floatingButton = null;
    }
  }

  showEnhancementModal() {
    if (this.modal) {
      this.modal.remove();
    }
    
    const originalText = this.getInputText(this.currentInput);
    
    this.modal = document.createElement('div');
    this.modal.className = 'promptpro-modal';
    this.modal.innerHTML = `
      <div class="promptpro-modal-content" role="dialog" aria-modal="true" aria-label="PromptPro Enhancement">
        <div class="promptpro-modal-header">
          <div class="promptpro-tabs" role="tablist">
            <button class="promptpro-tab ${this.activeTab === 'improve' ? 'active' : ''}" data-tab="improve" role="tab" aria-selected="${this.activeTab === 'improve'}">
              ✨ Improved Prompt
            </button>
            <button class="promptpro-tab ${this.activeTab === 'refine' ? 'active' : ''}" data-tab="refine" role="tab" aria-selected="${this.activeTab === 'refine'}">
              🚀 Refine
            </button>
          </div>
          <button class="promptpro-close-btn" aria-label="Close enhancement modal">&times;</button>
        </div>
        
        <div class="promptpro-tab-content" id="improve-tab" ${this.activeTab === 'improve' ? '' : 'style="display:none"'}>
          <div class="promptpro-enhanced-preview" role="region" aria-live="polite" aria-label="Improved prompt preview"></div>
          <div class="promptpro-modal-actions">
            <button class="promptpro-btn promptpro-btn-apply" disabled>Apply Enhanced Prompt</button>
          </div>
        </div>
        
        <div class="promptpro-tab-content" id="refine-tab" ${this.activeTab === 'refine' ? '' : 'style="display:none"'}>
          <div class="promptpro-refine-description">
            <p>What is the primary persona or role you want the AI to adopt during the conversation?</p>
          </div>
          <div class="promptpro-refine-tags">
            ${this.personaOptions.map(persona => `
              <div class="promptpro-refine-tag" data-tag="${persona.id}" role="button" tabindex="0" aria-pressed="false">
                <div class="promptpro-tag-label">${persona.label}</div>
                <div class="promptpro-tag-description">${persona.description}</div>
              </div>
            `).join('')}
          </div>
          <div class="promptpro-modal-actions promptpro-refine-actions">
            <button class="promptpro-btn promptpro-btn-refine" aria-label="Refine with selected persona" disabled>🎯 Refine with Selected Persona</button>
          </div>
        </div>
      </div>
    `;
    
    this.positionModal();
    document.body.appendChild(this.modal);
    this.setupModalEvents();
    
    // Auto-improve on first tab
    if (this.activeTab === 'improve' && originalText.length >= 3) {
      setTimeout(() => this.improvePrompt(originalText), 500);
    }
  }

  setupModalEvents() {
    // Tab switching
    this.modal.querySelectorAll('.promptpro-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabType = e.target.dataset.tab;
        this.switchTab(tabType);
      });
    });
    
    // Close button
    this.modal.querySelector('.promptpro-close-btn').addEventListener('click', () => this.hideModal());
    
    // Apply button
    this.modal.querySelector('.promptpro-btn-apply').addEventListener('click', () => {
      const preview = this.modal.querySelector('.promptpro-enhanced-preview');
      // Pass stored raw markdown (fallback to preview text)
      this.applyEnhancedPrompt(this.rawEnhancedMarkdown || preview.textContent);
    });
    
    // Refine tags (click + keyboard accessibility)
    const refineButton = this.modal.querySelector('.promptpro-btn-refine');
    this.modal.querySelectorAll('.promptpro-refine-tag').forEach(tag => {
      const selectTag = () => {
        this.modal.querySelectorAll('.promptpro-refine-tag').forEach(t => {
          t.classList.remove('selected');
          t.setAttribute('aria-pressed', 'false');
        });
        tag.classList.add('selected');
        tag.setAttribute('aria-pressed', 'true');
        if (refineButton) {
          refineButton.disabled = false;
        }
      };
      tag.addEventListener('click', selectTag);
      tag.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectTag();
        }
      });
    });
    
    // Refine button
    if (refineButton) {
      refineButton.addEventListener('click', () => {
        if (!refineButton.disabled) {
          this.refinePrompt();
        }
      });
    }
  }

  switchTab(tabType) {
    this.activeTab = tabType;
    
    // Update tab buttons
    this.modal.querySelectorAll('.promptpro-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabType);
    });
    
    // Update tab content
    this.modal.querySelectorAll('.promptpro-tab-content').forEach(content => {
      content.style.display = content.id === `${tabType}-tab` ? 'block' : 'none';
    });
  }

  async improvePrompt(text = null) {
    const originalText = text || this.getInputText(this.currentInput);
    if (originalText.length < 3) return;
    
    // Defensive runtime availability check
    if (!this.runtimeAvailable()) {
      this.updateEnhancedText('❌ Extension runtime unavailable. Refresh the page or reload the extension.', false);
      return;
    }
    
    this.isProcessing = true;
    this.showLoading('Enhancing your prompt...');
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'enhancePrompt',
        text: originalText
      });
      
      if (response?.success) {
        this.updateEnhancedText(response.enhancedText, true);
      } else {
        const errMsg = response?.error || 'Unknown error';
        this.updateEnhancedText(`❌ Failed to enhance: ${errMsg}`, false);
      }
    } catch (error) {
      this.updateEnhancedText(`❌ Error: ${error.message}`, false);
    } finally {
      this.isProcessing = false;
    }
  }

  async refinePrompt() {
    const refineButton = this.modal?.querySelector('.promptpro-btn-refine');
    const selectedTag = this.modal.querySelector('.promptpro-refine-tag.selected');
    if (!selectedTag) {
      this.showError('Please select a persona');
      return;
    }
    
    // Defensive runtime availability check
    if (!this.runtimeAvailable()) {
      this.switchTab('improve');
      this.updateEnhancedText('❌ Extension runtime unavailable. Refresh the page or reload the extension.', false);
      return;
    }
    
    const persona = this.personaOptions.find(p => p.id === selectedTag.dataset.tag);
    const originalText = this.getInputText(this.currentInput);
    
    // Disable refine button during request
    if (refineButton) {
      refineButton.disabled = true;
      refineButton.setAttribute('aria-busy', 'true');
      refineButton.dataset.originalLabel = refineButton.textContent;
      refineButton.textContent = 'Refining...';
    }
    
    // Switch to improved tab and show unified loading spinner
    this.switchTab('improve');
    this.isProcessing = true;
    this.showLoading('Refining your prompt...');
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'refinePrompt',
        text: originalText,
        refinements: `Adopt the persona of ${persona.label}: ${persona.description}`
      });
      
      if (response?.success) {
        this.updateEnhancedText(response.enhancedText, true);
      } else {
        const errMsg = response?.error || 'Unknown error';
        this.updateEnhancedText(`❌ Failed to refine: ${errMsg}`, false);
      }
    } catch (error) {
      this.updateEnhancedText(`❌ Error: ${error.message}`, false);
    } finally {
      this.isProcessing = false;
      if (refineButton && this.modal) { // Only restore if modal still open
        refineButton.removeAttribute('aria-busy');
        refineButton.textContent = refineButton.dataset.originalLabel || '🎯 Refine with Selected Persona';
        refineButton.disabled = false; // Allow re-refining without reselecting persona
      }
    }
  }

  // --- Markdown Rendering Helpers ---
  escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
  }

  markdownToHtml(markdown) {
    if (!markdown) return '';
    // Normalize line endings
    let text = markdown.replace(/\r\n?/g, '\n');

    // Tolerant full-response fenced block unwrap (```markdown ... ``` or ``` ... ```), allowing
    // optional language token, trailing spaces, and missing final newline before closing fence.
    let trimmed = text.trim();
    let fullFenceMatch = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n?```$/i);
    if (fullFenceMatch) {
      text = fullFenceMatch[1];
    } else if (/^```/.test(trimmed)) {
      // Fallback: manually unwrap if starts with fence and ends with fence, even if spacing is odd
      const firstLineEnd = trimmed.indexOf('\n');
      if (firstLineEnd !== -1) {
        const firstLine = trimmed.slice(0, firstLineEnd);
        if (/^```[a-zA-Z0-9_-]*\s*$/.test(firstLine) && trimmed.endsWith('```')) {
          const inner = trimmed.slice(firstLineEnd + 1, -3); // drop final ```
          // Only unwrap if inner itself is not just blank (avoid stripping legitimate small code blocks)
            if (inner.trim().length > 0) {
              text = inner;
            }
        }
      }
    }

    // Escape HTML first (after potential unwrap so internal markdown can be parsed)
    text = this.escapeHtml(text);

    // Handle remaining fenced code blocks ``` ... ``` (they stay as code)
    const codeBlocks = [];
    text = text.replace(/```([\s\S]*?)```/g, (m, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
      return `@@CODEBLOCK${idx}@@`;
    });

    // Inline code `code`
    text = text.replace(/`([^`]+)`/g, (m, code) => `<code>${code}</code>`);

    // Bold **text** or __text__ (non-greedy)
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
               .replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic *text* or _text_ (avoid already bold inside)
    text = text.replace(/(^|\W)\*(?!\*)([^*]+?)\*(?=\W|$)/g, '$1<em>$2</em>')
               .replace(/(^|\W)_(?!_)([^_]+?)_(?=\W|$)/g, '$1<em>$2</em>');

    // Split into lines for block-level parsing
    const lines = text.split(/\n/);
    let html = '';
    let inUl = false, inOl = false;

    const flushLists = () => {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
    };

    lines.forEach(rawLine => {
      let line = rawLine.trimEnd();
      if (!line.trim()) { flushLists(); return; }

      // Headings
      if (/^###\s+/.test(line)) { flushLists(); html += `<h3>${line.replace(/^###\s+/, '')}</h3>`; return; }
      if (/^##\s+/.test(line)) { flushLists(); html += `<h2>${line.replace(/^##\s+/, '')}</h2>`; return; }
      if (/^#\s+/.test(line)) { flushLists(); html += `<h1>${line.replace(/^#\s+/, '')}</h1>`; return; }

      // Ordered list
      if (/^\d+\.\s+/.test(line)) {
        if (!inOl) { flushLists(); html += '<ol>'; inOl = true; }
        const content = line.replace(/^\d+\.\s+/, '');
        html += `<li>${content}</li>`;
        return;
      }

      // Unordered list
      if (/^(?:[-*+]\s+)/.test(line)) {
        if (!inUl) { flushLists(); html += '<ul>'; inUl = true; }
        const content = line.replace(/^[-*+]\s+/, '');
        html += `<li>${content}</li>`;
        return;
      }

      // Paragraph
      flushLists();
      html += `<p>${line}</p>`;
    });

    flushLists();

    // Restore code blocks
    html = html.replace(/@@CODEBLOCK(\d+)@@/g, (m, i) => codeBlocks[i] || m);

    return html;
  }

  updateEnhancedText(text, enableApply) {
    const preview = this.modal?.querySelector('.promptpro-enhanced-preview');
    const applyBtn = this.modal?.querySelector('.promptpro-btn-apply');
    if (!preview) return;

    if (enableApply) {
      // Store raw markdown before rendering
      this.rawEnhancedMarkdown = text;
      preview.innerHTML = this.markdownToHtml(text);
    } else {
      preview.textContent = text;
    }

    if (applyBtn) applyBtn.disabled = !enableApply || !text.trim();
  }

  showLoading(message) {
    const preview = this.modal?.querySelector('.promptpro-enhanced-preview');
    const applyBtn = this.modal?.querySelector('.promptpro-btn-apply');
    if (!preview) return;
    preview.innerHTML = `
      <div class="promptpro-loading" role="status" aria-live="polite">
        <span class="promptpro-spinner" aria-hidden="true"></span>
        <span class="promptpro-loading-text">${message}</span>
      </div>
    `;
    if (applyBtn) applyBtn.disabled = true;
  }

  positionModal() {
    if (!this.currentInput) return;
    
    const rect = this.currentInput.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    const modalWidth = 500;
    const modalHeight = 400;
    
    let top = rect.bottom + scrollTop + 10;
    let left = rect.left + scrollLeft;
    
    // Center horizontally if space allows
    if (window.innerWidth > modalWidth + 40) {
      left = (window.innerWidth - modalWidth) / 2;
    }
    
    // Adjust if modal would go off screen
    if (left + modalWidth > window.innerWidth) {
      left = window.innerWidth - modalWidth - 20;
    }
    if (top + modalHeight > window.innerHeight + scrollTop) {
      top = rect.top + scrollTop - modalHeight - 10;
    }
    
    this.modal.style.position = 'absolute';
    this.modal.style.top = `${top}px`;
    this.modal.style.left = `${left}px`;
    this.modal.style.zIndex = '1000000';
  }

  applyEnhancedPrompt(enhancedText) {
    const finalText = this.rawEnhancedMarkdown || enhancedText || '';
    if (this.currentInput) {
      this.setInputText(this.currentInput, finalText);
      this.lastText = finalText;
      this.hideFloatingButton();
    }
    this.hideModal();
  }

  hideModal() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'promptpro-error-notification';
    errorDiv.textContent = `PromptPro: ${message}`;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 4000);
  }
}

// Initialize the extension
new PromptProExtension();