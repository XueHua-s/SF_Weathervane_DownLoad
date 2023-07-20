const cheerio = require('cheerio')
const request = require('./request')
const path = require('path')
const fs = require('fs')
const getStore = async () => {
  try {
    const { data } = await request.get('')
    // console.log(data)
    const $ = cheerio.load(data)
    const content = $(".story-list .pic>a")
    // 获取风向标列表
    const books = []
    console.log('开始获取风向标书本列表')
    content.each(function () {
      books.push({
        url: $(this).attr('href'),
        name: $(this).find('img').attr('alt'),
        img: $(this).find('img').attr('data-original')
      })
    })
    const getAllBooksChapters = []
    // 获取书本内容
    console.log('开始获取书本章节')
    fs.mkdir('books', (err) => {
    })
    for (const book of books) {
      getAllBooksChapters.push(request.get(book.url + '/MainIndex/').then(({data}) => {
        const $ = cheerio.load(data)
        const chapters = $('.clearfix>li')
        const chaptersJSON = []
        chapters.each(function () {
          // 不爬取vip章节
          const bookTextUrl = $(this).find('a').attr('href')
          const title = $(this).find('a').attr('title')
          if (bookTextUrl.indexOf('vip') === -1 && title) {
            chaptersJSON.push({
              title: $(this).find('a').attr('title'),
              contentUrl: bookTextUrl
            })
          }
        })
        book.chapters = chaptersJSON
      }))
    }
    Promise.all(getAllBooksChapters).then(async () => {
      console.log('获取章节成功')
      console.log('开始获取章节内容')
      for (const book of books) {
        console.log(`开始获取${book.name}章节内容`)
        for (const chapter of book.chapters) {
          console.log(`开始获取${chapter.title}内容`)
          await request.get(chapter.contentUrl).then(({data}) => {
            if (data) {
              const $ = cheerio.load(data)
              const content = $('#ChapterBody.article-content')
              const text = content.text()
              // content.each(function () {
              //   text += $(this).html()
              //   // console.log(text)
              // })
              // console.log(text)
              fs.mkdir(`books/${book.name}`, (err) => {
              })
              console.log(`开始写入books/${book.name}/${chapter.title}.txt`)
              fs.writeFile(`books/${book.name}/${chapter.title}.txt`, text, 'utf8', () => {
                // console.log(content.length)
              })
            }
          })
          console.log()
        }
      }
    })
  } catch (err) {
    // console.log('爬取完成')
    console.log(err)
    throw new Error('爬取首页错误')
  }
}
getStore()
