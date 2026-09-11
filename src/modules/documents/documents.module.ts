import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { SocietyDocument } from './entities/society-document.entity';
import { DocumentAccessLog } from './entities/document-access-log.entity';
import { DocumentsService } from './documents.service';
import { DocumentsScheduler, DOCUMENTS_QUEUE } from './documents.scheduler';
import { DocumentsController } from './documents.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocietyDocument, DocumentAccessLog]),
    BullModule.registerQueue({ name: DOCUMENTS_QUEUE }),
    NotificationsModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsScheduler],
  exports: [DocumentsService],
})
export class DocumentsModule {}
