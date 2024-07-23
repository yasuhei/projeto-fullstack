import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { mailClient } from "../lib/mail";
import {dayjs} from "../lib/dayjs";
import nodemailer from 'nodemailer';


export async function confirmTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get("/trips/:tripId/confirm",
    {
      schema: {
        params: z.object({
            tripId: z.string().uuid()
        }),
      },
    },
    async (request, reply) => {

      const  { tripId } = request.params
      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId
        }, 
        include: {
          participant: {
            where: {
              is_owner: false
            }
           }
        }
      })

      if(!trip) {
        throw new Error("Trip not found")
      }

      if(trip.is_confirmed) {
        return reply.redirect(`http://localhost:3000/trips/${tripId}`)
      }

      await prisma.trip.update({
        where: { id: tripId },
        data: { is_confirmed: true }
      })

      const formattedStartDate = dayjs(trip.starts_at).format("LL")
      const formattedEndDate = dayjs(trip.ends_at).format("LL")


      const mail = await mailClient();

      await Promise.all(
        trip.participant.map(async (participant) => {
          const confirmationLink = `http://localhost:3333/participants/${participant.id}/confirm`

          const message = await mail.sendMail({
            from: {
              name: "Equipe Planner",
              address: "oi@planner.com",
            },
            to: participant.email,
            subject: `Confirme sua viagem para ${trip.destination} em ${formattedStartDate}`,
            html: `
               <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
                    <p>Você foi convidado(a) para participar de uma viagem para <strong>${trip.destination}</strong> nas datas de <strong> ${formattedStartDate} </strong> até <strong> ${formattedEndDate} </strong>.</p> <p></p>
                    <p>Para confirmar sua presença na viagem, clique no link abaixo:</p>
                    <p></p>
                    <p>
                    <a href=${confirmationLink}>Confirmar viagem</a>
                    </p>
                    <p></p>
                    <p>Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail.</p> </div> `.trim(),
          });

          console.log(nodemailer.getTestMessageUrl(message));

        })
      )

      return reply.redirect(`http://localhost:3000/trips/${tripId}`)
    },
  );
}
