var supercrawler = require("@benchristel/supercrawler")
var cheerio = require('cheerio')

var crawler = new supercrawler.Crawler({
  // By default, Supercrawler uses a simple
  // FIFO queue, which doesn't support
  // retries or memory of rawl state. For
  // any non-trivial crawl, you should
  // create a database. Provide your database
  // config to the constructor of DbUrlList.
  //
  urlList: new supercrawler.DbUrlList({
    db: {
      database: "crawler",
      username: "root",
      password: '',
      sequelizeOpts: {
        dialect: "mysql",
        host: "localhost"
      }
    }
  }),

  interval: 1000, // ms
  concurrentRequestsLimit: 5,

  // Time (ms) to cache the results of robots.txt queries.
  robotsCacheTime: 3600000,

  // Query string to use during the crawl.
  userAgent: "Mozilla/5.0 (compatible; supercrawler/1.0; +https://github.com/brendonboshell/supercrawler)"
})

// Get "Sitemaps:" directives from robots.txt
// crawler.addHandler(supercrawler.handlers.robotsParser())

// Crawl sitemap files and extract their URLs.
// crawler.addHandler(supercrawler.handlers.sitemapsParser())

// Pick up <a href> links from HTML documents
crawler.addHandler("text/html", supercrawler.handlers.htmlLinkParser({
  // Optional: restrict queued links to certain hostnames:
  // hostnames: ["example.com"]
  excludedHostnames: ['twitter.com', 'facebook.com', 'google.com', 'github.com', 'amazon.com']
}))

// Custom content handler for HTML pages.
crawler.addHandler("text/html", function (context) {
  var $ = cheerio.load(context.body)
  console.log("Processed", $('title').text())
})

// .insertIfNotExists(new supercrawler.Url("http://uea.ac.uk/"))

crawler.getUrlList()
  .insertIfNotExists(new supercrawler.Url("http://zompist.com"))
  .then(function() {
    return crawler.getUrlList().insertIfNotExists(new supercrawler.Url("http://www2.cmp.uea.ac.uk/~jrk/conlang.html"))
  })
  .then(function () {
    console.log('started')
    return crawler.start();
  });
