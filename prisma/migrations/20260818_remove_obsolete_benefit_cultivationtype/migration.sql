-- DropForeignKey
ALTER TABLE IF EXISTS "Product" DROP CONSTRAINT IF EXISTS "Product_cultivationTypeId_fkey";
ALTER TABLE IF EXISTS "_BenefitToProduct" DROP CONSTRAINT IF EXISTS "_BenefitToProduct_A_fkey";
ALTER TABLE IF EXISTS "_BenefitToProduct" DROP CONSTRAINT IF EXISTS "_BenefitToProduct_B_fkey";

-- AlterTable
ALTER TABLE IF EXISTS "Product" DROP COLUMN IF EXISTS "cultivationTypeId";

-- DropTable
DROP TABLE IF EXISTS "_BenefitToProduct";
DROP TABLE IF EXISTS "Benefit";
DROP TABLE IF EXISTS "CultivationType";

