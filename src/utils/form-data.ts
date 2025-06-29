/**
 * Flattens a nested object into a flat structure suitable for form data
 * Example: { user: { name: "John" } } becomes { "user.name": "John" }
 */
export function flattenFormData(
  obj: Record<string, unknown>, 
  prefix = ''
): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value === null || value === undefined) {
      return; // Skip null/undefined values
    }
    
    if (Array.isArray(value)) {
      // Handle arrays with indexed keys: array[0], array[1], etc.
      value.forEach((item, index) => {
        const arrayKey = `${newKey}[${index}]`;
        if (typeof item === 'object' && item !== null) {
          Object.assign(flattened, flattenFormData({ [arrayKey]: item }));
        } else {
          flattened[arrayKey] = item;
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenFormData(value as Record<string, unknown>, newKey));
    } else {
      flattened[newKey] = value;
    }
  });
  
  return flattened;
}

/**
 * Encodes data for application/x-www-form-urlencoded format
 */
export function encodeFormData(data: unknown): URLSearchParams {
  if (!data || typeof data !== 'object') {
    return new URLSearchParams();
  }
  
  const formData = new URLSearchParams();
  const flatData = flattenFormData(data as Record<string, unknown>);
  
  Object.entries(flatData).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      // Convert booleans to strings
      const stringValue = typeof value === 'boolean' ? String(value) : String(value);
      formData.append(key, stringValue);
    }
  });
  
  return formData;
}

/**
 * Handles special cases for Magic Auth API
 */
export function prepareMagicAuthData(data: Record<string, unknown>): Record<string, unknown> {
  const prepared = { ...data };
  
  // Handle specific Magic Auth API requirements
  if ('assigned_project_ids' in prepared && Array.isArray(prepared.assigned_project_ids)) {
    // Convert to project_ids[] format expected by API
    const projectIds = prepared.assigned_project_ids;
    delete prepared.assigned_project_ids;
    projectIds.forEach((id, index) => {
      prepared[`assigned_project_ids[${index}]`] = id;
    });
  }
  
  return prepared;
} 