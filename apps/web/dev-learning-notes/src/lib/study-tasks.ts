export type StudyTaskStatus = "todo" | "doing" | "done";

export interface StudyTask {
  id: string;
  title: string;
  phase: string;
  category: string;
  notes: string;
  status: StudyTaskStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_STUDY_TASKS: Omit<StudyTask, "id" | "created_at" | "updated_at">[] = [
  { title: "Write 10 basic SELECT queries", phase: "Phase 0", category: "SQL", notes: "Focus on WHERE, LIKE, IN, ORDER BY", status: "todo", sort_order: 10 },
  { title: "Build one Java DTO + service pair", phase: "Phase 0", category: "Java", notes: "Create request/response classes and service interface", status: "todo", sort_order: 20 },
  { title: "Explain MVC request flow in your own words", phase: "Phase 0", category: "Spring", notes: "Browser -> Controller -> Service -> Mapper -> DB", status: "todo", sort_order: 30 },
  { title: "Implement User CRUD with Spring MVC", phase: "Phase 1", category: "Spring", notes: "List, detail, create, update, delete", status: "todo", sort_order: 40 },
  { title: "Create MyBatis mapper for users", phase: "Phase 2", category: "MyBatis", notes: "selectAll, selectById, insert, update, delete", status: "todo", sort_order: 50 },
  { title: "Practice resultMap and field-column mapping", phase: "Phase 2", category: "MyBatis", notes: "Fix one mapping mismatch intentionally", status: "todo", sort_order: 60 },
  { title: "Add dynamic search with <if> and <where>", phase: "Phase 3", category: "MyBatis", notes: "Keyword + status filter", status: "todo", sort_order: 70 },
  { title: "Add pagination query and count query", phase: "Phase 3", category: "SQL", notes: "Support page, size, total count", status: "todo", sort_order: 80 },
  { title: "Render user list page in JSP", phase: "Phase 4", category: "JSP", notes: "Use c:forEach and c:out", status: "todo", sort_order: 90 },
  { title: "Submit one form with POST + redirect", phase: "Phase 4", category: "JSP", notes: "Practice PRG pattern", status: "todo", sort_order: 100 },
  { title: "Handle create action with jQuery AJAX", phase: "Phase 5", category: "jQuery", notes: "Show success and error states", status: "todo", sort_order: 110 },
  { title: "Build board module with .do endpoints", phase: "Phase 6", category: "Korean Enterprise", notes: "list.do, detail.do, insert.do, update.do, delete.do", status: "todo", sort_order: 120 },
  { title: "Implement soft delete with use_yn", phase: "Phase 6", category: "Korean Enterprise", notes: "Hide deleted records from list", status: "todo", sort_order: 130 },
  { title: "Rewrite 3 PostgreSQL queries into Oracle style", phase: "Phase 7", category: "Oracle", notes: "ROWNUM, NVL, sequence usage", status: "todo", sort_order: 140 },
  { title: "Package app and document run steps", phase: "Phase 8", category: "Delivery", notes: "Prepare for team handoff and deployment", status: "todo", sort_order: 150 },
];
