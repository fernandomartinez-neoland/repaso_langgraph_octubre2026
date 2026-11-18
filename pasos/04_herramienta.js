import { tool } from "@langchain/core/tools";
import { z } from "zod";

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

// Prueba 1: la usamos nosotros directamente
console.log(await sumar.invoke({ a: 7, b: 3 }));

// Prueba 2: la usamos como lo hará la IA (con una "petición de herramienta")
const resultado = await sumar.invoke({
  name: "sumar",
  args: { a: 7, b: 3 },
  id: "prueba_1",
  type: "tool_call",
});
console.log(
  resultado.constructor.name,
  "→",
  resultado.content,
  "| id:",
  resultado.tool_call_id,
);
