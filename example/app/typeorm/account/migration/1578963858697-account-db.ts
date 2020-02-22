import { MigrationInterface, QueryRunner } from 'typeorm';

export class accountDb1578963858697 implements MigrationInterface {
  name = 'accountDb1578963858697';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "mp_third_party_auths" ADD "schools" character varying(1024)`, undefined);
    await queryRunner.query(`ALTER TABLE "mp_third_party_auths" ADD "token_expire_time" integer`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "mp_third_party_auths" DROP COLUMN "token_expire_time"`, undefined);
    await queryRunner.query(`ALTER TABLE "mp_third_party_auths" DROP COLUMN "schools"`, undefined);
  }
}
