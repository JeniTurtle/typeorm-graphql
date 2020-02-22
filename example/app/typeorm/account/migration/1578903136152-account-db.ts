import { MigrationInterface, QueryRunner } from 'typeorm';

export class accountDb1578903136152 implements MigrationInterface {
  name = 'accountDb1578903136152';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "mp_third_party_auths" ("id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by_id" character varying NOT NULL, "updated_at" TIMESTAMP DEFAULT now(), "updated_by_id" character varying, "deleted_at" TIMESTAMP, "deleted_by_id" character varying, "version" integer NOT NULL, "name" character varying(64) NOT NULL, "app_id" character varying(128) NOT NULL, "app_secret" character varying(128) NOT NULL, "remark" character varying(1024), "status" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_ccb0dc0d7f154c263ba9928ffdd" PRIMARY KEY ("id"))`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP TABLE "mp_third_party_auths"`, undefined);
  }
}
