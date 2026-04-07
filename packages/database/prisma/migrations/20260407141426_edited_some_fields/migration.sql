-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "lastDeployedAt" TIMESTAMP(3),
ALTER COLUMN "defaultBranch" SET DEFAULT 'main',
ALTER COLUMN "deploymentUrl" DROP NOT NULL;
