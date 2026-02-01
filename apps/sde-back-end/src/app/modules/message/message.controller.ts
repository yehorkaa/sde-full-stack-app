import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto, UpdateMessageDto } from './dto';
import { ActiveUser, ActiveUserData } from '../auth/decorators/active-user.decorator';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  async create(
    @Body() createMessageDto: CreateMessageDto,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.messageService.create(createMessageDto, user.sub);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.messageService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @ActiveUser() user: ActiveUserData
  ) {
    return this.messageService.update(id, user.sub, updateMessageDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @ActiveUser() user: ActiveUserData) {
    return this.messageService.remove(id, user.sub);
  }
}
