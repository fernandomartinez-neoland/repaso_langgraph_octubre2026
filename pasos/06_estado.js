import { StateSchema, MessagesValue } from "@langchain/langgraph";

const MiEstado = new StateSchema({ messages: MessagesValue });

console.log("Estado definido con los cajones:", Object.keys(MiEstado.fields));