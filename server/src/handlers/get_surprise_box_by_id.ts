
import { db } from '../db';
import { surpriseBoxesTable } from '../db/schema';
import { type GetSurpriseBoxByIdInput, type SurpriseBox } from '../schema';
import { eq } from 'drizzle-orm';

export const getSurpriseBoxById = async (input: GetSurpriseBoxByIdInput): Promise<SurpriseBox | null> => {
  try {
    const results = await db.select()
      .from(surpriseBoxesTable)
      .where(eq(surpriseBoxesTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const surpriseBox = results[0];
    return {
      ...surpriseBox,
      price: parseFloat(surpriseBox.price) // Convert numeric field to number
    };
  } catch (error) {
    console.error('Failed to get surprise box by ID:', error);
    throw error;
  }
};
