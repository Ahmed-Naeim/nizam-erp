import{Entity, PrimaryGeneratedColumn, Column, Unique} from 'typeorm';

@Entity({ name: 'items' })
@Unique(['sku'])

export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 500, unique: true })
  sku: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  unitOfMeasure: string;

  @Column({ type:'decimal', default: 0,})
  quantityOnHand: number;

  @Column({ type:'decimal', default: 0})
  lowStockThreshold: number;
}
