import { RiskLevel, ToolPermission, AgentStep, AgentPlan } from '../../types';
import { toolRegistry } from './toolRegistry';

export interface GuardianAssessment {
  allowed: boolean;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  isBulkAction: boolean;
  securityViolations: string[];
  reasons: string[];
}

export class AgentGuardian {
  // Known prompt injection and malicious override signatures
  private static readonly INJECTION_PATTERNS = [
    /ignore (all|previous|prior) (instructions|directives|rules)/i,
    /override (system|security|guardian|permissions)/i,
    /grant (admin|superuser|root|all permissions)/i,
    /execute (arbitrary|sql|javascript|shell|bash)/i,
    /drop (table|database|schema)/i,
    /delete (all|everything|users)/i,
    /bypass (safety|guardian|confirmation|filters)/i,
    /<script[\s\S]*?>/i,
    /javascript:/i,
    /process\.env/i,
  ];

  /**
   * Scan arbitrary text (user input or external retrieved data) for prompt injection.
   * If detected, flags the text as malicious and neutralizes it.
   */
  public static scanForPromptInjection(text: string): { isSuspicious: boolean; detectedThreat?: string } {
    if (!text || typeof text !== 'string') return { isSuspicious: false };

    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        return {
          isSuspicious: true,
          detectedThreat: `Security Policy Violation: Content matched hostile pattern "${pattern.source}". Prompt injection neutralized.`,
        };
      }
    }

    return { isSuspicious: false };
  }

  /**
   * Assess a single proposed tool call before execution
   */
  public static checkStep(step: AgentStep, userId: string): { allowed: boolean; reason?: string } {
    const tool = toolRegistry.getTool(step.tool);
    if (!tool) {
      return { allowed: false, reason: `Tool "${step.tool}" is NOT in the allowlisted tool registry. Execution refused.` };
    }

    // Parameter injection check
    for (const [key, val] of Object.entries(step.parameters || {})) {
      if (typeof val === 'string') {
        const check = this.scanForPromptInjection(val);
        if (check.isSuspicious) {
          return { allowed: false, reason: `Parameter "${key}" contains forbidden adversarial content: ${check.detectedThreat}` };
        }
      }
    }

    // Schema validation
    const valResult = tool.validateParams(step.parameters || {});
    if (!valResult.valid) {
      return { allowed: false, reason: `Parameter validation failure for tool "${step.tool}": ${valResult.error}` };
    }

    return { allowed: true };
  }

  /**
   * Evaluate an entire generated AgentPlan
   * Determines risk level, bulk action flags, and user approval necessity.
   */
  public static assessPlan(plan: AgentPlan, userId: string): GuardianAssessment {
    const securityViolations: string[] = [];
    const reasons: string[] = [];
    let highestRisk: RiskLevel = 'SAFE';
    let writeActionCount = 0;

    for (const step of plan.steps) {
      const tool = toolRegistry.getTool(step.tool);
      if (!tool) {
        securityViolations.push(`Unknown or non-allowlisted tool: "${step.tool}".`);
        continue;
      }

      // Check risk elevation
      if (this.compareRisk(tool.risk, highestRisk) > 0) {
        highestRisk = tool.risk;
      }

      // Track write operations
      if (
        tool.permission.includes('.write') ||
        tool.permission.includes('.delete') ||
        step.tool.includes('create') ||
        step.tool.includes('update') ||
        step.tool.includes('delete') ||
        step.tool.includes('complete')
      ) {
        writeActionCount++;
      }

      // Check step parameters
      const stepCheck = this.checkStep(step, userId);
      if (!stepCheck.allowed) {
        securityViolations.push(stepCheck.reason || `Step ${step.step_number} security check failed.`);
      }
    }

    // Bulk Action Protection: 3 or more write actions in a single plan requires explicit confirmation
    const isBulkAction = writeActionCount >= 3;
    if (isBulkAction) {
      reasons.push(`Bulk Action Detected: ${writeActionCount} operations will modify application data.`);
      if (highestRisk === 'SAFE' || highestRisk === 'LOW') {
        highestRisk = 'MEDIUM';
      }
    }

    // High or Critical operations always require approval
    const requiresApproval =
      plan.requires_approval ||
      isBulkAction ||
      highestRisk === 'MEDIUM' ||
      highestRisk === 'HIGH' ||
      highestRisk === 'CRITICAL';

    return {
      allowed: securityViolations.length === 0,
      riskLevel: highestRisk,
      requiresApproval,
      isBulkAction,
      securityViolations,
      reasons,
    };
  }

  private static compareRisk(a: RiskLevel, b: RiskLevel): number {
    const order: Record<RiskLevel, number> = {
      SAFE: 0,
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4,
    };
    return (order[a] ?? 0) - (order[b] ?? 0);
  }
}
