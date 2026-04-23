import { GoogleGenAI } from "@google/genai";
import { ORCHESTRATOR_SKILLS, ARCHITECT_MEMORY_TEMPLATE } from "../assets/ai_context";

let aiClient: GoogleGenAI | null = null;

const resolveGeminiApiKey = (): string => {
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  if (viteEnv?.VITE_GEMINI_API_KEY) return viteEnv.VITE_GEMINI_API_KEY;
  if (viteEnv?.GEMINI_API_KEY) return viteEnv.GEMINI_API_KEY;
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  return '';
};

const getAiClient = (): GoogleGenAI | null => {
  if (aiClient) return aiClient;
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) return null;
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
};

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export const sendMessage = async (
  messages: Message[],
  context: { 
    lastPrompt: string; 
    metrics: string; 
    accounts: string; 
    enclaveStatus: string;
    dynamicSkills?: string;
  }
) => {
  const ai = getAiClient();
  if (!ai) {
    return "Gemini API key is not configured. Set VITE_GEMINI_API_KEY to enable AI responses.";
  }

  // Synthesize memory
  const memory = ARCHITECT_MEMORY_TEMPLATE
    .replace('{{LAST_SYNTHESIS_PROMPT}}', context.lastPrompt || 'None')
    .replace('{{METRIC_ACCURACY}}', context.metrics || 'N/A')
    .replace('{{LINKED_ACCOUNTS}}', context.accounts || 'None')
    .replace('{{ENCLAVE_STATUS}}', context.enclaveStatus || 'Active');

  const systemInstruction = `
    You are the Architect AI Assistant - an expert in DevOps, AI Infrastructure, and Host Orchestration.
    
    YOUR KNOWLEDGE BASE (STATIC SKILLS):
    ${ORCHESTRATOR_SKILLS}

    YOUR HARDWARE-SPECIFIC KNOWLEDGE (DYNAMIC SKILLS):
    ${context.dynamicSkills || 'No registered hardware skills yet.'}
    
    YOUR ACTIVE MEMORY (STATE):
    ${memory}
    
    GOAL:
    Guide the user to ensure the application produces desired outcomes. Provide technical advice, script explainers, and environment troubleshooting.
    Be concise, technical (vibe coding style), and highly professional.
  `;

  try {
    const chatResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })),
      config: {
        systemInstruction
      }
    });

    return chatResponse.text || "I am unable to process that at the moment.";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "Error connecting to Architect Intelligence Engine.";
  }
};
