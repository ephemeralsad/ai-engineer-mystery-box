
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { surpriseBoxesTable } from '../db/schema';
import { type CreateSurpriseBoxInput, type UpdateSurpriseBoxInput } from '../schema';
import { updateSurpriseBox } from '../handlers/update_surprise_box';
import { eq } from 'drizzle-orm';

// Test data for creating a surprise box
const testCreateInput: CreateSurpriseBoxInput = {
  name: 'Test Box',
  tagline: 'Test tagline',
  description: 'A test surprise box',
  price: 29.99,
  imageUrl: 'https://example.com/image.jpg',
  category: 'Gadgets',
  contentsDescription: 'Contains amazing gadgets',
  stock: 50,
  isActive: true
};

describe('updateSurpriseBox', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a surprise box with all fields', async () => {
    // Create a surprise box first
    const createResult = await db.insert(surpriseBoxesTable)
      .values({
        ...testCreateInput,
        price: testCreateInput.price.toString()
      })
      .returning()
      .execute();

    const createdBox = createResult[0];

    const updateInput: UpdateSurpriseBoxInput = {
      id: createdBox.id,
      name: 'Updated Box',
      tagline: 'Updated tagline',
      description: 'Updated description',
      price: 39.99,
      imageUrl: 'https://example.com/updated-image.jpg',
      category: 'Hardware',
      contentsDescription: 'Updated contents',
      stock: 25,
      isActive: false
    };

    const result = await updateSurpriseBox(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Updated Box');
    expect(result!.tagline).toEqual('Updated tagline');
    expect(result!.description).toEqual('Updated description');
    expect(result!.price).toEqual(39.99);
    expect(typeof result!.price).toEqual('number');
    expect(result!.imageUrl).toEqual('https://example.com/updated-image.jpg');
    expect(result!.category).toEqual('Hardware');
    expect(result!.contentsDescription).toEqual('Updated contents');
    expect(result!.stock).toEqual(25);
    expect(result!.isActive).toEqual(false);
    expect(result!.id).toEqual(createdBox.id);
    expect(result!.updatedAt).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create a surprise box first
    const createResult = await db.insert(surpriseBoxesTable)
      .values({
        ...testCreateInput,
        price: testCreateInput.price.toString()
      })
      .returning()
      .execute();

    const createdBox = createResult[0];

    const updateInput: UpdateSurpriseBoxInput = {
      id: createdBox.id,
      name: 'Partially Updated Box',
      price: 49.99
    };

    const result = await updateSurpriseBox(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Partially Updated Box');
    expect(result!.price).toEqual(49.99);
    expect(typeof result!.price).toEqual('number');
    // Other fields should remain unchanged
    expect(result!.tagline).toEqual(testCreateInput.tagline);
    expect(result!.description).toEqual(testCreateInput.description);
    expect(result!.category).toEqual(testCreateInput.category);
    expect(result!.stock).toEqual(testCreateInput.stock);
    expect(result!.isActive).toEqual(testCreateInput.isActive);
  });

  it('should save updated data to database', async () => {
    // Create a surprise box first
    const createResult = await db.insert(surpriseBoxesTable)
      .values({
        ...testCreateInput,
        price: testCreateInput.price.toString()
      })
      .returning()
      .execute();

    const createdBox = createResult[0];

    const updateInput: UpdateSurpriseBoxInput = {
      id: createdBox.id,
      name: 'Database Updated Box',
      stock: 100
    };

    await updateSurpriseBox(updateInput);

    // Verify in database
    const boxes = await db.select()
      .from(surpriseBoxesTable)
      .where(eq(surpriseBoxesTable.id, createdBox.id))
      .execute();

    expect(boxes).toHaveLength(1);
    expect(boxes[0].name).toEqual('Database Updated Box');
    expect(boxes[0].stock).toEqual(100);
    expect(parseFloat(boxes[0].price)).toEqual(testCreateInput.price);
    expect(boxes[0].updatedAt).toBeInstanceOf(Date);
  });

  it('should return null for non-existent surprise box', async () => {
    const updateInput: UpdateSurpriseBoxInput = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Non-existent Box'
    };

    const result = await updateSurpriseBox(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields to update', async () => {
    // Create a surprise box first
    const createResult = await db.insert(surpriseBoxesTable)
      .values({
        ...testCreateInput,
        price: testCreateInput.price.toString()
      })
      .returning()
      .execute();

    const createdBox = createResult[0];

    const updateInput: UpdateSurpriseBoxInput = {
      id: createdBox.id
    };

    const result = await updateSurpriseBox(updateInput);

    expect(result).toBeNull();
  });

  it('should handle stock quantity update correctly', async () => {
    // Create a surprise box first
    const createResult = await db.insert(surpriseBoxesTable)
      .values({
        ...testCreateInput,
        price: testCreateInput.price.toString()
      })
      .returning()
      .execute();

    const createdBox = createResult[0];

    const updateInput: UpdateSurpriseBoxInput = {
      id: createdBox.id,
      stock: 0
    };

    const result = await updateSurpriseBox(updateInput);

    expect(result).not.toBeNull();
    expect(result!.stock).toEqual(0);
    expect(typeof result!.stock).toEqual('number');
  });
});
