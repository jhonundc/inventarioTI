import sql from 'mssql';
console.log('default import', typeof sql, Object.keys(sql).slice(0,10));
console.log('Int type', typeof sql.Int, sql.Int);
console.log('VarChar type', typeof sql.VarChar, sql.VarChar);
console.log('Date type', typeof sql.Date, sql.Date);
