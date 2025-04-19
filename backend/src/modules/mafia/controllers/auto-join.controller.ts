import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { MafiaService } from '../mafia.service';
import { AutoJoinDto } from '../dto/auto-join.dto';

@Controller('api/mafia')
export class AutoJoinController {
  constructor(private readonly mafiaService: MafiaService) {}

  @Post('auto-join')
  @UsePipes(new ValidationPipe())
  async autoJoin(@Body() autoJoinDto: AutoJoinDto) {
    const { telegramId, name } = autoJoinDto;
    return this.mafiaService.autoJoinRoom(telegramId, name);
  }
}
