
import { db } from '../db';
import { surpriseBoxesTable } from '../db/schema';
import { type UpdateSurpriseBoxInput, type SurpriseBox } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSurpriseBox = async (input: UpdateSurpriseBoxInput): Promise<SurpriseBox | null> => {
  try {
    const { id, ...updates } = input;

    // Convert numeric fields to strings for database storage
    const updateData: any = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'price') {
        updateData[key] = value !== undefined ? value.toString() : undefined;
      } else {
        updateData[key] = value;
      }
    });

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // If no fields to update, return null
    if (Object.keys(updateData).length === 0) {
      return null;
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    // Update the surprise box
    const result = await db.update(surpriseBoxesTable)
      .set(updateData)
      .where(eq(surpriseBoxesTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const surpriseBox = result[0];
    return {
      ...surpriseBox,
      price: parseFloat(surpriseBox.price)
    };
  } catch (error) {
    console.error('Surprise box update failed:', error);
    throw error;
  }
};
