
import { db } from '../db';
import { surpriseBoxesTable } from '../db/schema';
import { type CreateSurpriseBoxInput, type SurpriseBox } from '../schema';

export const createSurpriseBox = async (input: CreateSurpriseBoxInput): Promise<SurpriseBox> => {
  try {
    // Insert surprise box record
    const result = await db.insert(surpriseBoxesTable)
      .values({
        name: input.name,
        tagline: input.tagline,
        description: input.description,
        price: input.price.toString(), // Convert number to string for numeric column
        imageUrl: input.imageUrl,
        category: input.category,
        contentsDescription: input.contentsDescription,
        stock: input.stock, // Integer column - no conversion needed
        isActive: input.isActive
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const surpriseBox = result[0];
    return {
      ...surpriseBox,
      price: parseFloat(surpriseBox.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Surprise box creation failed:', error);
    throw error;
  }
};
