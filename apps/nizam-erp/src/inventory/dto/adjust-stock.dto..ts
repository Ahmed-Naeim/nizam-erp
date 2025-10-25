import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class AdjustStockDto {
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @IsNumber()
  @Min(0) // You can't have negative stock
  newQuantity: number;
}
