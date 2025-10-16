//path: backend/src/utils/numberGenerator.ts

export const generateEntryNumber = async (prefix: string): Promise<string> => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};