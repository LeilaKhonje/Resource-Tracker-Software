import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
//import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';

//export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'rog23qk4',
      database: 'resource_tracker',
      autoLoadEntities: true,
      synchronize: true,
    }),
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
   /*ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'resource-tracker-software',
    }),*/
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
