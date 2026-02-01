import { IsString, IsEnum, MaxLength, MinLength } from 'class-validator';
import { MessageTag } from '@sde-challenge/shared-types';

export class CreateMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(240)
  content: string;

  @IsEnum(MessageTag)
  tag: MessageTag;
}
