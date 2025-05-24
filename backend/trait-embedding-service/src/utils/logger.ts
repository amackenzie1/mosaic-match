import pino from "pino";

// const isDevelopment = process.env.NODE_ENV === "development"; // No longer needed for this simplified version

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  // Removing the transport option entirely to avoid issues in Next.js API routes.
  // pino-pretty can be used via CLI during development if needed:
  // e.g., next dev | pino-pretty
  /*
  ...(isDevelopment && { 
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
  */
});

export default logger;
