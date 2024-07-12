export default {
    master: {
        host: "127.0.0.1",
        port: "3306",
        user: "user",
        password: "pass",
        database: "production",
    },
    slave: {
        host: "127.0.0.1",
        port: "3306",
        user: "user",
        password: "pass",
        database: "development"
    },
    rows_limit: 25000,
    tables: {
        do_not_create: [],
        do_not_seed: []
    }
}