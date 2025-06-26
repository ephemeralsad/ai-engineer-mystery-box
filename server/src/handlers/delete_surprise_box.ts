
import { db } from '../db';
import { surpriseBoxesTable } from '../db/schema';
import { type GetSurpriseBoxByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteSurpriseBox = async (input: GetSurpriseBoxByIdInput): Promise<boolean> => {
  try {
    const result = await db.delete(surpriseBoxesTable)
      .where(eq(surpriseBoxesTable.id, input.id))
      .execute();

    // Check if any rows were affected (deleted)
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Surprise box deletion failed:', error);
    throw error;
  }
};
