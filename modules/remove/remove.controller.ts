import { Controller, Post, Body } from '@nestjs/common';
import { RemoveService } from './remove.service';
import { func } from '../../shared/utils';

@Controller('/api/v1/remove')
export class RemoveController {
  constructor(private readonly removeService: RemoveService) {}

  @Post('/customDeleteData')
  async customDelete(@Body() body: any) {
    const result = await this.removeService.customDelete(body);
    return func.result({
      data: result,
    });
  }
}
