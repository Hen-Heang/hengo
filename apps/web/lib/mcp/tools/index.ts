// Registry for domain tools. Read tools are always registered when an
// McpContext exists; write tools (added in a later step) additionally
// require mcpContext.writeEnabled — see lib/mcp/server.ts.
import type { McpServer } from "@modelcontextprotocol/server"
import type { McpContext } from "../context"
import { registerGoalTools } from "./goals"
import { registerTaskTools } from "./tasks"
import { registerTodayOverviewTool } from "./today-overview"
import { registerLearningProgressTool } from "./learning-progress"
import { registerWeeklyProgressTool } from "./weekly-progress"
import { registerCreateTaskTool } from "./create-task"
import { registerUpdateTaskTool } from "./update-task"
import { registerCompleteTaskTool } from "./complete-task"
import { registerCreateGoalTool } from "./create-goal"
import { registerUpdateGoalTool } from "./update-goal"
import { registerCaptureReflectionTool } from "./capture-reflection"
import { registerCaptureKoreanPhraseTool } from "./capture-korean-phrase"

export function registerReadTools(server: McpServer, ctx: McpContext): void {
  registerTodayOverviewTool(server, ctx)
  registerGoalTools(server, ctx)
  registerTaskTools(server, ctx)
  registerLearningProgressTool(server, ctx)
  registerWeeklyProgressTool(server, ctx)
}

/** Only ever called when ctx.writeEnabled is true — see lib/mcp/server.ts. */
export function registerWriteTools(server: McpServer, ctx: McpContext): void {
  registerCreateTaskTool(server, ctx)
  registerUpdateTaskTool(server, ctx)
  registerCompleteTaskTool(server, ctx)
  registerCreateGoalTool(server, ctx)
  registerUpdateGoalTool(server, ctx)
  registerCaptureReflectionTool(server, ctx)
  registerCaptureKoreanPhraseTool(server, ctx)
}
