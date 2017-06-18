## Dev Setup

In addition to the usual `npm install` ritual, you'll need
to do the following steps:

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

You'll also need to clone
https://github.com/benchristel/supercrawler into a sibling
of this project's directory, so that the `package.json`
can reference it by relative path.
