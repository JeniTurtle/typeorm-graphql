import { MigrationInterface, QueryRunner } from 'typeorm';

export class k12Db1577780588670 implements MigrationInterface {
  name = 'k12Db1577780588670';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "ac_k12_powers" ADD "order" integer NOT NULL DEFAULT 0`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "ac_k12_powers" DROP COLUMN "order"`, undefined);
  }
}
