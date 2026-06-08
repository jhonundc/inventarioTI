const sql = require('mssql');
console.log('VarChar type', typeof sql.VarChar, sql.VarChar);
try {
  const t = sql.VarChar(50);
  console.log('VarChar(50) type', typeof t, t && typeof t.validate);
} catch (e) {
  console.log('VarChar(50) threw', e.message);
}
console.log('Date type', typeof sql.Date, sql.Date);
