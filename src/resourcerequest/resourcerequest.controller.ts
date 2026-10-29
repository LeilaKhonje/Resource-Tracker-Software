import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResourcerequestService } from './resourcerequest.service';
import { CreateResourceRequestDto } from './dto/create-resourcerequest.dto';
import { UpdateResourceRequestDto } from './dto/update-resourcerequest.dto';
import { QueryResourceRequestDto } from './dto/query-resourcerequest.dto';
import { AuthUser, UserRole } from './roles';



@ApiTags('resource-requests')
@ApiHeader({
  name: 'x-user-id',
  description: 'e.g. lead-1 or manager-1',
  required: true,
})
@ApiHeader({ name: 'x-user-role', enum: UserRole, required: true })
@Controller('resource-requests')
export class ResourcerequestController {
  constructor(private readonly service: ResourcerequestService) {}

  
  private currentUser(req: any): AuthUser {
    if (req.user) return req.user as AuthUser;

    const id = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];
    if (!id || !Object.values(UserRole).includes(role)) {
      throw new UnauthorizedException('No logged-in user');
    }
    return { id, role } as AuthUser;
  }

  
  @Post()
  create(@Body() dto: CreateResourceRequestDto, @Req() req: any) {
    return this.service.create(dto, this.currentUser(req));
  }

 
  @Get()
  findAll(@Query() query: QueryResourceRequestDto, @Req() req: any) {
    return this.service.findAll(query, this.currentUser(req));
  }

  
  @ApiQuery({ name: 'include', required: false, enum: ['audit'] })
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('include') include: string | undefined,
    @Req() req: any,
  ) {
    return this.service.findOne(id, this.currentUser(req), include === 'audit');
  }

  
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResourceRequestDto,
    @Req() req: any,
  ) {
    return this.service.update(id, dto, this.currentUser(req));
  }
}