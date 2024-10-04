import path from 'path';

// Construct the path to the configuration file in the project's root directory
const configPath = path.resolve(process.cwd(), 'quickgrate.config.js');
const config = await import(configPath);

// Your existing code
import mysql from 'mysql2/promise';

export async function quickgrate() {
    const master = await new mysql.createConnection(config.default.master)
    const slave = await new mysql.createConnection(config.default.slave)

    const changes = process.argv.find(x => x === '--changes');
    const onlyTables = process.argv.find(x => x.startsWith('--tables='));

    let selectedTables = [];
    if (onlyTables) {
        selectedTables = onlyTables.split('=')[1].split(',');
    }

    const [masterVersion] = await master.query('SELECT VERSION()');
    const [slaveVersion] = await slave.query('SELECT VERSION()');

    if (masterVersion[0]['VERSION()'] !== slaveVersion[0]['VERSION()']) {
        console.log(`Warning: master and slave db versions do not match, skipping tables might not work!`);
        console.log(`Master: ${masterVersion[0]['VERSION()']}`);
        console.log(`Slave: ${slaveVersion[0]['VERSION()']}`);
        console.log(`Continuing...`);
    }

    await slave.query('SET foreign_key_checks = 0');

    let [tables] = await master.query('SHOW TABLES');
    let [slaveTables] = await slave.query('SHOW TABLES');

    tables = tables.map(x => Object.values(x)[0]).filter(x => !config.default.tables.do_not_create.includes(x) && (selectedTables.length === 0 || selectedTables.includes(x)));
    slaveTables = slaveTables.map(x => Object.values(x)[0]).filter(x => !config.default.tables.do_not_create.includes(x));

    let percentage = 0;
    for (const [i, table] of tables.entries()) {
        if(selectedTables.length > 0) {
            percentage = Math.floor(i / (selectedTables.length) * 100)
        } else {
            percentage = Math.floor(i / (tables.length - 1) * 100)
        }
        
        let [response] = await master.query('SHOW CREATE TABLE ??', [table]);

        let responseSlave = [];

        for (const [y, slaveTable] of slaveTables.entries()) {
            if (slaveTable === table) {
                [responseSlave] = await slave.query('SHOW CREATE TABLE ??', [table]);
                slaveTables.splice(y, 1);
                break;
            }
        }

        if (changes && responseSlave.length > 0 && normalizedStructure(responseSlave[0]['Create Table']) === normalizedStructure(response[0]['Create Table'])) {
            console.log(`${percentage}% - ${table} skipped`);

            if (percentage === 100) {
                await slave.query('SET foreign_key_checks = 1');
                console.log(`${tables.length} tables were created succsessfully!`)
                process.exit();
            }
            continue;
        } else {
            await slave.query('DROP TABLE IF EXISTS ??', [table]);
        }

        await slave.query(response[0]['Create Table']);

        if (!config.default.tables.do_not_seed.includes(table)) {
            await seed(table);
            console.log(`${percentage}% - ${table} seeded`);
        } else {
            console.log(`${percentage}% - ${table} created`);
        }

        if (percentage === 100) {
            await slave.query('SET foreign_key_checks = 1');
            console.log(`${tables.length} tables were created succsessfully!`)
            process.exit();
        }
    }

    async function seed(table) {
        let [rows] = await master.query({ sql: "SELECT * FROM ?? LIMIT ?", rowsAsArray: true }, [table, config.default.rows_limit]);

        if (rows.length > 0) {
            await slave.query("INSERT INTO ?? VALUES ?", [table, rows]);
        }
    }

    function normalizedStructure(sql) {
        const openingParenthesisIndex = sql.indexOf('(');
        const closingParenthesisIndex = sql.lastIndexOf(')');
        
        if (openingParenthesisIndex === -1 || closingParenthesisIndex === -1 || openingParenthesisIndex > closingParenthesisIndex) {
            throw new Error('Invalid SQL: Unable to find valid table structure.');
        }

        const tableStructurePart = sql.substring(openingParenthesisIndex + 1, closingParenthesisIndex);

        const normalizedStructure = tableStructurePart.trim().replace(/\s+/g, ' ');

        return normalizedStructure;
    }
}