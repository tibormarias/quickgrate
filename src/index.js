import { createConnection } from 'mysql2';
const config = require('../../../../quickgrate.json')

export async function quickgrate() {
    const master = createConnection(config.master);
    const slave = createConnection(config.slave);

    await slave.promise().query('SET foreign_key_checks = 0');

    let [rows] = await master.promise().query('SELECT table_name FROM information_schema.tables WHERE table_schema = "'+config.master.database+'" order by table_name asc');
    let k = 0;
    let tables = rows.map(x => x.table_name)
    let length = tables.length - config.tables.do_not_create.length - config.tables.do_not_seed.length;

    for (let i = 0; i < tables.length; i++) {
        if (config.tables.do_not_seed.includes(tables[i])) { continue; }

        await slave.promise().query("DROP TABLE IF EXISTS `" + tables[i] + "`");

        let [response] = await master.promise().query('SHOW CREATE TABLE ' + tables[i]);

        slave.query(response[0]['Create Table'], async () => {
            if (!config.tables.do_not_seed.includes(tables[i])) {
                await seed(tables[i]);

                k++;
                console.log(Number((k / length) * 100).toFixed(0) + '% seeded: ' + tables[i])

                if (k == length) {
                    await slave.promise().query('SET foreign_key_checks = 1');
                    process.exit();
                }
            }
        })
    }

    async function seed(table) {
        let [rows] = await master.promise().query("SELECT * FROM `" + table + "` LIMIT "+config.rows_limit);

        let outer = [];
        for await (let data of rows) {
            let inner = []
            for (let i in data) {
                inner.push(data[i]);
            }
            outer.push(inner);
        }

        if (outer.length > 0) {
            await slave.promise().query("INSERT INTO `" + table + "` VALUES ?", [outer]);
        }
    }
}