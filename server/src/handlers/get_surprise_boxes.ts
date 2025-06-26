
import { db } from '../db';
import { surpriseBoxesTable } from '../db/schema';
import { type GetSurpriseBoxesInput, type SurpriseBox } from '../schema';
import { eq, and, ilike, or } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

export const getSurpriseBoxes = async (input: GetSurpriseBoxesInput): Promise<SurpriseBox[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Filter by active status if specified
    if (input.activeOnly) {
      conditions.push(eq(surpriseBoxesTable.isActive, true));
    }

    // Filter by category if specified
    if (input.category) {
      conditions.push(eq(surpriseBoxesTable.category, input.category));
    }

    // Filter by search term if specified (search in name, tagline, description)
    if (input.search) {
      const searchTerm = `%${input.search}%`;
      const searchCondition = or(
        ilike(surpriseBoxesTable.name, searchTerm),
        ilike(surpriseBoxesTable.tagline, searchTerm),
        ilike(surpriseBoxesTable.description, searchTerm)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Build and execute query
    const results = conditions.length === 0
      ? await db.select().from(surpriseBoxesTable).execute()
      : conditions.length === 1
      ? await db.select().from(surpriseBoxesTable).where(conditions[0]).execute()
      : await db.select().from(surpriseBoxesTable).where(and(...conditions)).execute();

    // Convert numeric fields back to numbers
    return results.map(box => ({
      ...box,
      price: parseFloat(box.price)
    }));
  } catch (error) {
    console.error('Get surprise boxes failed:', error);
    throw error;
  }
};
