var supercrawler = require("@benchristel/supercrawler")
var cheerio = require('cheerio')
var languageDetector = new (require('languagedetect'))
var url = require('url')
var excludedHostnames = require('./excludedHostnames')

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

// Pick up <a href> links from HTML documents
crawler.addHandler("text/html",
  JudgementalLinkParser({
    judges:
      [ isThisEvenEnglish
      , isThisEvenHtml
      , isThisAnEduDomain
      , isThereTooMuchCss
      , isThereTooMuchJavaScript
      ],
    minRating: 0,
    parser: supercrawler.handlers.htmlLinkParser({
      excludedHostnames: excludedHostnames
    })
  }))

// Custom content handler for HTML pages.
crawler.addHandler("text/html", function (page) {
  page.$ = page.$ || cheerio.load(page.body)
  var $ = page.$
  console.log("Processed", $('title').text())
})

crawler.getUrlList()
  .insertIfNotExists(new supercrawler.Url("http://www2.cmp.uea.ac.uk/~jrk/conlang.html"))
  .then(function() {
    return crawler.getUrlList().insertIfNotExists(new supercrawler.Url("http://zompist.com"))
  })
  .then(function () {
    console.log('started')
    return crawler.start();
  });

function isThisEvenEnglish(page) {
  page.$ = page.$ || cheerio.load(page.body)
  var text = page.$('body').text()

  var mostLikelyLanguage = languageDetector.detect(text, 1)[0]
  if (mostLikelyLanguage && mostLikelyLanguage[0] === 'english') {
    return 0
  } else {
    return -Infinity
  }
}

function isThisEvenHtml(page) {
  var score = 0
  if (/\.html?\??#?$/.test(page.url)) {
    score += 32000
  } else if (/\....?\??#?$/.test(url.parse(page.url)).pathname) {
    score -= 64000
  }
  page.$ = page.$ || cheerio.load(page.body)
  var paragraphs = page.$('p').length
  if (paragraphs.length < 100) {
    score += paragraphs * 256
  } else {
    score += 25600
  }

  console.log('html score:', score)

  return score
}

function isThisAnEduDomain(page) {
  if (/\.edu$/.test(url.parse(page.url).hostname)) {
    console.log('edu score: ', 64000)
    return 64000
  } else {
    return 0
  }
}

function isThereTooMuchJavaScript(page) {
  page.$ = page.$ || cheerio.load(page.body)
  var score = 0

  var scripts = page.$('script[src]')
  score += scripts.length * -6000

  scripts = page.$('script:not([src])')
  scripts.each(function(i, script) {
    score -= page.$(script).text().length
  })

  console.log('javascript score: ', score)

  return score
}

function isThereTooMuchCss(page) {
  page.$ = page.$ || cheerio.load(page.body)
  var styles = page.$('link[rel=stylesheet]')
  var score = styles.length * -17000
  console.log('css score: ', score)
  return score
}

function JudgementalLinkParser(opts) {
  var parser    = opts.parser
  var minRating = opts.minRating
  var judges    = opts.judges

  return function(pageData) {
    if (isWorthy(pageData)) {
      return parser(pageData)
    }
    return []
  }

  function isWorthy(pageData) {
    var rating = judges
      .map(judge => judge(pageData))
      .reduce(add, 0)

    if (rating >= minRating) {
      console.log('=== good (' + rating + '): ', pageData.url)
    } else {
      console.log('<<< bad  (' + rating + '): ', pageData.url)
    }

    return rating >= minRating
  }

  function add(a, b) {
    return a + b
  }
}
