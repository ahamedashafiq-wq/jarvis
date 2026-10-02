import { AgentStep } from '../../types';
import { toolRegistry } from './toolRegistry';

export interface VerificationResult {
  verified: boolean;
  detail: string;
}

export class AgentVerifier {
  /**
   * Run independent database/storage verification on a completed step
   */
  public static async verifyStepResult(
    step: AgentStep,
    resultData: any,
    userId: string
  ): Promise<VerificationResult> {
    const tool = toolRegistry.getTool(step.tool);
    if (!tool) {
      return { verified: false, detail: `Cannot verify unknown tool "${step.tool}".` };
    }

    try {
      const check = await tool.verify(step.parameters || {}, resultData, userId);
      return check;
    } catch (err: any) {
      return {
        verified: false,
        detail: `Verification exception: ${err?.message || 'Database validation anomaly'}`,
      };
    }
  }
}
