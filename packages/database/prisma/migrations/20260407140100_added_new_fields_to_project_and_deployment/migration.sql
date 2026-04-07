/*
  Warnings:

  - The values [QUEUED] on the enum `DeploymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `branch` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `buildCommand` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `repoUrl` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `rootDirectory` on the `Project` table. All the data in the column will be lost.
  - Added the required column `branch` to the `Deployment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `defaultBranch` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deploymentUrl` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `repositoryFullName` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeploymentStatus_new" AS ENUM ('PENDING', 'CLONING', 'DETECTING', 'ALLOCATING', 'BUILDING', 'DEPLOYING', 'SUCCESS', 'FAILED');
ALTER TABLE "Deployment" ALTER COLUMN "status" TYPE "DeploymentStatus_new" USING ("status"::text::"DeploymentStatus_new");
ALTER TYPE "DeploymentStatus" RENAME TO "DeploymentStatus_old";
ALTER TYPE "DeploymentStatus_new" RENAME TO "DeploymentStatus";
DROP TYPE "public"."DeploymentStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "Deployment" ADD COLUMN     "branch" TEXT NOT NULL,
ADD COLUMN     "commitHash" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "error" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "branch",
DROP COLUMN "buildCommand",
DROP COLUMN "repoUrl",
DROP COLUMN "rootDirectory",
ADD COLUMN     "defaultBranch" TEXT NOT NULL,
ADD COLUMN     "deploymentUrl" TEXT NOT NULL,
ADD COLUMN     "repositoryFullName" TEXT NOT NULL;
