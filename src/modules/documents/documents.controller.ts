import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import {
  UploadDocumentDto,
  UpdateDocumentDto,
  UploadDocumentVersionDto,
  DocumentFilterDto,
  DocumentSearchDto,
  LogDocumentAccessDto,
} from './dto/documents.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

@ApiTags('Documents & Records')
@ApiBearerAuth('JWT-auth')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // 📁 DOCUMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post()
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.FACILITY_MANAGER,
    Role.ACCOUNTANT,
    Role.RESIDENT,
    Role.TENANT,
    Role.VENDOR,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a new document to the repository' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  async uploadDocument(@CurrentUser() user: AuthUser, @Body() dto: UploadDocumentDto) {
    return this.documentsService.uploadDocument(user, dto);
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.FACILITY_MANAGER,
    Role.ACCOUNTANT,
    Role.RESIDENT,
    Role.TENANT,
    Role.VENDOR,
  )
  @ApiOperation({ summary: 'List documents (filtered by category, owner, access level)' })
  @ApiResponse({ status: 200, description: 'Documents retrieved' })
  async findAllDocuments(@CurrentUser() user: AuthUser, @Query() filter: DocumentFilterDto) {
    return this.documentsService.findAllDocuments(user, filter);
  }

  @Get('search')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.FACILITY_MANAGER,
    Role.ACCOUNTANT,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Full-text search on document title, description, and tags' })
  @ApiQuery({ name: 'q', description: 'Search query string' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchDocuments(@CurrentUser() user: AuthUser, @Query() query: DocumentSearchDto) {
    return this.documentsService.searchDocuments(user, query.q);
  }

  @Get('expiring')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER, Role.FACILITY_MANAGER)
  @ApiOperation({ summary: 'Get documents with expiry dates within the next 30 days' })
  @ApiResponse({ status: 200, description: 'Expiring documents' })
  async getExpiringDocuments(@CurrentUser() user: AuthUser) {
    return this.documentsService.getExpiringDocuments(user);
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.FACILITY_MANAGER,
    Role.ACCOUNTANT,
    Role.RESIDENT,
    Role.TENANT,
    Role.VENDOR,
  )
  @ApiOperation({ summary: 'Get a document by ID (access-level enforced)' })
  @ApiResponse({ status: 200, description: 'Document retrieved' })
  @ApiResponse({ status: 403, description: 'Insufficient access level' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findDocumentById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documentsService.findDocumentById(user, id);
  }

  @Patch(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.FACILITY_MANAGER,
    Role.ACCOUNTANT,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Update document metadata (title, tags, access level, expiry, pin)' })
  @ApiResponse({ status: 200, description: 'Document updated' })
  async updateDocument(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.updateDocument(user, id, dto);
  }

  @Post(':id/versions')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.FACILITY_MANAGER,
    Role.ACCOUNTANT,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload a new version of a document' })
  @ApiResponse({ status: 201, description: 'New version uploaded; previous version archived' })
  async uploadNewVersion(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UploadDocumentVersionDto,
  ) {
    return this.documentsService.uploadNewVersion(user, id, dto);
  }

  @Get(':id/versions')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.FACILITY_MANAGER,
    Role.ACCOUNTANT,
    Role.RESIDENT,
    Role.TENANT,
  )
  @ApiOperation({ summary: 'Get version history for a document' })
  @ApiResponse({ status: 200, description: 'Version history retrieved' })
  async getVersionHistory(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documentsService.getVersionHistory(user, id);
  }

  @Post(':id/archive')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a document' })
  @ApiResponse({ status: 200, description: 'Document archived' })
  async archiveDocument(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documentsService.archiveDocument(user, id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently soft-delete a document (SOCIETY_ADMIN+)' })
  @ApiResponse({ status: 204, description: 'Document deleted' })
  async deleteDocument(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documentsService.deleteDocument(user, id);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📋 ACCESS LOGS
  // ═══════════════════════════════════════════════════════════════════════════

  @Post(':id/log-access')
  @Roles(
    Role.SUPER_ADMIN,
    Role.SOCIETY_ADMIN,
    Role.COMMITTEE_MEMBER,
    Role.FACILITY_MANAGER,
    Role.ACCOUNTANT,
    Role.RESIDENT,
    Role.TENANT,
    Role.VENDOR,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a view or download event for audit trail' })
  @ApiResponse({ status: 201, description: 'Access logged' })
  async logAccess(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LogDocumentAccessDto,
  ) {
    return this.documentsService.logAccess(user, id, dto);
  }

  @Get(':id/access-logs')
  @Roles(Role.SUPER_ADMIN, Role.SOCIETY_ADMIN, Role.COMMITTEE_MEMBER)
  @ApiOperation({ summary: 'Get document audit trail (admin only)' })
  @ApiResponse({ status: 200, description: 'Access logs retrieved' })
  async getAccessLogs(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.documentsService.getAccessLogs(user, id);
  }
}
