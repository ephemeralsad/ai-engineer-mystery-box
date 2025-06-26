
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { surpriseBoxesTable } from '../db/schema';
import { type CreateSurpriseBoxInput, createSurpriseBoxInputSchema } from '../schema';
import { createSurpriseBox } from '../handlers/create_surprise_box';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateSurpriseBoxInput = {
  name: 'Test Surprise Box',
  tagline: 'Amazing surprises await!',
  description: 'A box full of tech surprises for developers',
  price: 99.99,
  imageUrl: 'https://example.com/image.jpg',
  category: 'Hardware',
  contentsDescription: 'Contains various hardware gadgets and accessories',
  stock: 50,
  isActive: true
};

describe('createSurpriseBox', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a surprise box', async () => {
    const result = await createSurpriseBox(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Surprise Box');
    expect(result.tagline).toEqual(testInput.tagline);
    expect(result.description).toEqual(testInput.description);
    expect(result.price).toEqual(99.99);
    expect(typeof result.price).toEqual('number');
    expect(result.imageUrl).toEqual(testInput.imageUrl);
    expect(result.category).toEqual('Hardware');
    expect(result.contentsDescription).toEqual(testInput.contentsDescription);
    expect(result.stock).toEqual(50);
    expect(result.isActive).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should save surprise box to database', async () => {
    const result = await createSurpriseBox(testInput);

    // Query using proper drizzle syntax
    const surpriseBoxes = await db.select()
      .from(surpriseBoxesTable)
      .where(eq(surpriseBoxesTable.id, result.id))
      .execute();

    expect(surpriseBoxes).toHaveLength(1);
    const savedBox = surpriseBoxes[0];
    expect(savedBox.name).toEqual('Test Surprise Box');
    expect(savedBox.tagline).toEqual(testInput.tagline);
    expect(savedBox.description).toEqual(testInput.description);
    expect(parseFloat(savedBox.price)).toEqual(99.99);
    expect(savedBox.imageUrl).toEqual(testInput.imageUrl);
    expect(savedBox.category).toEqual('Hardware');
    expect(savedBox.contentsDescription).toEqual(testInput.contentsDescription);
    expect(savedBox.stock).toEqual(50);
    expect(savedBox.isActive).toEqual(true);
    expect(savedBox.createdAt).toBeInstanceOf(Date);
    expect(savedBox.updatedAt).toBeInstanceOf(Date);
  });

  it('should use default isActive value when not provided', async () => {
    const inputWithoutIsActive = {
      name: 'Test Box Default Active',
      tagline: 'Test tagline',
      description: 'Test description',
      price: 29.99,
      imageUrl: 'https://example.com/test.jpg',
      category: 'Software' as const,
      contentsDescription: 'Software tools and licenses',
      stock: 25
      // isActive not provided - should use Zod default via parsing
    };

    // Parse with Zod to apply defaults
    const parsedInput = createSurpriseBoxInputSchema.parse(inputWithoutIsActive);
    const result = await createSurpriseBox(parsedInput);

    expect(result.isActive).toEqual(true);
    expect(result.name).toEqual('Test Box Default Active');
    expect(result.price).toEqual(29.99);
    expect(typeof result.price).toEqual('number');
  });

  it('should handle different categories correctly', async () => {
    const categories = ['Hardware', 'Software', 'Books', 'Gadgets', 'Apparel', 'Productivity'] as const;
    
    for (const category of categories) {
      const categoryInput: CreateSurpriseBoxInput = {
        ...testInput,
        name: `Test ${category} Box`,
        category
      };

      const result = await createSurpriseBox(categoryInput);
      expect(result.category).toEqual(category);
      expect(result.name).toEqual(`Test ${category} Box`);
    }
  });

  it('should handle zero stock correctly', async () => {
    const zeroStockInput: CreateSurpriseBoxInput = {
      ...testInput,
      name: 'Out of Stock Box',
      stock: 0
    };

    const result = await createSurpriseBox(zeroStockInput);
    expect(result.stock).toEqual(0);
    expect(result.name).toEqual('Out of Stock Box');
  });
});
