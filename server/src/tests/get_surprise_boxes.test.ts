
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { surpriseBoxesTable } from '../db/schema';
import { type GetSurpriseBoxesInput, type CreateSurpriseBoxInput } from '../schema';
import { getSurpriseBoxes } from '../handlers/get_surprise_boxes';

// Test data
const testBox1: CreateSurpriseBoxInput = {
  name: 'Hardware Mystery Box',
  tagline: 'Amazing tech surprises',
  description: 'A box full of amazing hardware surprises',
  price: 99.99,
  imageUrl: 'https://example.com/hardware.jpg',
  category: 'Hardware',
  contentsDescription: 'Contains various hardware items',
  stock: 10,
  isActive: true
};

const testBox2: CreateSurpriseBoxInput = {
  name: 'Software Bundle',
  tagline: 'Digital treasures await',
  description: 'Premium software licenses and tools',
  price: 49.99,
  imageUrl: 'https://example.com/software.jpg',
  category: 'Software',
  contentsDescription: 'Contains software licenses',
  stock: 5,
  isActive: true
};

const testBox3: CreateSurpriseBoxInput = {
  name: 'Inactive Gadget Box',
  tagline: 'Cool gadgets',
  description: 'Various cool gadgets',
  price: 29.99,
  imageUrl: 'https://example.com/gadgets.jpg',
  category: 'Gadgets',
  contentsDescription: 'Contains gadgets',
  stock: 0,
  isActive: false
};

describe('getSurpriseBoxes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all active surprise boxes by default', async () => {
    // Create test data
    await db.insert(surpriseBoxesTable).values([
      {
        ...testBox1,
        price: testBox1.price.toString()
      },
      {
        ...testBox2,
        price: testBox2.price.toString()
      },
      {
        ...testBox3,
        price: testBox3.price.toString()
      }
    ]).execute();

    const input: GetSurpriseBoxesInput = {
      activeOnly: true
    };

    const result = await getSurpriseBoxes(input);

    expect(result).toHaveLength(2);
    expect(result.every(box => box.isActive)).toBe(true);
    expect(result.some(box => box.name === 'Hardware Mystery Box')).toBe(true);
    expect(result.some(box => box.name === 'Software Bundle')).toBe(true);
    expect(result.some(box => box.name === 'Inactive Gadget Box')).toBe(false);
  });

  it('should return all boxes when activeOnly is false', async () => {
    // Create test data
    await db.insert(surpriseBoxesTable).values([
      {
        ...testBox1,
        price: testBox1.price.toString()
      },
      {
        ...testBox3,
        price: testBox3.price.toString()
      }
    ]).execute();

    const input: GetSurpriseBoxesInput = {
      activeOnly: false
    };

    const result = await getSurpriseBoxes(input);

    expect(result).toHaveLength(2);
    expect(result.some(box => box.isActive === true)).toBe(true);
    expect(result.some(box => box.isActive === false)).toBe(true);
  });

  it('should filter by category', async () => {
    // Create test data
    await db.insert(surpriseBoxesTable).values([
      {
        ...testBox1,
        price: testBox1.price.toString()
      },
      {
        ...testBox2,
        price: testBox2.price.toString()
      }
    ]).execute();

    const input: GetSurpriseBoxesInput = {
      category: 'Hardware',
      activeOnly: true
    };

    const result = await getSurpriseBoxes(input);

    expect(result).toHaveLength(1);
    expect(result[0].category).toEqual('Hardware');
    expect(result[0].name).toEqual('Hardware Mystery Box');
  });

  it('should search by name, tagline, and description', async () => {
    // Create test data
    await db.insert(surpriseBoxesTable).values([
      {
        ...testBox1,
        price: testBox1.price.toString()
      },
      {
        ...testBox2,
        price: testBox2.price.toString()
      }
    ]).execute();

    // Search by name
    const nameSearch: GetSurpriseBoxesInput = {
      search: 'Hardware',
      activeOnly: true
    };

    const nameResult = await getSurpriseBoxes(nameSearch);
    expect(nameResult).toHaveLength(1);
    expect(nameResult[0].name).toEqual('Hardware Mystery Box');

    // Search by tagline
    const taglineSearch: GetSurpriseBoxesInput = {
      search: 'Digital',
      activeOnly: true
    };

    const taglineResult = await getSurpriseBoxes(taglineSearch);
    expect(taglineResult).toHaveLength(1);
    expect(taglineResult[0].name).toEqual('Software Bundle');

    // Search by description
    const descriptionSearch: GetSurpriseBoxesInput = {
      search: 'Premium software',
      activeOnly: true
    };

    const descriptionResult = await getSurpriseBoxes(descriptionSearch);
    expect(descriptionResult).toHaveLength(1);
    expect(descriptionResult[0].name).toEqual('Software Bundle');
  });

  it('should combine multiple filters', async () => {
    // Create test data
    await db.insert(surpriseBoxesTable).values([
      {
        ...testBox1,
        price: testBox1.price.toString()
      },
      {
        ...testBox2,
        price: testBox2.price.toString()
      },
      {
        name: 'Another Hardware Box',
        tagline: 'More hardware',
        description: 'Another hardware description',
        price: '79.99',
        imageUrl: 'https://example.com/hardware2.jpg',
        category: 'Hardware',
        contentsDescription: 'More hardware items',
        stock: 3,
        isActive: true
      }
    ]).execute();

    const input: GetSurpriseBoxesInput = {
      category: 'Hardware',
      search: 'Mystery',
      activeOnly: true
    };

    const result = await getSurpriseBoxes(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Hardware Mystery Box');
    expect(result[0].category).toEqual('Hardware');
  });

  it('should return empty array when no boxes match filters', async () => {
    // Create test data
    await db.insert(surpriseBoxesTable).values([
      {
        ...testBox1,
        price: testBox1.price.toString()
      }
    ]).execute();

    const input: GetSurpriseBoxesInput = {
      category: 'Books',
      activeOnly: true
    };

    const result = await getSurpriseBoxes(input);

    expect(result).toHaveLength(0);
  });

  it('should convert numeric fields correctly', async () => {
    // Create test data
    await db.insert(surpriseBoxesTable).values([
      {
        ...testBox1,
        price: testBox1.price.toString()
      }
    ]).execute();

    const input: GetSurpriseBoxesInput = {
      activeOnly: true
    };

    const result = await getSurpriseBoxes(input);

    expect(result).toHaveLength(1);
    expect(typeof result[0].price).toBe('number');
    expect(result[0].price).toEqual(99.99);
    expect(result[0].stock).toEqual(10);
    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].updatedAt).toBeInstanceOf(Date);
  });
});
