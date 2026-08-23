-- DropForeignKey
ALTER TABLE IF EXISTS "ProductImage" DROP CONSTRAINT IF EXISTS "ProductImage_productId_fkey";
ALTER TABLE IF EXISTS "_LabelToProduct" DROP CONSTRAINT IF EXISTS "_LabelToProduct_A_fkey";
ALTER TABLE IF EXISTS "_LabelToProduct" DROP CONSTRAINT IF EXISTS "_LabelToProduct_B_fkey";

-- DropTable
DROP TABLE IF EXISTS "_LabelToProduct";
DROP TABLE IF EXISTS "Label";
DROP TABLE IF EXISTS "ProductImage";
DROP TABLE IF EXISTS "WebsiteSetting";
