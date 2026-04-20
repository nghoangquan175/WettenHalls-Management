import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WettenHalls Management API',
      version: '1.0.0',
      description:
        'The official API documentation for WettenHalls Management system.',
      contact: {
        name: 'Developer Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'management.sid', // Matches the session name in server.ts
        },
      },
    },
  },
  // Path to the API docs
  apis: ['./src/routes/*.ts', './src/models/*.ts', './src/server.ts'], // Correct paths for TypeScript files
};

export const specs = swaggerJsdoc(options);
