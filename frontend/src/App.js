import React, { useState, useRef, useEffect } from 'react';
import './App.css';

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

function App() {
  const [inputText, setInputText] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  const enhancePrompt = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
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
              content: inputText
            }
          ],
          max_tokens: 2000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const enhanced = data.choices[0].message.content;
      setEnhancedPrompt(enhanced);
      setShowPreview(true);
    } catch (err) {
      setError(`Failed to enhance prompt: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(enhancedPrompt);
  };

  const resetApp = () => {
    setInputText('');
    setEnhancedPrompt('');
    setShowPreview(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PromptPro
              </h1>
            </div>
            <p className="text-slate-600 text-sm hidden sm:block">
              Transform your ideas into perfect AI prompts
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {!showPreview ? (
          /* Input Mode */
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-slate-800">
                Write Better AI Prompts
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Enter your rough idea or question below, and we'll transform it into a powerful, 
                detailed prompt that gets you better AI responses.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="p-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Your prompt idea
                </label>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Example: Help me write a blog post about AI..."
                    className="w-full h-40 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-slate-700 placeholder-slate-400"
                  />
                  
                  {/* Floating Button */}
                  {inputText.trim() && (
                    <div className="absolute bottom-4 right-4 animate-in slide-in-from-bottom-2 duration-300">
                      <button
                        onClick={enhancePrompt}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium">Enhancing...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="text-sm font-medium">Improve Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Example Prompts */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Try these examples:
              </h3>
              <div className="grid gap-3">
                {[
                  "Help me write a blog post about AI",
                  "Create a marketing plan for my startup",
                  "Explain quantum computing to a beginner",
                  "Write a cover letter for a software engineer position"
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setInputText(example)}
                    className="text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 text-slate-700"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Preview Mode */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Enhanced Prompt</h2>
              <div className="flex space-x-3">
                <button
                  onClick={copyToClipboard}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy</span>
                </button>
                <button
                  onClick={resetApp}
                  className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                  <span>New Prompt</span>
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Original Prompt */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Original</h3>
                <div className="bg-white p-4 rounded-lg border text-slate-600">
                  {inputText}
                </div>
              </div>

              {/* Enhanced Prompt */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Enhanced</h3>
                <div className="prose prose-slate max-w-none">
                  <div className="bg-slate-50 p-4 rounded-lg text-slate-700 whitespace-pre-wrap font-mono text-sm leading-relaxed max-h-96 overflow-y-auto">
                    {enhancedPrompt}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;