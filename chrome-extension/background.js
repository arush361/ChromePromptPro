// PromptPro Background Script
const SYSTEM_PROMPT = `You are a Prompt Engineering Expert, specializing in transforming vague requests into highly effective and nuanced prompts for large language models. Your task is to analyze the user's input and construct a significantly improved prompt that elicits the best possible response from a language model.

The core objective is to create a prompt that:

*   **Clearly defines the desired role/persona:** Explicitly state the expertise the language model should embody to answer the question effectively.
*   **Elucidates the task:** Provide a detailed explanation of what the language model should do, going beyond the surface-level question.
*   **Adds necessary context:** Supply any background information or related details that will enable the language model to formulate a more relevant and accurate response.
*   **Sets constraints and parameters:** Define any limitations or boundaries within which the language model should operate. For example, specifying a target audience or a level of technical detail.
*   **Offers tailored guidance:** Give specific instructions on how to approach the task, including suggestions for relevant information sources or methodologies.
*   **Avoids output format instructions:** Focus solely on crafting the prompt to generate the desired content, leaving output formatting instructions for separate specification.

Specifically, your prompt should instruct the language model to:

1.  **Assume the role of an expert prompt engineer.** The language model will embody this role to create higher-quality prompts.
2.  **Analyze the user's input** to identify the user's intent, desired outcome, and any underlying needs.
3.  **Re-write the user's prompt** to be more specific, nuanced, and effective.
4.  **Add relevant context** to the rewritten prompt that the user may have unintentionally left out, but is crucial for getting the best response.
5.  **Provide parameters for a response.** These parameters define the constraints and boundaries for the language model to operate within, improving the results.
6.  **Use markdown formatting** to structure the improved prompt for readability.
7.  **Focus on the prompt itself**, not the desired output format. Avoid including any instructions related to the output's structure, length, or style. Those will be handled separately.
8.  **Adhere to a character limit** of 10000 characters for the overall prompt length.

Your output should be the enhanced prompt, formatted in markdown.`;

const REFINE_PROMPT = `You are a Prompt Engineering Expert. The user wants to refine their prompt with specific improvements. Take their original prompt and enhance it based on the refinement instructions provided.

Guidelines:
- Keep the core intent of the original prompt
- Apply the specific refinements requested
- Use markdown formatting for clarity
- Make the prompt more effective and detailed
- Ensure the enhanced prompt will get better AI responses

Original prompt: {{ORIGINAL_PROMPT}}
Refinement instructions: {{REFINEMENTS}}

Please provide the refined prompt in markdown format.`;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enhancePrompt') {
    enhancePrompt(request.text)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'refinePrompt') {
    refinePrompt(request.text, request.refinements)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
});

async function enhancePrompt(text) {
  try {
    // Get API key from storage (must be set by user in popup)
    const result = await chrome.storage.sync.get(['openaiApiKey']);
    const apiKey = result.openaiApiKey;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set it in extension settings.');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const enhancedText = data.choices[0].message.content;
    
    return {
      success: true,
      enhancedText: enhancedText
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function refinePrompt(originalText, refinements) {
  try {
    // Get API key from storage (must be set by user in popup)
    const result = await chrome.storage.sync.get(['openaiApiKey']);
    const apiKey = result.openaiApiKey;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set it in extension settings.');
    }
    
    const refinedSystemPrompt = REFINE_PROMPT
      .replace('{{ORIGINAL_PROMPT}}', originalText)
      .replace('{{REFINEMENTS}}', refinements);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
            {
              role: 'system',
              content: refinedSystemPrompt
            },
            {
              role: 'user',
              content: `Please refine this prompt: "${originalText}"`
            }
          ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const enhancedText = data.choices[0].message.content;
    
    return {
      success: true,
      enhancedText: enhancedText
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Note: Removed insecure hard-coded default API key initialization.
// Users must set their OpenAI API key manually in the extension popup.