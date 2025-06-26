
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { surpriseBoxesTable } from '../db/schema';
import { type GetSurpriseBoxByIdInput, type CreateSurpriseBoxInput } from '../schema';
import { getSurpriseBoxById } from '../handlers/get_surprise_box_by_id';

// Test input for creating a surprise box
const testSurpriseBoxInput: CreateSurpriseBoxInput = {
  name: 'Test Mystery Box',
  tagline: 'Amazing surprises await!',
  description: 'A box full of wonderful tech surprises',
  price: 49.99,
  imageUrl: 'https://example.com/box.jpg',
  category: 'Hardware',
  contentsDescription: 'Various hardware components and gadgets',
  stock: 25,
  isActive: true
};

describe('getSurpriseBoxById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a surprise box by ID', async () => {
    // Create a surprise box first
    const insertResult = await db.insert(surpriseBoxesTable)
      .values({
        ...testSurpriseBoxInput,
        price: testSurpriseBoxInput.price.toString()
      })
      .returning()
      .execute();

    const createdBox = insertResult[0];
    const input: GetSurpriseBoxByIdInput = { id: createdBox.id };

    const result = await getSurpriseBoxById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBox.id);
    expect(result!.name).toEqual('Test Mystery Box');
    expect(result!.tagline).toEqual('Amazing surprises await!');
    expect(result!.description).toEqual('A box full of wonderful tech surprises');
    expect(result!.price).toEqual(49.99);
    expect(typeof result!.price).toBe('number');
    expect(result!.imageUrl).toEqual('https://example.com/box.jpg');
    expect(result!.category).toEqual('Hardware');
    expect(result!.contentsDescription).toEqual('Various hardware components and gadgets');
    expect(result!.stock).toEqual(25);
    expect(result!.isActive).toEqual(true);
    expect(result!.createdAt).toBeInstanceOf(Date);
    expect(result!.updatedAt).toBeInstanceOf(Date);
  });

  it('should return null for non-existent ID', async () => {
    const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
    const input: GetSurpriseBoxByIdInput = { id: nonExistentId };

    const result = await getSurpriseBoxById(input);

    expect(result).toBeNull();
  });

  it('should return inactive surprise boxes', async () => {
    // Create an inactive surprise box
    const inactiveBoxInput = {
      ...testSurpriseBoxInput,
      isActive: false
    };

    const insertResult = await db.insert(surpriseBoxesTable)
      .values({
        ...inactiveBoxInput,
        price: inactiveBoxInput.price.toString()
      })
      .returning()
      .execute();

    const createdBox = insertResult[0];
    const input: GetSurpriseBoxByIdInput = { id: createdBox.id };

    const result = await getSurpriseBoxById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdBox.id);
    expect(result!.isActive).toEqual(false);
  });
});
