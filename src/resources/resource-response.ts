import { Resources } from './entities/resources.entity';
import { ResourceType } from './enum/resource-type.enum';

export function toResourceResponse(resource: Resources) {
  const base = {
    id: resource.id,
    name: resource.name,
    type: resource.type,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  };

  if (resource.type === ResourceType.OUTSOURCED) {
    return {
      ...base,
      price: resource.price,
      label: resource.label,
      batchNumber: resource.batchNumber,
      vendor: resource.vendor,
    };
  }
  return {
    ...base,
    description: resource.description,
    department: resource.department,
  };
}