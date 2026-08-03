import { NextRequest, NextResponse } from "next/server";
import { generateStructuredStudyOutput } from "@/lib/openai-study";

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

const QUIZ_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["question", "options", "answer", "explanation"],
        properties: {
          question: { type: "string" },
          options: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: { type: "string" },
          },
          answer: { type: "string" },
          explanation: { type: "string" },
        },
      },
    },
  },
};

export async function POST(req: NextRequest) {
  try {
    const { title, content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 });
    }

    const result = await generateStructuredStudyOutput<{ questions: QuizQuestion[] }>({
      schemaName: "note_quiz",
      schema: QUIZ_SCHEMA,
      instructions: `You are a quiz generator for a developer learning platform focused on Java, Spring Boot, MyBatis, SQL, JSP, jQuery, and Korean enterprise application patterns.
Generate exactly 5 multiple-choice quiz questions to test understanding of the provided note.
Each question must have exactly 4 options.
The answer must match one of the options exactly.
Write a brief explanation for why the answer is correct.`,
      input: `Generate a quiz for the note titled "${title}".

Note content:
${String(content).slice(0, 10000)}`,
    });

    return NextResponse.json({ questions: result.questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Quiz generation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
