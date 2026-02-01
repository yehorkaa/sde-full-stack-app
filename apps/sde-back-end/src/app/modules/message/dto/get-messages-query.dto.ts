import {
  IsEnum,
  IsOptional,
  IsMongoId,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageTag } from '@sde-challenge/shared-types';

export class GetMessagesQueryDto {
  @IsOptional()
  @IsEnum(MessageTag)
  tag?: MessageTag;

  @IsOptional()
  @IsMongoId()
  authorId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsMongoId()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
