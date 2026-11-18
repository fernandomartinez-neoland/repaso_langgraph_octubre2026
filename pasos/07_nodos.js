import { END } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
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
    console.log("llamando a sumar")
    return "herramientas";
  }
  console.log("terminando")
  return END;
}

// ===== Prueba "a mano": hacemos nosotros de LangGraph =====
let estado = { messages: [new HumanMessage("¿Cuánto es 10 + 5?")] };

const salidaIA = await nodoIA(estado);
estado.messages.push(...salidaIA.messages);
console.log("1) La IA respondió. decidirCamino dice →", decidirCamino(estado));

const salidaHerr = await nodoHerramientas(estado);
estado.messages.push(...salidaHerr.messages);
console.log("2) La herramienta devolvió →", salidaHerr.messages[0].content);

const salidaIA2 = await nodoIA(estado);
estado.messages.push(...salidaIA2.messages);
console.log("3) decidirCamino dice →", decidirCamino(estado));
console.log(
  "4) Respuesta final →",
  estado.messages[estado.messages.length - 1].content,
);
