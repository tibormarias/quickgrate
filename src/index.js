const mysql = require('mysql2/promise');
const config = require(process.cwd() + '/quickgrate.config.js');

export async function quickgrate() {
    const master = await new mysql.createConnection(config.master)
    const slave = await new mysql.createConnection(config.slave)

    await slave.query('SET foreign_key_checks = 0');

    let [tables] = await master.query('SHOW TABLES');
    tables = tables.map(x => Object.values(x)[0]).filter(x => !config.tables.do_not_create.includes(x));
    
    let percentage = 0;
    for (const [i, table] of tables.entries()) {
        percentage = Math.floor(i / (tables.length - 1) * 100)
        await slave.query('DROP TABLE IF EXISTS ??', [table]);

        let [response] = await master.query('SHOW CREATE TABLE ??', [table]);
        await slave.query(response[0]['Create Table']);

        if (!config.tables.do_not_seed.includes(table)) {
            await seed(table);
            console.log(`${percentage}% - ${table} seeded`);
        } else {
            console.log(`${percentage}% - ${table} created`);
        }

        if (i === tables.length - 1) {
            await slave.query('SET foreign_key_checks = 1');
            console.log(`${tables.length} tables were created succsessfully!`)
            process.exit();
        }
    }

    async function seed(table) {
        let [rows] = await master.query({ sql: "SELECT * FROM ?? LIMIT ?", rowsAsArray: true }, [table, config.rows_limit]);

        if (rows.length > 0) {
            await slave.query("INSERT INTO ?? VALUES ?", [table, rows]);
        }
    }
}