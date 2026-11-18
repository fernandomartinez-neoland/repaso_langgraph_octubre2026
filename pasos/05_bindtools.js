import { ChatGroq } from "@langchain/groq";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import "dotenv/config";

const sumar = tool(
  ({ a, b }) => {
    console.log(`[⚙️ Calculando ${a} + ${b}...]`);
    return String(a + b);
  },
  {
    name: "sumar",
    description: "Suma dos números",
    schema: z.object({ a: z.number(), b: z.number() }),
  },
);

const ia = new ChatGroq({
  model: "openai/gpt-oss-20b",
  temperature: 0,
}).bindTools([sumar]);

const r1 = await ia.invoke("¿Cuánto es 2 + 3?");
console.log("Pregunta con suma →", {
  content: r1.content,
  tool_calls: r1.tool_calls,
});

const r2 = await ia.invoke("Dime un color");
console.log("Pregunta sin suma →", {
  content: r2.content,
  tool_calls: r2.tool_calls,
});
