import { IsString, IsEnum, MaxLength, MinLength, IsOptional } from 'class-validator';
import { MessageTag } from '@sde-challenge/shared-types';

export class UpdateMessageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(240)
  content?: string;

  @IsOptional()
  @IsEnum(MessageTag)
  tag?: MessageTag;
}
