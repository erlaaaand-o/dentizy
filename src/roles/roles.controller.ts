import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/interface/guards/roles.guard';
import { Roles } from '../auth/interface/decorators/roles.decorator';
import { UserRole } from './entities/role.entity';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Roles')
@ApiBearerAuth('access-token')
@Controller('roles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'Token tidak valid atau kadaluarsa' })
@ApiForbiddenResponse({
  description: 'Role user tidak memiliki akses ke endpoint ini',
})
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles(UserRole.STAF, UserRole.KEPALA_KLINIK)
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.KEPALA_KLINIK)
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.rolesService.findOne(id);
  }
}
