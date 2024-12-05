function convertBigIntToString(obj) {
    if (obj === null || typeof obj !== 'object') {
      if (typeof obj === 'bigint') {
        return obj.toString();
      }
      return obj;
    }
  
    if (Array.isArray(obj)) {
      return obj.map(item => convertBigIntToString(item));
    }
  
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertBigIntToString(value);
    }
  
    return result;
  }
  
  module.exports = { convertBigIntToString };
  