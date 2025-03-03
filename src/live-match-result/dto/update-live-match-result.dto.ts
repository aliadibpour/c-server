import { PartialType } from '@nestjs/mapped-types';
import { CreateLiveMatchResultDto } from './create-live-match-result.dto';

export class UpdateLiveMatchResultDto extends PartialType(CreateLiveMatchResultDto) {}
