
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createSurpriseBoxInputSchema,
  getSurpriseBoxesInputSchema,
  getSurpriseBoxByIdInputSchema,
  updateSurpriseBoxInputSchema,
  createUserInputSchema,
  loginInputSchema,
  createOrderInputSchema,
  getUserOrdersInputSchema,
  updateOrderStatusInputSchema
} from './schema';

// Import handlers
import { createSurpriseBox } from './handlers/create_surprise_box';
import { getSurpriseBoxes } from './handlers/get_surprise_boxes';
import { getSurpriseBoxById } from './handlers/get_surprise_box_by_id';
import { updateSurpriseBox } from './handlers/update_surprise_box';
import { deleteSurpriseBox } from './handlers/delete_surprise_box';
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { createOrder } from './handlers/create_order';
import { getOrders } from './handlers/get_orders';
import { getUserOrders } from './handlers/get_user_orders';
import { updateOrderStatus } from './handlers/update_order_status';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Surprise Box routes
  createSurpriseBox: publicProcedure
    .input(createSurpriseBoxInputSchema)
    .mutation(({ input }) => createSurpriseBox(input)),

  getSurpriseBoxes: publicProcedure
    .input(getSurpriseBoxesInputSchema)
    .query(({ input }) => getSurpriseBoxes(input)),

  getSurpriseBoxById: publicProcedure
    .input(getSurpriseBoxByIdInputSchema)
    .query(({ input }) => getSurpriseBoxById(input)),

  updateSurpriseBox: publicProcedure
    .input(updateSurpriseBoxInputSchema)
    .mutation(({ input }) => updateSurpriseBox(input)),

  deleteSurpriseBox: publicProcedure
    .input(getSurpriseBoxByIdInputSchema)
    .mutation(({ input }) => deleteSurpriseBox(input)),

  // User routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Order routes
  createOrder: publicProcedure
    .input(createOrderInputSchema)
    .mutation(({ input }) => createOrder(input)),

  getOrders: publicProcedure
    .query(() => getOrders()),

  getUserOrders: publicProcedure
    .input(getUserOrdersInputSchema)
    .query(({ input }) => getUserOrders(input)),

  updateOrderStatus: publicProcedure
    .input(updateOrderStatusInputSchema)
    .mutation(({ input }) => updateOrderStatus(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
