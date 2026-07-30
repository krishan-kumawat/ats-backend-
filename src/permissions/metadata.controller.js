import {
  Controller,
  Get,
  Param,
  UseGuards,
  Dependencies,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PermissionsService } from './permissions.service.js';
import { getEntityManagerToken } from '@nestjs/typeorm';
import { SchemaObject } from '../entities/schema-object.entity.js';
import { SchemaField } from '../entities/schema-field.entity.js';

@ApiTags('Metadata')
@ApiBearerAuth()
@Controller('metadata')
@Dependencies(getEntityManagerToken(), PermissionsService)
export class MetadataController {
  constructor(entityManager, permissionsService) {
    this.entityManager = entityManager;
    this.permissionsService = permissionsService;
  }

  @Get(':objectApiName')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get schema metadata, OLS, and FLS for an object' })
  @ApiResponse({ status: 200, description: 'Metadata returned successfully.' })
  @ApiResponse({ status: 404, description: 'Schema object not found.' })
  async getMetadata(@Param('objectApiName') objectApiName, @Req() request) {
    const userId = request.user.sub;

    // 1. Fetch schema object
    const schemaObj = await this.entityManager.findOne(SchemaObject, {
      where: { apiName: objectApiName },
    });
    if (!schemaObj) {
      throw new NotFoundException(`Schema Object not found for: ${objectApiName}`);
    }

    // 2. Fetch all fields for this schema object
    const fields = await this.entityManager.find(SchemaField, {
      where: { schemaObjectId: schemaObj.id },
    });

    // 3. Get compiled permissions matrix
    const matrix = await this.permissionsService.getEffectivePermissions(userId);
    const hasModifyAll = matrix?.system?.modifyAllData === true || matrix?.objects?.[objectApiName]?.modifyAllData === true;
    const hasViewAll = matrix?.system?.viewAllData === true || matrix?.objects?.[objectApiName]?.viewAllData === true;

    // 4. Compute Object-Level Security (OLS)
    const olsPerms = matrix?.objects?.[objectApiName];
    const ols = {
      allowRead: hasModifyAll || hasViewAll || (olsPerms?.allowRead === true),
      allowCreate: hasModifyAll || (olsPerms?.allowCreate === true),
      allowEdit: hasModifyAll || (olsPerms?.allowEdit === true),
      allowDelete: hasModifyAll || (olsPerms?.allowDelete === true),
    };

    // 5. Compute Field-Level Security (FLS) for each field
    const mappedFields = fields.map((f) => {
      const flsPerms = matrix?.fields?.[objectApiName]?.[f.apiName];
      return {
        apiName: f.apiName,
        label: f.label,
        allowRead: hasModifyAll || hasViewAll || (flsPerms?.allowRead === true),
        allowEdit: hasModifyAll || (flsPerms?.allowEdit === true),
      };
    });

    return {
      apiName: schemaObj.apiName,
      label: schemaObj.label,
      ols,
      fields: mappedFields,
    };
  }
}
