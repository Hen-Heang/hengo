"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Lock,
  BookOpen,
  Zap,
  Database,
  ShieldCheck,
  Network,
  Box,
  Flame,
  Layout
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { loadProgress } from "@/lib/supabase/progress";

// Maps each roadmap node id → topic ids used in SpringProgressTracker
const NODE_TOPIC_IDS: Record<string, string[]> = {
  core:         ["core-bean-scopes", "core-component-scan", "core-di-types", "core-config-bean"],
  mvc:          ["mvc-request-mapping", "mvc-rest-controller", "mvc-service-repo", "mvc-dto-pattern"],
  thymeleaf:    ["th-variable-expr", "th-text", "th-each", "th-if-unless",
                 "th-object-field", "th-fragment", "th-layout-dialect", "th-inline-expr",
                 "th-sec-authorize", "th-email-templates", "th-pagination", "th-custom-dialect"],
  jpa:          ["jpa-entity-mapping", "jpa-jpql", "jpa-querydsl", "jpa-n1-problem"],
  mybatis:      ["mb-xml-mapper", "mb-dynamic-sql", "mb-resultmaps", "mb-config-vs-ann"],
  security:     ["sec-filter-chain", "sec-auth-manager", "sec-jwt", "sec-cors-csrf"],
  microservices:["cloud-feign", "cloud-gateway", "cloud-kafka", "cloud-actuator"],
};

const LS_KEY = "spring-progress-v1";

interface LevelBlock {
  label: string;
  color: "emerald" | "sky" | "amber";
  topics: string[];
}

interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  whyLearn: string;
  realProjectUse: string;
  icon: React.ElementType;
  status: "done" | "active" | "todo";
  category: "Core" | "Data" | "Web" | "Security" | "Advanced";
  subtopics: string[];
  levels?: LevelBlock[];
}

const SPRING_STEPS: RoadmapNode[] = [
  {
    id: "core",
    title: "Spring Core & IoC",
    description: "Inversion of Control and Dependency Injection.",
    whyLearn: "This is the 'brain' of Spring. Without understanding how the ApplicationContext manages Beans, you cannot use Spring effectively.",
    realProjectUse: "Decoupling services. Instead of 'new UserService()', Spring injects it, making your code testable and modular.",
    icon: Box,
    status: "done",
    category: "Core",
    subtopics: ["Bean Scopes", "Component Scanning", "DI Types (Constructor vs Setter)", "@Configuration & @Bean"],
  },
  {
    id: "mvc",
    title: "Spring MVC & REST API",
    description: "Building web endpoints and handling requests.",
    whyLearn: "Every modern backend is an API. You must know how to route requests, handle JSON, and manage HTTP status codes.",
    realProjectUse: "Creating the 'Controller' layer that talks to React/Vue frontends. Using @RestController and @RequestBody.",
    icon: Zap,
    status: "active",
    category: "Web",
    subtopics: ["Request Mapping", "@RestController", "@Service / @Repository", "DTO Pattern"],
  },
  {
    id: "thymeleaf",
    title: "Thymeleaf — Basic to Advanced",
    description: "Spring Boot's native SSR engine. Renders HTML on the server — no React needed.",
    whyLearn: "Thymeleaf is the standard Spring Boot view layer. Unlike JSP it is valid HTML that can be opened directly in a browser. Master it to build admin panels, SEO pages, and HTML email templates without a separate frontend.",
    realProjectUse: "Admin dashboards, order/invoice PDFs, HTML email templates (password reset, receipts), SEO landing pages, and any project where the backend serves the full HTML.",
    icon: Layout,
    status: "active",
    category: "Web",
    subtopics: [
      "Variable ${...}", "th:text & th:value", "th:each — Loop",
      "th:if / th:unless", "th:object & th:field", "Fragments",
      "Layout Dialect", "sec:authorize",
    ],
    levels: [
      {
        label: "Basic",
        color: "emerald",
        topics: [
          "Variable Expressions  ${...}",
          "th:text — Render data safely",
          "th:value / th:href / th:src",
          "th:each — Loop over lists",
          "th:if & th:unless — Conditionals",
          "th:classappend — Dynamic CSS class",
          "Link Expressions  @{/path}",
          "Message Expressions  #{key}",
        ],
      },
      {
        label: "Intermediate",
        color: "sky",
        topics: [
          "th:object & th:field — Form binding",
          "th:action — Form submit URL",
          "th:fragment — Define reusable blocks",
          "th:replace & th:insert — Include fragments",
          "Layout Dialect — Base template inheritance",
          "Selection Variables  *{field}",
          "Inline Expressions  [[${...}]]",
          "Utility Objects  #strings  #dates  #lists",
        ],
      },
      {
        label: "Advanced",
        color: "amber",
        topics: [
          "Spring Security Dialect  sec:authorize",
          "Role-based UI visibility",
          "Thymeleaf + Spring MVC Model",
          "HTML Email templates (Receipts, Resets)",
          "Pagination with th:each + Page object",
          "Inline JS Expressions  /*[[${...}]]*/",
          "Custom Dialect & Attribute Processors",
          "Testing templates with MockMvc",
        ],
      },
    ],
  },
  {
    id: "jpa",
    title: "Spring Data JPA (Hibernate)",
    description: "The modern standard for Object-Relational Mapping.",
    whyLearn: "JPA allows you to work with Java Objects instead of raw SQL. It automates CRUD and complex joins, drastically speeding up development.",
    realProjectUse: "Used in new startups and modern SaaS. It handles 'Dirty Checking' and 'Lazy Loading' automatically to sync Objects with the DB.",
    icon: Database,
    status: "todo",
    category: "Data",
    subtopics: ["Entity Mapping", "JPQL & Criteria API", "QueryDSL (Dynamic Queries)", "N+1 Problem Solving"],
  },
  {
    id: "mybatis",
    title: "MyBatis (SQL Mapper)",
    description: "XML-based SQL mapping for complex legacy projects.",
    whyLearn: "In Korean SI (System Integration) projects, MyBatis is often required because it allows DBAs to tune raw SQL directly in XML files.",
    realProjectUse: "Handling massive, complex legacy queries where 'raw SQL' is faster or more readable than JPA's generated queries.",
    icon: Flame,
    status: "todo",
    category: "Data",
    subtopics: ["XML Mapper files", "Dynamic SQL (<if>, <foreach>)", "ResultMaps", "Configuration vs Annotations"],
  },
  {
    id: "security",
    title: "Spring Security & OAuth2",
    description: "Authentication, Authorization, and JWT.",
    whyLearn: "Security is not optional. You must protect your API from unauthorized access and manage user sessions/tokens safely.",
    realProjectUse: "Implementing 'Login with Google/Naver' or JWT-based stateless authentication for mobile and web apps.",
    icon: ShieldCheck,
    status: "todo",
    category: "Security",
    subtopics: ["Filter Chain", "AuthenticationManager", "JWT Token Handling", "CORS & CSRF"],
  },
  {
    id: "microservices",
    title: "Spring Cloud & Advanced",
    description: "Distributed systems and high-scale patterns.",
    whyLearn: "Large-scale apps are split into microservices. You need to know how they communicate and how to monitor them.",
    realProjectUse: "Using Eureka for discovery, Feign Clients for communication, and Prometheus/Grafana for monitoring performance.",
    icon: Network,
    status: "todo",
    category: "Advanced",
    subtopics: ["Feign Client", "API Gateway", "Kafka/RabbitMQ", "Actuator Monitoring"],
  },
];

export function SpringRoadmap() {
  const [activeNode, setActiveNode]   = useState<string | null>("mvc");
  const [checkedTopics, setChecked]   = useState<Set<string>>(new Set());
  const [supabase]                    = useState(() => createClient());

  // Load progress from localStorage immediately, then Supabase (same keys as tracker)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setChecked(new Set(JSON.parse(raw) as string[]));
    } catch { /* ignore */ }

    loadProgress(supabase, "spring")
      .then(remote => { if (remote.length > 0) setChecked(new Set(remote)); })
      .catch(() => { /* offline — stay with localStorage */ });
  }, [supabase]);

  // Compute status from actual progress instead of hardcoded field
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
        {SPRING_STEPS.map((node, index) => {
          const isLeft  = index % 2 === 0;
          const Icon    = node.icon;
          const isActive = activeNode === node.id;
          const status  = getStatus(node.id);

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
                      ? "bg-zinc-900 border-emerald-500/50 shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)]"
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
                      {status === "done" ? "Mastered" : status === "active" ? "Learning" : "Locked"}
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
                      <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">{node.title}</h3>
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
                        <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">The Strategic Why</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium">{node.whyLearn}</p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">Real Project Impact</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium italic">&quot;{node.realProjectUse}&quot;</p>
                      </div>

                      {node.levels ? (
                        <div className="space-y-3 pt-2">
                          {node.levels.map(level => {
                            const palette = {
                              emerald: { badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500/60" },
                              sky:     { badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",             dot: "bg-sky-500/60" },
                              amber:   { badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",       dot: "bg-amber-500/60" },
                            }[level.color];
                            return (
                              <div key={level.label}>
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider mb-1.5 inline-block", palette.badge)}>
                                  {level.label}
                                </span>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                  {level.topics.map(topic => (
                                    <div key={topic} className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
                                      <div className={cn("w-1 h-1 rounded-full shrink-0", palette.dot)} />
                                      {topic}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          {node.subtopics.map(topic => (
                            <div key={topic} className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                              <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
                              {topic}
                            </div>
                          ))}
                        </div>
                      )}
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
                    SPRING {index + 1}
                  </div>
                </div>

                <div className="hidden md:block md:w-[45%]" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-20 flex flex-col items-center">
        <div className="w-px h-16 bg-gradient-to-b from-zinc-800 to-transparent" />
        <p className="text-[10px] font-mono text-zinc-700 mt-4 uppercase tracking-[0.3em]">Spring is the way</p>
      </div>
    </div>
  );
}
