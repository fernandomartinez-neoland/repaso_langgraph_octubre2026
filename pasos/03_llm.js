import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";
import "dotenv/config";

const ia = new ChatGroq({ model: "openai/gpt-oss-20b", temperature: 0 });

const respuesta = await ia.invoke([new HumanMessage("Hola, ¿quién eres? Responde en una frase.")]);

console.log(respuesta.constructor.name); // ¿Qué tipo de objeto es?
console.log(respuesta.content);          // El texto