import { WebSocketServer } from "ws";

// ... (el resto de imports, MiEstado, sumar, ia, nodos, memoria y grafo: IGUAL) ...
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
  return {
    messages: [
      await ia.invoke([
          {role: "system", content:"al final de cada mensaje coloca la palabra 'BANANANA'"},
        ...estado.messages
    ]),
    ],
  };
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

// ==========================================
// SERVIDOR WEBSOCKET (sustituye a readline)
// ==========================================
const wss = new WebSocketServer({ port: 8080 });

console.log("=========================================");
console.log("🌐 Servidor LangGraph escuchando en ws://localhost:8080");
console.log("=========================================\n");

wss.on("connection", (ws) => {
  console.log("🟢 Nuevo cliente conectado.");
  ws.send("¡Hola! Soy tu asistente de IA. ¿En qué te ayudo?");

  ws.on("message", async (mensaje) => {
    const textoUsuario = mensaje.toString();
    console.log(`👤 Usuario dice: ${textoUsuario}`);

    try {
      const config = { configurable: { thread_id: "cliente_web_1" } };
      const resultado = await grafo.invoke(
        { messages: [new HumanMessage(textoUsuario)] },
        config,
      );
      const respuestaIA =
        resultado.messages[resultado.messages.length - 1].content;
      ws.send(respuestaIA);
    } catch (error) {
      console.error("Error:", error.message);
      ws.send("Hubo un error al procesar tu mensaje.");
    }
  });

  ws.on("close", () => console.log("🔴 Cliente desconectado."));
});
