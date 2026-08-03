import { ExternalLink, PiggyBank } from "lucide-react"

import { Card } from "@/components/ui/card"
import { MOCK_MONEY_FLOW_SUMMARY } from "@/lib/money-flow"

const HEALTH_LABEL: Record<string, string> = {
  on_track: "On track",
  attention: "Needs attention",
  over_budget: "Over budget",
}

/**
 * Feature-flagged preview of a future Money Flow integration (see
 * docs/money-flow-integration.md). Always renders mocked example data —
 * there is no live connection, token exchange, or real fetch here. Callers
 * gate visibility with lib/feature-flags.ts's isMoneyFlowIntegrationEnabled()
 * and only render this for finance-type goals.
 */
export function MoneyFlowIntegrationCard() {
  const summary = MOCK_MONEY_FLOW_SUMMARY
  const moneyFlowUrl = process.env.NEXT_PUBLIC_MONEY_FLOW_URL

  return (
    <Card className="rounded-3xl border-border bg-card/50 p-6 shadow-sm sm:rounded-3xl sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <PiggyBank size={15} strokeWidth={2.5} className="text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Money Flow</h3>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Preview — example data
        </span>
      </div>

      <p className="mt-3 text-xs font-medium leading-relaxed text-muted-foreground">
        Money Flow isn&apos;t connected yet — the numbers below are a mocked example of what a
        connected savings key result would show. Money Flow stays the source of truth for all
        financial data; Hengo would only ever display a read-only summary.
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-[11px] font-medium text-muted-foreground">Budget health</dt>
          <dd className="mt-0.5 text-sm font-bold text-foreground">
            {HEALTH_LABEL[summary.budgetHealthStatus] ?? summary.budgetHealthStatus}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-muted-foreground">Budgets within limit</dt>
          <dd className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
            {summary.budgetsWithinLimit}/{summary.totalBudgetCount}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-muted-foreground">Monthly saving rate</dt>
          <dd className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
            {Math.round(summary.monthlySavingRate * 100)}%
          </dd>
        </div>
      </dl>

      <div className="mt-5 space-y-3">
        {summary.savingsGoals.map((goal) => (
          <div key={goal.externalId}>
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>{goal.name}</span>
              <span className="tabular-nums text-foreground">{goal.progressPercentage}%</span>
            </div>
            <div
              className="mt-1 h-2 w-full overflow-hidden rounded-full bg-foreground/5"
              role="progressbar"
              aria-valuenow={goal.progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${goal.name} progress`}
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${goal.progressPercentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        {moneyFlowUrl ? (
          <a
            href={moneyFlowUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-dashed border-border px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:scale-95"
          >
            <ExternalLink size={14} strokeWidth={2.5} /> Open Money Flow
          </a>
        ) : (
          <p className="text-[11px] font-medium text-muted-foreground/70">
            Set NEXT_PUBLIC_MONEY_FLOW_URL to enable the deep link to Money Flow.
          </p>
        )}
      </div>
    </Card>
  )
}
