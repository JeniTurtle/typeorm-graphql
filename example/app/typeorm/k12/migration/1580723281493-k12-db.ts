import { MigrationInterface, QueryRunner } from 'typeorm';

export class k12Db1580723281493 implements MigrationInterface {
  name = 'k12Db1580723281493';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "ac_k12_role_groups" ADD "original_id" character varying`, undefined);
    await queryRunner.query(`ALTER TABLE "ac_k12_module_groups" ADD "original_id" character varying`, undefined);
    await queryRunner.query(
      `ALTER TABLE "ac_k12_role_groups" ADD CONSTRAINT "FK_d1f65202d0d53f10a7deaed3e59" FOREIGN KEY ("original_id") REFERENCES "ac_k12_role_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "ac_k12_module_groups" ADD CONSTRAINT "FK_6be0e886e4d8e025deef319fbe2" FOREIGN KEY ("original_id") REFERENCES "ac_k12_module_groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `ALTER TABLE "ac_k12_module_groups" DROP CONSTRAINT "FK_6be0e886e4d8e025deef319fbe2"`,
      undefined,
    );
    await queryRunner.query(
      `ALTER TABLE "ac_k12_role_groups" DROP CONSTRAINT "FK_d1f65202d0d53f10a7deaed3e59"`,
      undefined,
    );
    await queryRunner.query(`ALTER TABLE "ac_k12_module_groups" DROP COLUMN "original_id"`, undefined);
    await queryRunner.query(`ALTER TABLE "ac_k12_role_groups" DROP COLUMN "original_id"`, undefined);
  }
}
