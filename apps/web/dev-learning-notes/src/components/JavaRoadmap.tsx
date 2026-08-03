"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Lock, Coffee, BookOpen, Code2, Layers, Cpu, Database, Globe, Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  whyLearn: string;
  springImpact: string;
  icon: React.ElementType;
  category: "Basics" | "Intermediate" | "Advanced" | "Ecosystem";
  subtopics: string[];
}

const JAVA_STEPS: RoadmapNode[] = [
  {
    id: "basics",
    title: "Java Basics & JVM",
    description: "Memory management, Syntax, and JVM Architecture.",
    whyLearn: "You must understand how Java handles memory (Stack vs Heap) and the difference between JRE/JDK to debug performance issues and configuration errors.",
    springImpact: "Critical for configuring JVM arguments in Docker containers and understanding Bean scopes (Singleton vs Prototype) which live in the Heap.",
    icon: Code2,
    category: "Basics",
    subtopics: ["JVM vs JRE vs JDK", "Memory Management", "Conditionals & Loops", "Access Modifiers"],
  },
  {
    id: "oop",
    title: "Object Oriented Programming (OOP)",
    description: "The 4 Pillars: Abstraction, Encapsulation, Inheritance, Polymorphism.",
    whyLearn: "OOP is the language of enterprise design patterns. Without it, your code becomes 'spaghetti' that is impossible to test or extend.",
    springImpact: "Spring is entirely built on Interfaces (Polymorphism). Dependency Injection (DI) relies on your ability to code to an interface, not an implementation.",
    icon: Layers,
    category: "Basics",
    subtopics: ["Interface-Driven Design", "Inheritance vs Composition", "Encapsulation", "Polymorphism"],
  },
  {
    id: "collections",
    title: "Collections Framework",
    description: "Advanced Data Structures (List, Map, Set).",
    whyLearn: "In real projects, 90% of your logic involves processing lists of data from a database. Choosing the wrong collection (e.g., ArrayList vs HashSet) can destroy performance.",
    springImpact: "Crucial for Data JPA. You must know how to handle 'Set' for One-to-Many relationships to avoid duplicates and 'Map' for caching logic.",
    icon: Database,
    category: "Intermediate",
    subtopics: ["ArrayList vs LinkedList", "HashMap Internals", "Set for Uniqueness", "Streams Integration"],
  },
  {
    id: "fp",
    title: "Functional Programming (Java 8+)",
    description: "Streams, Lambdas, and Optional.",
    whyLearn: "Modern Java uses a functional style to reduce boilerplate. It makes your code 'declarative' (what to do) rather than 'imperative' (how to do it).",
    springImpact: "Modern Spring logic (Service layer) uses Stream API for filtering/mapping DTOs. 'Optional' is the standard for handling NullPointerExceptions in Repository returns.",
    icon: Coffee,
    category: "Intermediate",
    subtopics: ["Lambda Expressions", "Stream API (map/filter)", "Optional (Null Safety)", "Method References"],
  },
  {
    id: "concurrency",
    title: "Concurrency & Virtual Threads",
    description: "Multi-threading, Async, and Java 21 Virtual Threads.",
    whyLearn: "Servers handle thousands of requests simultaneously. You need to understand threads to prevent 'deadlocks' and manage resource-heavy tasks in the background.",
    springImpact: "Spring @Async and @EventListener rely on thread pools. Java 21 Virtual Threads are now the future of high-throughput Spring Boot 3.2+ applications.",
    icon: Cpu,
    category: "Advanced",
    subtopics: ["Thread Safety", "Executors & Callables", "Virtual Threads", "CompletableFuture"],
  },
  {
    id: "spring",
    title: "The Spring Framework Core",
    description: "IoC Container, AOP, and Proxy Patterns.",
    whyLearn: "This is where all your Java knowledge converges. Understanding how Spring manages objects (Beans) is the difference between a junior and a senior dev.",
    springImpact: "The core of every enterprise app. It automates Transactions (@Transactional), Security, and Web Routing so you can focus on business logic.",
    icon: Globe,
    category: "Ecosystem",
    subtopics: ["Inversion of Control (IoC)", "Aspect-Oriented (AOP)", "Proxy Pattern", "Bean Lifecycle"],
  },
];

export function JavaRoadmap() {
  const [activeNode, setActiveNode] = useState<string | null>("basics");
  const [completedSubtopics, setCompletedSubtopics] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("java-roadmap-progress");
    if (saved) {
      setCompletedSubtopics(new Set(JSON.parse(saved)));
    }
    setIsLoaded(true);
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("java-roadmap-progress", JSON.stringify(Array.from(completedSubtopics)));
    }
  }, [completedSubtopics, isLoaded]);

  const totalSubtopics = JAVA_STEPS.reduce((acc, node) => acc + node.subtopics.length, 0);
  const completedCount = completedSubtopics.size;
  const progressPercent = Math.round((completedCount / totalSubtopics) * 100);

  const toggleSubtopic = (id: string, topic: string) => {
    const key = `${id}:${topic}`;
    const next = new Set(completedSubtopics);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setCompletedSubtopics(next);
  };

  const isNodeFullyComplete = (node: RoadmapNode) => {
    return node.subtopics.every(t => completedSubtopics.has(`${node.id}:${t}`));
  };

  const isNodeStarted = (node: RoadmapNode) => {
    return node.subtopics.some(t => completedSubtopics.has(`${node.id}:${t}`));
  };

  if (!isLoaded) return null;

  return (
    <div className="relative py-8">
      {/* --- GLOBAL PROGRESS HEADER --- */}
      <div className="mb-16 p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full -mr-20 -mt-20" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={20} />
              </div>
              Java Mastery Progress
            </h2>
            <p className="text-sm text-zinc-500 mt-1 font-medium">Tracking {totalSubtopics} key technical milestones.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Current Mastery</p>
              <p className="text-3xl font-black text-emerald-400 tracking-tighter">{progressPercent}%</p>
            </div>
            <div className="w-32 md:w-48 h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- ROADMAP PATH --- */}
      <div className="absolute left-1/2 top-48 bottom-0 w-1 bg-zinc-900 -translate-x-1/2 hidden md:block" />

      <div className="space-y-16 relative">
        {JAVA_STEPS.map((node, index) => {
          const isLeft = index % 2 === 0;
          const Icon = node.icon;
          const isActive = activeNode === node.id;
          const fullyDone = isNodeFullyComplete(node);
          const started = isNodeStarted(node);

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
                {/* Node Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  onClick={() => setActiveNode(node.id)}
                  className={cn(
                    "w-full md:w-[45%] p-6 rounded-3xl border transition-all duration-500 cursor-pointer group relative overflow-hidden",
                    isActive 
                      ? "bg-zinc-900 border-emerald-500/50 shadow-[0_0_40px_-10px_rgba(16,185,129,0.2)] scale-[1.02]" 
                      : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-tighter uppercase transition-colors duration-500",
                      fullyDone ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      started ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-zinc-800/50 text-zinc-500 border-zinc-700/50"
                    )}>
                      {fullyDone ? "Mastered" : started ? "In Progress" : "Locked"}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600">{node.category}</span>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl border transition-all duration-500",
                      fullyDone ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      isActive ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
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
                        <h4 className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">Spring Impact</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium italic">&quot;{node.springImpact}&quot;</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 pt-2">
                        {node.subtopics.map(topic => {
                          const topicKey = `${node.id}:${topic}`;
                          const isDone = completedSubtopics.has(topicKey);
                          return (
                            <button 
                              key={topic} 
                              onClick={(e) => { e.stopPropagation(); toggleSubtopic(node.id, topic); }}
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-xl border transition-all duration-300 text-left",
                                isDone 
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                  : "bg-zinc-950 border-zinc-800/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                isDone ? "bg-emerald-500 border-transparent shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "border-zinc-800"
                              )}>
                                {isDone && <Check size={12} className="text-white" strokeWidth={4} />}
                              </div>
                              <span className="text-[11px] font-bold uppercase tracking-tight">{topic}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Central Point */}
                <div className="relative z-10">
                  <div className={cn(
                    "w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-700",
                    fullyDone ? "bg-emerald-500 border-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]" :
                    started ? "bg-amber-500 border-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]" :
                    "bg-zinc-900 border-zinc-950"
                  )}>
                    {fullyDone ? <CheckCircle2 size={20} className="text-white" /> :
                     started ? <BookOpen size={20} className="text-white" /> :
                     <Lock size={18} className="text-zinc-600" />}
                  </div>
                  
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-zinc-700 whitespace-nowrap uppercase">
                    Level {index + 1}
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
        <p className="text-[10px] font-mono text-zinc-700 mt-4 uppercase tracking-[0.3em]">Mastery takes time</p>
      </div>
    </div>
  );
}
