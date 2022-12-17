# Quickgrate
## A fast and easy way to copy and seed one MySQL database to another 

### What does it do?
Quickgrate copies table stuctures and table contents from a master database to a slave database. I use it in order to have production data in my dev environments for real world testing purposes. **Be careful, it deletes existing tables on slave!**

### Installation

Install the package

```sh
npm install @tibormarias/quickgrate --save-dev
```

Create a file named **quickgrate.config.js** in your project's root directory with the following structure
```sh
module.exports = {
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
```

### Running the script
```
npx quickgrate
```

## Development

Want to contribute? I am grateful for any contribution, feel free to code it or message me!