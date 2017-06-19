## Dev Setup

In addition to the usual `npm install` ritual, you'll need
to do the following steps:

### MySQL

```
brew install mysql
brew services start mysql
```

After installing and starting mysql, you can connect to the
database with

```
msyql -uroot -p
```

The password is **blank**—just press `enter`.

### Peer dependencies

You'll also need to clone
https://github.com/benchristel/supercrawler into a sibling
of this project's directory, so that the `package.json`
can reference it by relative path. You'll also need to
checkout the `ben` branch of the supercrawler project.

```
git clone https://github.com/benchristel/supercrawler
cd supercrawler
git checkout ben
```

## Usage

Run the crawler with

```
node main.js
```

This will start shoveling URLs into the `urls` table of
the `crawler` mysql database.
