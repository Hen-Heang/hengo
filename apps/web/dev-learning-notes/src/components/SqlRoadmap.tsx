"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Lock,
  BookOpen,
  Database,
  TableProperties,
  GitMerge,
  ShieldCheck,
  Activity,
  FileCode,
  Layers,
  BarChart2,
  Zap,
  Network,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { loadProgress } from "@/lib/supabase/progress";

// Maps each roadmap node id -> topic ids used in SqlProgressTracker
const NODE_TOPIC_IDS: Record<string, string[]> = {
  basics:       ["sql-select-syntax", "sql-data-types", "sql-where-operators", "sql-null-handling", "sql-order-limit"],
  dml:          ["dml-insert", "dml-update", "dml-delete", "dml-merge"],
  joins:        ["join-inner", "join-left", "join-self", "join-union"],
  aggregation:  ["agg-functions", "agg-group-by", "agg-having", "agg-distinct"],
  subqueries:   ["sub-scalar", "sub-table", "sub-exists", "sub-cte", "sub-recursive"],
  window:       ["win-row-number", "win-rank", "win-lag-lead", "win-sum-running"],
  design:       ["design-pk-fk", "design-normalization", "design-relationships", "design-constraints"],
  indexing:     ["idx-btree", "idx-composite", "idx-explain", "idx-covering"],
  transactions: ["tx-acid", "tx-isolation", "tx-deadlock", "tx-savepoint"],
  mybatis:      ["mb-dynamic-if", "mb-foreach", "mb-pagination", "mb-resultmap"],
};

const LS_KEY = "sql-progress-v1";

interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  whyLearn: string;
  realProjectUse: string;
  icon: React.ElementType;
  category: "Basics" | "Intermediate" | "Advanced" | "Design" | "Performance" | "Ecosystem";
  subtopics: string[];
}

const SQL_STEPS: RoadmapNode[] = [
  {
    id: "basics",
    title: "SQL Fundamentals",
    description: "SELECT, WHERE, ORDER BY, data types, and NULL handling.",
    whyLearn: "This is the alphabet of data. Every query you write starts with a correct SELECT structure. Without this, nothing else works.",
    realProjectUse: "Every search, filter, and list endpoint in your Spring Boot app runs a WHERE clause. Get this right first.",
    icon: Database,
    category: "Basics",
    subtopics: ["SELECT structure & aliases", "Data types (VARCHAR, INT, DATE)", "WHERE: AND/OR/IN/BETWEEN/LIKE", "NULL: IS NULL, COALESCE, NVL", "ORDER BY, LIMIT/OFFSET, FETCH FIRST"],
  },
  {
    id: "dml",
    title: "DML — CRUD Operations",
    description: "INSERT, UPDATE, DELETE, TRUNCATE, and MERGE (upsert).",
    whyLearn: "You write DML every day. MERGE is especially critical in MyBatis batch jobs where you need to upsert large datasets efficiently.",
    realProjectUse: "Batch import jobs using MERGE. Soft-delete patterns with UPDATE status. Bulk INSERT with MyBatis foreach.",
    icon: FileCode,
    category: "Basics",
    subtopics: ["INSERT INTO & bulk INSERT", "UPDATE ... SET ... WHERE", "DELETE vs TRUNCATE", "MERGE — Oracle upsert pattern", "MySQL ON DUPLICATE KEY UPDATE"],
  },
  {
    id: "joins",
    title: "Joins & Set Operations",
    description: "INNER, LEFT, RIGHT, self-JOIN, UNION, INTERSECT.",
    whyLearn: "Real data is spread across multiple tables. You must master JOINs to reconstruct it and SET operations to combine result sets.",
    realProjectUse: "Fetching an order with its customer, items, and product names in a single MyBatis query with ResultMap.",
    icon: GitMerge,
    category: "Intermediate",
    subtopics: ["INNER JOIN — only matching rows", "LEFT JOIN — keep all left rows", "Self JOIN for org charts", "UNION vs UNION ALL", "INTERSECT"],
  },
  {
    id: "aggregation",
    title: "Aggregations & GROUP BY",
    description: "COUNT, SUM, AVG, GROUP BY, HAVING, ROLLUP.",
    whyLearn: "Reports and dashboards live and die by GROUP BY. HAVING is the most commonly misunderstood clause — learn when to use it vs WHERE.",
    realProjectUse: "Monthly sales reports, user activity summaries, inventory counts grouped by warehouse and category.",
    icon: BarChart2,
    category: "Intermediate",
    subtopics: ["COUNT / SUM / AVG / MIN / MAX", "GROUP BY basics", "HAVING vs WHERE", "COUNT(DISTINCT)", "ROLLUP for subtotals"],
  },
  {
    id: "subqueries",
    title: "Subqueries & CTEs",
    description: "Scalar, table, correlated subqueries, EXISTS vs IN, WITH clause, recursive CTE.",
    whyLearn: "Complex business logic requires multi-step queries. CTEs make your SQL readable. Recursive CTEs handle tree structures that nested queries cannot.",
    realProjectUse: "Hierarchical category trees, recursive org charts, multi-step filtering logic in complex MyBatis mappers.",
    icon: Layers,
    category: "Intermediate",
    subtopics: ["Scalar subquery in SELECT", "Table subquery in FROM", "EXISTS vs IN (performance)", "WITH clause (CTE)", "Recursive CTE for tree data"],
  },
  {
    id: "window",
    title: "Window Functions",
    description: "ROW_NUMBER, RANK, DENSE_RANK, LAG/LEAD, running SUM.",
    whyLearn: "Window functions replace dozens of self-joins and correlated subqueries. They are the most powerful SQL feature for analytics and ranking.",
    realProjectUse: "Top-N products per category, month-over-month revenue comparison, running totals for financial reports.",
    icon: Activity,
    category: "Advanced",
    subtopics: ["ROW_NUMBER() OVER (PARTITION BY)", "RANK() vs DENSE_RANK()", "LAG / LEAD for row comparison", "Running totals — SUM() OVER", "Percent of total"],
  },
  {
    id: "design",
    title: "Database Design",
    description: "PK/FK, 1:N and N:M relationships, 1NF/2NF/3NF, constraints.",
    whyLearn: "Bad schema design causes data corruption, redundancy, and slow queries. Understanding normal forms is the foundation of correct modeling.",
    realProjectUse: "Designing the users, orders, products, and categories tables that your entire Spring Boot application depends on.",
    icon: TableProperties,
    category: "Design",
    subtopics: ["Primary Key & Foreign Key", "1:N and N:M (junction table)", "1NF / 2NF / 3NF normalization", "NOT NULL / UNIQUE / CHECK", "ON DELETE CASCADE vs SET NULL"],
  },
  {
    id: "indexing",
    title: "Indexing & Query Optimization",
    description: "B-Tree, composite index, covering index, EXPLAIN, slow query patterns.",
    whyLearn: "As your database grows to millions of rows, unindexed queries will time out. One well-placed index can cut a 10-second query to 10ms.",
    realProjectUse: "Using EXPLAIN to find why a Spring Boot service endpoint is slow. Adding composite indexes to fix MyBatis pagination queries.",
    icon: Zap,
    category: "Performance",
    subtopics: ["B-Tree index basics", "Composite index & column order", "Covering index (index-only scan)", "EXPLAIN / EXPLAIN PLAN (Oracle)", "N+1 problem prevention"],
  },
  {
    id: "transactions",
    title: "Transactions & Concurrency",
    description: "ACID, isolation levels, dirty read, deadlock, SAVEPOINT.",
    whyLearn: "You must ensure data integrity. Spring Boot's @Transactional annotation wraps your service methods in a transaction — you need to understand what that means.",
    realProjectUse: "Bank transfers, inventory deductions, order placement — any multi-step operation that must succeed or fail as a unit.",
    icon: ShieldCheck,
    category: "Advanced",
    subtopics: ["ACID properties", "Isolation levels (4 levels)", "Dirty read & phantom read", "Deadlock prevention", "SAVEPOINT & ROLLBACK TO"],
  },
  {
    id: "mybatis",
    title: "MyBatis SQL Patterns",
    description: "<if> dynamic WHERE, <foreach> IN lists, pagination, ResultMap for JOINs.",
    whyLearn: "MyBatis is the ORM for Korean SI and enterprise projects. These patterns are what you use every single day to write maintainable, dynamic SQL in XML mappers.",
    realProjectUse: "Search screens with dynamic filters, batch inserts, paginated lists, and complex JOIN queries mapped to nested Java DTOs.",
    icon: Network,
    category: "Ecosystem",
    subtopics: ["<if> dynamic WHERE clause", "<foreach> for IN lists & batch INSERT", "Pagination: MySQL LIMIT vs Oracle FETCH", "<choose><when> switch pattern", "ResultMap for nested JOIN results"],
  },
];

export function SqlRoadmap() {
  const [activeNode, setActiveNode]   = useState<string | null>("basics");
  const [checkedTopics, setChecked]   = useState<Set<string>>(new Set());
  const [supabase]                    = useState(() => createClient());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setChecked(new Set(JSON.parse(raw) as string[]));
    } catch { /* ignore */ }

    loadProgress(supabase, "sql")
      .then(remote => { if (remote.length > 0) setChecked(new Set(remote)); })
      .catch(() => { /* offline — stay with localStorage */ });
  }, [supabase]);

  function getStatus(nodeId: string): "done" | "active" | "todo" {
    const ids = NODE_TOPIC_IDS[nodeId];
    if (!ids || ids.length === 0) return "todo";
    const done = ids.filter(id => checkedTopics.has(id)).length;
    if (done === ids.length) return "done";
    if (done > 0)            return "active";
    return "todo";
  }

  return (
    <div className="relative py-12 px-4">
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-zinc-900 -translate-x-1/2 hidden md:block" />

      <div className="space-y-16 relative">
        {SQL_STEPS.map((node, index) => {
          const isLeft   = index % 2 === 0;
          const Icon     = node.icon;
          const isActive = activeNode === node.id;
          const status   = getStatus(node.id);

          return (
            <div key={node.id} className="relative">
              <div className={cn(
                "hidden md:block absolute top-1/2 w-1/2 h-px bg-zinc-800 -z-10",
                isLeft ? "left-0" : "right-0"
              )} />

              <div className={cn(
                "flex flex-col md:flex-row items-center gap-8",
                isLeft ? "md:flex-row" : "md:flex-row-reverse"
              )}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  onClick={() => setActiveNode(node.id)}
                  className={cn(
                    "w-full md:w-[45%] p-6 rounded-3xl border transition-all duration-500 cursor-pointer group relative overflow-hidden",
                    isActive
                      ? "bg-zinc-900 border-sky-500/50 shadow-[0_0_40px_-10px_rgba(14,165,233,0.2)]"
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-tighter uppercase",
                      status === "done"   ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      status === "active" ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse" :
                      "bg-zinc-800/50 text-zinc-500 border-zinc-700/50"
                    )}>
                      {status === "done" ? "Expert" : status === "active" ? "Learning" : "Locked"}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600">{node.category}</span>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl border transition-colors duration-500",
                      status === "done"   ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      status === "active" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                      "bg-zinc-900 border-zinc-800 text-zinc-600"
                    )}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white group-hover:text-sky-400 transition-colors">{node.title}</h3>
                      <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{node.description}</p>
                    </div>
                  </div>

                  <motion.div
                    initial={false}
                    animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
                    className="overflow-hidden mt-4"
                  >
                    <div className="pt-4 border-t border-zinc-800 space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">The Strategic Why</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium">{node.whyLearn}</p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Real Project Impact</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium italic">&quot;{node.realProjectUse}&quot;</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        {node.subtopics.map(topic => (
                          <div key={topic} className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                            <div className="w-1 h-1 rounded-full bg-sky-500/50" />
                            {topic}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                <div className="relative z-10">
                  <div className={cn(
                    "w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-700",
                    status === "done"   ? "bg-emerald-500 border-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]" :
                    status === "active" ? "bg-amber-500 border-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]" :
                    "bg-zinc-900 border-zinc-950"
                  )}>
                    {status === "done"   ? <CheckCircle2 size={20} className="text-white" /> :
                     status === "active" ? <BookOpen size={20} className="text-white" /> :
                     <Lock size={18} className="text-zinc-600" />}
                  </div>

                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-zinc-700 whitespace-nowrap">
                    SQL {index + 1}
                  </div>
                </div>

                <div className="hidden md:block md:w-[45%]" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-20 flex flex-col items-center">
        <div className="w-px h-16 bg-linear-to-b from-zinc-800 to-transparent" />
        <p className="text-[10px] font-mono text-zinc-700 mt-4 uppercase tracking-[0.3em]">Data is the source of truth</p>
      </div>
    </div>
  );
}
