import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DEFAULT_MODEL = process.env.OPENAI_STUDY_MODEL || "gpt-4o-mini";

type JsonSchema = Record<string, unknown>;

export async function generateStructuredStudyOutput<T>({
  schemaName,
  schema,
  instructions,
  input,
}: {
  schemaName: string;
  schema: JsonSchema;
  instructions: string;
  input: string;
}): Promise<T> {
  const response = await openai.responses.create({
    model: DEFAULT_MODEL,
    instructions,
    input,
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        strict: true,
        schema,
      },
    },
  });

  if (!response.output_text) {
    throw new Error("The model returned an empty response.");
  }

  return JSON.parse(response.output_text) as T;
}
