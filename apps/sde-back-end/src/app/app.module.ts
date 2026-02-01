import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MessageModule } from './modules/message/message.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI ||
        'mongodb://admin:password123@localhost:27017/sde_messages?authSource=admin'
    ),
    AuthModule,
    UserModule,
    MessageModule,
  ],
})
export class AppModule {}
