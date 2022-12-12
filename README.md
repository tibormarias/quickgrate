# Quickgrate
## A fast and easy mysqldump NodeJS alternative 

### Installation

Install the package

```sh
npm install @tibormarias/quickgrate --save-dev
```

Create a file named quickgrate.json in your project's root directory with the following structure
```sh
{
    "master": {
        "host": "127.55.55.1",
        "port": "3306",
        "user": "root",
        "password": "secret",
        "database": "prod"
    },
    "slave": {
        "host": "127.55.55.1",
        "port": "3306",
        "user": "root",
        "password": "secret",
        "database": "prod"
    },
    "rows_limit": 25000,
    "tables": {
        "do_not_create": [],
        "do_not_seed": []
    }
}
```

### Running the script
```
npx quickgrate
```

## Development

Want to contribute? I am grateful for any contribution!


