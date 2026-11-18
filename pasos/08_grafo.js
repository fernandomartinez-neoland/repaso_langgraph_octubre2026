import {
  StateGraph,
  START,
  END,
  MessagesValue,
  StateSchema,
  MemorySaver,
} from "@langchain/langgraph";
// ... (resto de imports, MiEstado, sumar, ia, nodoIA, nodoHerramientas, decidirCamino)
import { HumanMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import "dotenv/config";

const MiEstado = new StateSchema({ messages: MessagesValue }); // ← del paso 6

// ... nodos del paso 7 ...

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

async function nodoIA(estado) {
  return { messages: [await ia.invoke(estado.messages)] };
}

async function nodoHerramientas(estado) {
  const ultimoMensaje = estado.messages[estado.messages.length - 1];
  const resultados = [];
  for (const peticion of ultimoMensaje.tool_calls || []) {
    if (peticion.name === "sumar")
      resultados.push(await sumar.invoke(peticion));
  }
  return { messages: resultados };
}

function decidirCamino(estado) {
  const ultimoMensaje = estado.messages[estado.messages.length - 1];
  if (ultimoMensaje.tool_calls && ultimoMensaje.tool_calls.length > 0) {
    console.log("llamando a sumar");
    return "herramientas";
  }
  console.log("terminando");
  return END;
}

const memoria = new MemorySaver();
const grafo = new StateGraph(MiEstado)
  .addNode("ia", nodoIA)
  .addNode("herramientas", nodoHerramientas)
  .addEdge(START, "ia")
  .addConditionalEdges("ia", decidirCamino, ["herramientas", END])
  .addEdge("herramientas", "ia")
  .compile({ checkpointer: memoria });

const config = { configurable: { thread_id: "clase_1" } };
let resultado = await grafo.invoke(
  { messages: [new HumanMessage("Hola, me llamo Ana")] },
  config,
);
console.log("IA:", resultado.messages[resultado.messages.length - 1].content);

resultado = await grafo.invoke(
  { messages: [new HumanMessage("¿Cómo me llamo?")] },
  config,
);
console.log("IA:", resultado.messages[resultado.messages.length - 1].content);

console.log("Mensajes en la carpeta:", resultado.messages.length);

console.log(
  "Tipos de mensaje:",
  resultado.messages.map((m) => m.constructor.name).join(" | "),
);
console.log(
  "Respuesta:",
  resultado.messages[resultado.messages.length - 1].content,
);
