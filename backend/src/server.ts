import fastify from "fastify";
import { createTrip } from "./routes/create-trip";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { confirmTrip } from "./routes/confirm.trips";
import cors from '@fastify/cors'
import { confirmParticipants } from "./routes/confirm-participants";
import { createActivity } from "./routes/create-activity";
import { getActivities } from "./routes/get-activities";
import { createLink } from "./routes/create-link";
import { getLinks } from "./routes/get-links";


const app = fastify();
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(cors, {
    origin: true,
    
})

app.register(createTrip)
app.register(confirmTrip)
app.register(confirmParticipants)
app.register(createActivity)
app.register(getActivities)
app.register(createLink)
app.register(getLinks)

app.listen({port : 3333}).then(() => {
    console.log("server running")
})