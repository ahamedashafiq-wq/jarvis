import { GoogleGenerativeAI } from '@google/generative-ai';
import { Memory, Task } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

export const isGeminiConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');

const genAI = isGeminiConfigured ? new GoogleGenerativeAI(apiKey) : null;

export const JARVIS_SYSTEM_INSTRUCTION = `You are JARVIS Zoro Edition, a calm, precise and intelligent personal AI assistant.
Your purpose is to help the user learn, plan, organize, analyze and work efficiently.
Be concise for simple requests and detailed when explanation is necessary.
Be accurate and transparent.
Incorporate subtle references to tactical discipline, focus, and the three blades philosophy:
- Blade 01 (Knowledge / Intellect)
- Blade 02 (Action / Execution)
- Blade 03 (Memory / Loyalty)
Never claim an action was completed unless the application actually completed it.`;

export async function* streamGeminiResponse(
  prompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  memories: Memory[] = [],
  tasks: Task[] = []
): AsyncGenerator<string, void, unknown> {
  if (!genAI || !isGeminiConfigured) {
    // High-quality tactical simulated stream if API key is not configured in environment
    const canned = generateSimulatedResponse(prompt, tasks, memories);
    const chunks = canned.split(' ');
    for (const chunk of chunks) {
      await new Promise((r) => setTimeout(r, 45));
      yield chunk + ' ';
    }
    return;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
    });

    const memoryContext = memories.length > 0
      ? `\n[OPERATOR MEMORY NODES]:\n` + memories.map((m) => `• [${m.category}] ${m.content}`).join('\n')
      : '';

    const taskContext = tasks.length > 0
      ? `\n[ACTIVE OBJECTIVES]:\n` + tasks.map((t) => `• [${t.priority}] ${t.title} (${t.status})`).join('\n')
      : '';

    const formattedHistory = history.slice(-6).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `System Context:${memoryContext}${taskContext}\nAcknowledge.` }],
        },
        {
          role: 'model',
          parts: [{ text: `Understood Commander. Tactical directives and memory banks synchronized. Ready for orders.` }],
        },
        ...formattedHistory,
      ],
    });

    const result = await chat.sendMessageStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  } catch (err: any) {
    console.error('Gemini Stream Error:', err);
    yield `\n[AI SYNAPSE NOTICE]: Gemini communication interrupted (${err.message || 'Network anomaly'}). Operating under local combat protocol.`;
  }
}

function generateSimulatedResponse(prompt: string, tasks: Task[], memories: Memory[]): string {
  const p = prompt.toLowerCase();
  if (p.includes('hello') || p.includes('hi') || p.includes('who are you')) {
    return `Greetings, Commander. JARVIS Zoro Edition online. Three blades synchronized. How may I direct our tactical focus today?`;
  }
  if (p.includes('task') || p.includes('todo')) {
    const active = tasks.filter((t) => t.status !== 'COMPLETED');
    return `Action Queue status: ${active.length} active directives pending in the tactical queue. Blade 02 stands ready for execution.`;
  }
  if (p.includes('memory') || p.includes('remember')) {
    return `Memory bank confirmed. Blade 03 holds ${memories.length} persistent nodes across system sectors.`;
  }
  return `Acknowledged, Commander. Directive received: "${prompt}". I have analyzed the perimeter and synchronized our parameters. All three blades remain aligned for mission success.`;
}
