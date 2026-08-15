import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Matches, Min } from 'class-validator';

export class QueueMintDto {
  @ApiProperty({
    description: 'EVM recipient address (0x...)',
    example: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  })
  @IsNotEmpty({ message: 'Recipient address is required' })
  @IsString({ message: 'Recipient must be a string' })
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Recipient must be a valid 40-character hex EVM address starting with 0x' })
  recipient: string;

  @ApiProperty({
    description: 'Amount of RECI tokens to mint',
    example: 25.5,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be greater than 0' })
  @Min(0.0001, { message: 'Amount must be at least 0.0001' })
  amount: number;

  @ApiPropertyOptional({
    description: 'Optional sender address or origin tag',
    example: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  })
  @IsOptional()
  @IsString()
  fromAddress?: string;
}
