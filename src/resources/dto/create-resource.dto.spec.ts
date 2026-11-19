import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateResourceDto } from './create-resource.dto';
import { ResourceType } from '../enum/resource-type.enum';

describe('CreateResourceDto', () => {
  it('accepts fields for the selected resource type', async () => {
    const insourced = plainToInstance(CreateResourceDto, {
      type: ResourceType.INSOURCED,
      name: 'Office laptop',
      description: 'Existing inventory',
      departmentName: 'Computing',
      quantity: 1,
      price: '',
      label: '',
      batchNumber: '',
      vendor: '',
    });
    const outsourced = plainToInstance(CreateResourceDto, {
      type: ResourceType.OUTSOURCED,
      name: 'Office laptop',
      price: 1250.5,
      label: 'Dell Latitude 5450',
      batchNumber: 'LOT-2026-04',
      vendor: 'Example Supplies Ltd',
      quantity: 3,
    });

    await expect(validate(insourced)).resolves.toHaveLength(0);
    await expect(validate(outsourced)).resolves.toHaveLength(0);
  });

  it('rejects missing selected-type fields and fields from the other type', async () => {
    const missingOutsourcedFields = plainToInstance(CreateResourceDto, {
      type: ResourceType.OUTSOURCED,
      name: 'Office laptop',
      quantity: 1,
    });
    const mixedTypes = plainToInstance(CreateResourceDto, {
      type: ResourceType.INSOURCED,
      name: 'Office laptop',
      description: 'Existing inventory',
      departmentName: 'Computing',
      price: 1250.5,
      quantity: 1,
    });

    await expect(validate(missingOutsourcedFields)).resolves.not.toHaveLength(0);
    await expect(validate(mixedTypes)).resolves.not.toHaveLength(0);
  });

  it('rejects other-type fields when they contain values', async () => {
    const insourcedWithPrice = plainToInstance(CreateResourceDto, {
      type: ResourceType.INSOURCED,
      name: 'Office laptop',
      description: 'Existing inventory',
      departmentName: 'Computing',
      price: 1250,
      quantity: 1,
    });

    const errors = await validate(insourcedWithPrice);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'type',
          constraints: expect.objectContaining({
            resourceFieldsMatchType:
              'Fields price are not allowed for insourced resources.',
          }),
        }),
      ]),
    );
  });
});
