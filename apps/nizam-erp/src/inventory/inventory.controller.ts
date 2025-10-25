import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, ValidationPipe } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { InventoryService } from "./inventory.service";
import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";
import { AdjustStockDto } from "./dto/adjust-stock.dto.";

@Controller('items')
@UseGuards(AuthGuard('jwt')) // <-- This locks ALL endpoints in this controller
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  create(@Body(new ValidationPipe()) createItemDto: CreateItemDto) {
    return this.inventoryService.create(createItemDto);
  }

  @Get()
  findAll() {
    return this.inventoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ValidationPipe()) updateItemDto: UpdateItemDto) {
    return this.inventoryService.update(id, updateItemDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }

  @Post('stock/adjust')
  adjustStock(@Body(new ValidationPipe()) adjustStockDto: AdjustStockDto) {
    return this.inventoryService.adjustStock(adjustStockDto);
}
}
