
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { surpriseBoxesTable } from '../db/schema';
import { type GetSurpriseBoxByIdInput } from '../schema';
import { deleteSurpriseBox } from '../handlers/delete_surprise_box';
import { eq } from 'drizzle-orm';

describe('deleteSurpriseBox', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing surprise box', async () => {
    // Create a surprise box first
    const insertResult = await db.insert(surpriseBoxesTable)
      .values({
        name: 'Test Box',
        tagline: 'A test box',
        description: 'This is a test surprise box',
        price: '29.99',
        imageUrl: 'https://example.com/image.jpg',
        category: 'Hardware',
        contentsDescription: 'Contains test items',
        stock: 10,
        isActive: true
      })
      .returning()
      .execute();

    const createdBox = insertResult[0];
    const input: GetSurpriseBoxByIdInput = { id: createdBox.id };

    // Delete the surprise box
    const result = await deleteSurpriseBox(input);

    expect(result).toBe(true);

    // Verify the box is actually deleted from database
    const boxes = await db.select()
      .from(surpriseBoxesTable)
      .where(eq(surpriseBoxesTable.id, createdBox.id))
      .execute();

    expect(boxes).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent surprise box', async () => {
    const input: GetSurpriseBoxByIdInput = { 
      id: '123e4567-e89b-12d3-a456-426614174000' // Valid UUID format but doesn't exist
    };

    const result = await deleteSurpriseBox(input);

    expect(result).toBe(false);
  });

  it('should not affect other surprise boxes when deleting one', async () => {
    // Create two surprise boxes
    const insertResult = await db.insert(surpriseBoxesTable)
      .values([
        {
          name: 'Box 1',
          tagline: 'First box',
          description: 'First test surprise box',
          price: '19.99',
          imageUrl: 'https://example.com/image1.jpg',
          category: 'Software',
          contentsDescription: 'Contains software items',
          stock: 5,
          isActive: true
        },
        {
          name: 'Box 2',
          tagline: 'Second box',
          description: 'Second test surprise box',
          price: '39.99',
          imageUrl: 'https://example.com/image2.jpg',
          category: 'Books',
          contentsDescription: 'Contains book items',
          stock: 15,
          isActive: true
        }
      ])
      .returning()
      .execute();

    const [box1, box2] = insertResult;
    const input: GetSurpriseBoxByIdInput = { id: box1.id };

    // Delete first box
    const result = await deleteSurpriseBox(input);

    expect(result).toBe(true);

    // Verify first box is deleted
    const deletedBoxes = await db.select()
      .from(surpriseBoxesTable)
      .where(eq(surpriseBoxesTable.id, box1.id))
      .execute();

    expect(deletedBoxes).toHaveLength(0);

    // Verify second box still exists
    const remainingBoxes = await db.select()
      .from(surpriseBoxesTable)
      .where(eq(surpriseBoxesTable.id, box2.id))
      .execute();

    expect(remainingBoxes).toHaveLength(1);
    expect(remainingBoxes[0].name).toBe('Box 2');
  });
});
