import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, MaxLength } from 'class-validator';

// Define your own categories. These are just examples.
export enum ItemCategory {
  TOOLS = 'TOL',
  MATERIALS = 'MAT',
  COMPONENTS = 'CMP',
  HARDWARE = 'HDW',
}

export class CreateItemDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  unitOfMeasure: string; // e.g., 'PCS', 'KG', 'MTR'

  // --- Fields for SKU Generation ---
  @IsNotEmpty()
  @IsEnum(ItemCategory)
  category: ItemCategory; // 'TOL', 'MAT', etc.

  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  brandCode: string; // e.g., 'MAK' (Makita), '3M'
  // ---

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityOnHand?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number = 0;
}
