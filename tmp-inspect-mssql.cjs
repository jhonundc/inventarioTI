const sql = require('mssql');
console.log('VarChar type', typeof sql.VarChar, sql.VarChar);
try {
  const t = sql.VarChar(50);
  console.log('VarChar(50) type', typeof t);
  console.log('VarChar(50) keys', Object.keys(t));
  console.log('VarChar(50) hasOwnProperty validate', Object.prototype.hasOwnProperty.call(t, 'validate'));
  console.log('VarChar(50) validate', t.validate);
  console.log('VarChar(50) prototype validate', Object.getPrototypeOf(t)?.validate);
  console.log('VarChar(50) proto keys', Object.getOwnPropertyNames(Object.getPrototypeOf(t) || {}));
} catch (e) {
  console.log('VarChar(50) threw', e.message);
}
console.log('Date type', typeof sql.Date, sql.Date);
