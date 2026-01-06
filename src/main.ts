import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  // 1. Cria a aplicação NestJS
  const app = await NestFactory.create(AppModule);

  // 2. Habilita validação global (para funcionar os decorators como @IsString, @IsNotEmpty nos DTOs)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Transforma o JSON recebido em instâncias da classe DTO
      whitelist: true, // Remove propriedades que não estão no DTO (segurança)
      forbidNonWhitelisted: true, // Retorna erro se mandarem campos extras
    })
  );

  // 3. Pega o ConfigService para ler as variáveis de ambiente
  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3000); // Porta padrão 3000 se não tiver no .env

  // 4. Configuração do Swagger (Documentação da API)
  const config = new DocumentBuilder()
    .setTitle("Order Service API")
    .setDescription("Microsserviço de Gestão de Pedidos (Tech Challenge)")
    .setVersion("1.0")
    .addTag("orders")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document); // Acessível em http://localhost:3000/docs

  // 5. Hooks para encerrar conexão com banco/filas corretamente ao matar o container
  app.enableShutdownHooks();

  // 6. Inicia o servidor
  await app.listen(port);

  logger.log(`🚀 Order Service is running on: http://localhost:${port}`);
  logger.log(`📄 Swagger Documentation: http://localhost:${port}/docs`);
}

bootstrap();
