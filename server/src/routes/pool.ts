import { FastifyInstance } from "fastify";
import ShortUniqueId from "short-unique-id";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export async function poolRoutes(app: FastifyInstance) {
  app.get('/pools/count', async () => {
    const count = await prisma.pool.count();

    return { count };
  });

  app.get('/pools', { onRequest: [authenticate] }, async req => {
    const pools = await prisma.pool.findMany({
      where: {
        participants: { some: { userId: req.user.sub } }
      },
      include: {
        _count: { select: { participants: true } },
        owner: true,
        participants: {
          select: {
            id: true,
            user: { select: { avatarUrl: true } }
          },
          take: 4
        }
      }
    });

    return { pools };
  });

  app.get('/pools/:id', { onRequest: [authenticate] }, async req => {
    const getPoolParams = z.object({
      id: z.string()
    });

    const { id } = getPoolParams.parse(req.params);

    const pool = await prisma.pool.findUnique({
      where: { id },
      include: {
        _count: { select: { participants: true } },
        owner: true,
        participants: {
          select: {
            id: true,
            user: { select: { avatarUrl: true } }
          },
          take: 4
        }
      }
    });

    return { pool };
  });

  app.post('/pools', async (req, res) => {
    const createPoolBody = z.object({
      title: z.string()
    });

    const { title } = createPoolBody.parse(req.body);

    const generate = new ShortUniqueId({ length: 6 });
    const code = String(generate()).toUpperCase();

    try {
      await req.jwtVerify();

      await prisma.pool.create({
        data: {
          title,
          code,
          ownerId: req.user.sub,

          participants: {
            create: {
              userId: req.user.sub
            }
          }
        }
      });

    } catch {
      await prisma.pool.create({
        data: {
          title,
          code
        }
      });

    }


    return res.status(201).send({ code });
  });

  app.post('/pools/join', { onRequest: [authenticate] }, async (req, res) => {
    const joinPoolBody = z.object({
      code: z.string()
    });

    const { code } = joinPoolBody.parse(req.body);

    const pool = await prisma.pool.findUnique({
      where: {
        code
      },

      include: {
        participants: {
          where: { userId: req.user.sub }
        }
      }
    });

    if (!pool) return res.status(400).send({ message: 'Pool not found!' });
    if (pool.participants.length) return res.status(400).send({ message: 'You already joined this pool.' });

    if (!pool.ownerId) {
      await prisma.pool.update({
        where: {
          id: pool.id
        },
        data: {
          ownerId: req.user.sub
        }
      });
    }

    await prisma.participant.create({
      data: {
        poolId: pool.id,
        userId: req.user.sub
      }
    });

    return res.status(201).send({ message: 'Joined the pool' });
  });

}