
import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Nestly API",
            version: "1.0.0",
            description: "API documentation for the Nestly rental and roommate platform"
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Development server"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },
    apis: ["./routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
