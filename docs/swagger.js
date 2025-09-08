import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// OpenAPI specification options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Plaible API',
      version: '1.0.0',
      description: 'Interactive storytelling platform API',
    },
    servers: [
      {
        url: 'http://localhost:5050',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'jwt',
          description: 'JWT token stored in HTTP-only cookie',
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication and user management',
      },
      {
        name: 'Stories',
        description: 'Story content and metadata',
      },
      {
        name: 'Sessions',
        description: 'Story session management',
      },
      {
        name: 'StoryRunner',
        description: 'Interactive story progression',
      },
      {
        name: 'Wallet',
        description: 'User wallet and transactions',
      },
      {
        name: 'Inbox',
        description: 'Re-engagement messages and notifications',
      },
      {
        name: 'Achievements',
        description: 'User achievements and statistics',
      },
      {
        name: 'Dev',
        description: 'Development and debugging endpoints',
      },
      {
        name: 'SSE',
        description: 'Server-Sent Events for real-time updates',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints for user, story, and feedback management',
      },
    ],
  },
  apis: [
    join(__dirname, '../routes/**/*.js'),
  ],
};

// Generate Swagger specification
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI options
export const swaggerOpts = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestHeaders: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
  `,
  customSiteTitle: 'Plaible API Documentation',
};

// Export swagger-ui-express for server setup
export { swaggerUi };
