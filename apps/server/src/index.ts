import "dotenv/config";
import { createServer } from "node:http";
import { createYoga, createSchema } from "graphql-yoga";
import { typeDefs } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers.js";
import { createContext } from "./context.js";

const schema = createSchema({ typeDefs, resolvers });

const yoga = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: "/graphql",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const server = createServer(yoga);
const port = Number(process.env.PORT ?? 4000);

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`GraphQL server ready at http://localhost:${port}/graphql`);
});
