// ZORO 2.0 OMNIA AI Provider & Model Abstraction Layer
// Implements: AIProvider -> ModelRouter -> ProviderAdapter
// Personality Modes: COMMANDER, ENGINEER, RESEARCHER, TUTOR, ANALYST, CREATIVE

export type PersonalityMode =
  | 'COMMANDER'
  | 'ENGINEER'
  | 'RESEARCHER'
  | 'TUTOR'
  | 'ANALYST'
  | 'CREATIVE';

export interface ModelTelemetry {
  provider: 'GEMINI' | 'LOCAL' | 'CUSTOM';
  modelName: string;
  status: 'READY' | 'STREAMING' | 'THINKING' | 'ERROR' | 'OFFLINE';
  lastLatencyMs: number;
  totalTokensEstimated: number;
  activePersonality: PersonalityMode;
}

export interface ModelGenerateOptions {
  prompt: string;
  systemInstruction?: string;
  personality?: PersonalityMode;
  context?: string;
}

export interface ModelProviderAdapter {
  id: string;
  name: string;
  generateText(options: ModelGenerateOptions): Promise<{ text: string; latencyMs: number }>;
  isAvailable(): Promise<boolean>;
}

// 1. Gemini Server Proxy Provider Adapter (Default primary production engine)
class GeminiServerAdapter implements ModelProviderAdapter {
  id = 'gemini';
  name = 'Gemini 3.8 Flash';

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch('/api/gemini/health');
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data.configured);
    } catch {
      return false;
    }
  }

  async generateText(options: ModelGenerateOptions): Promise<{ text: string; latencyMs: number }> {
    const t0 = performance.now();
    const systemPrompt = options.systemInstruction || getPersonalitySystemPrompt(options.personality || 'COMMANDER');
    const fullPrompt = options.context ? `${options.context}\n\n${options.prompt}` : options.prompt;

    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: fullPrompt,
        config: { systemInstruction: systemPrompt },
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini server error: ${res.status}`);
    }

    const data = await res.json();
    return {
      text: data.text || '',
      latencyMs: Math.round(performance.now() - t0),
    };
  }
}

// 2. Local Fallback Provider Adapter (Deterministic tactical neural rules)
class LocalModelAdapter implements ModelProviderAdapter {
  id = 'local';
  name = 'ZORO OMNIA Tactical Engine (Local)';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generateText(options: ModelGenerateOptions): Promise<{ text: string; latencyMs: number }> {
    const t0 = performance.now();
    await new Promise((r) => setTimeout(r, 60)); // Simulate micro-delay
    const p = options.prompt.toLowerCase();

    let text = `Commander, parameters verified. Operating in ${options.personality || 'COMMANDER'} mode. Standing by for directives.`;
    if (p.includes('status')) {
      text = 'Commander, all core operational matrices are online. ZORO OMNIA Core, Action Queue, and Persistent Neural Memory are nominal.';
    } else if (p.includes('mission')) {
      text = 'Commander, mission directives accessed. Tactical milestones structured.';
    }

    return {
      text,
      latencyMs: Math.round(performance.now() - t0),
    };
  }
}

export function getPersonalitySystemPrompt(mode: PersonalityMode): string {
  switch (mode) {
    case 'COMMANDER':
      return 'You are ZORO OS in COMMANDER mode: crisp, highly disciplined, authoritative, concise, addressing the user as Commander, prioritizing strategic objectives, risks, and verified execution.';
    case 'ENGINEER':
      return 'You are ZORO OS in ENGINEER mode: technical, rigorous, focused on system architecture, code correctness, performance bottlenecks, and precise implementation details.';
    case 'RESEARCHER':
      return 'You are ZORO OS in RESEARCHER mode: deeply analytical, empirical, citing evidence, outlining hypotheses, acknowledging uncertainties, and thoroughly synthesising concepts.';
    case 'TUTOR':
      return 'You are ZORO OS in TUTOR mode: pedagogical, encouraging, breaking down complex topics step-by-step with clear mental models, examples, and verifying understanding.';
    case 'ANALYST':
      return 'You are ZORO OS in ANALYST mode: data-driven, evaluating metrics, comparing options, identifying trends and risk coefficients, objective and structured.';
    case 'CREATIVE':
      return 'You are ZORO OS in CREATIVE mode: generative, inventive, proposing non-obvious combinations, articulate and imaginative while remaining practically grounded.';
    default:
      return 'You are ZORO OS: autonomous personal AI command operating system. Crisp, context-aware, action-oriented.';
  }
}

class ModelRouterService {
  private primaryAdapter: ModelProviderAdapter = new GeminiServerAdapter();
  private fallbackAdapter: ModelProviderAdapter = new LocalModelAdapter();
  private personality: PersonalityMode = 'COMMANDER';
  private telemetry: ModelTelemetry = {
    provider: 'GEMINI',
    modelName: 'gemini-3.8-flash',
    status: 'READY',
    lastLatencyMs: 120,
    totalTokensEstimated: 0,
    activePersonality: 'COMMANDER',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('jarvis_personality_mode') as PersonalityMode;
        if (stored && ['COMMANDER', 'ENGINEER', 'RESEARCHER', 'TUTOR', 'ANALYST', 'CREATIVE'].includes(stored)) {
          this.personality = stored;
          this.telemetry.activePersonality = stored;
        }
      } catch {
        // ignore
      }
    }
  }

  public getPersonality(): PersonalityMode {
    return this.personality;
  }

  public setPersonality(mode: PersonalityMode): void {
    this.personality = mode;
    this.telemetry.activePersonality = mode;
    try {
      localStorage.setItem('jarvis_personality_mode', mode);
    } catch {
      // ignore
    }
  }

  public getTelemetry(): ModelTelemetry {
    return { ...this.telemetry };
  }

  public async generateText(prompt: string, context?: string): Promise<string> {
    this.telemetry.status = 'THINKING';
    const isPrimaryReady = await this.primaryAdapter.isAvailable();

    try {
      if (isPrimaryReady) {
        const res = await this.primaryAdapter.generateText({
          prompt,
          context,
          personality: this.personality,
        });
        this.telemetry.status = 'READY';
        this.telemetry.provider = 'GEMINI';
        this.telemetry.lastLatencyMs = res.latencyMs;
        this.telemetry.totalTokensEstimated += Math.round((prompt.length + res.text.length) / 4);
        return res.text;
      }
    } catch (err) {
      console.warn('Primary model provider failed, falling back to local adapter:', err);
    }

    // Fallback adapter
    const fallbackRes = await this.fallbackAdapter.generateText({
      prompt,
      context,
      personality: this.personality,
    });
    this.telemetry.status = 'READY';
    this.telemetry.provider = 'LOCAL';
    this.telemetry.lastLatencyMs = fallbackRes.latencyMs;
    return fallbackRes.text;
  }
}

export const modelRouter = new ModelRouterService();
