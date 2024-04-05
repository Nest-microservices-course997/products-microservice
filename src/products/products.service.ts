import { BadRequestException, Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit{
  private readonly logger = new Logger(ProductsService.name);

  onModuleInit() {
    this.$connect();
    this.logger.log('Database connected');
  }

  async create(createProductDto: CreateProductDto) {
    return await this.product.create({
      data: createProductDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, size } = paginationDto;
    const lastPage = Math.ceil(await this.product.count( {where: {available: true}}) / size);
    return {
      data: await this.product.findMany({
        skip: (page - 1) * size,
        take: size,
        where: {
          available: true,
        }
      }),
      meta: {
        total: await this.product.count(),
        page,
        lastPage,
      }
    };
  }

  async findOne(id: number) {
     try {
      const data = await this.product.findUnique({
        where: {
          id,
        },
      });
      if(!data){
        throw new BadRequestException('Product not found!');
      }
      return data;
     }catch (error) {
      if(error instanceof BadRequestException){
        throw error;
      }
      throw new InternalServerErrorException();
     }
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: __, ...data } = updateProductDto;
   try {
    const product = await this.findOne(id);

    if(!product) {
      throw new BadRequestException('Product not found!');
    }

    const data = await this.product.update({
      where: {
        id,
      },
      data: updateProductDto,
    });
    return data;
   } catch(error){
    if(error instanceof BadRequestException){
      throw error;
    }
    throw new InternalServerErrorException();
   }
  }

  async remove(id: number) {
    // return await this.product.delete({
    //   where: {
    //     id,
    //   },
    // });

    const product = await this.product.update({
      where: {
        id,
      },
      data: {
        available: false,
      },
    });
    return product;
  }
}
