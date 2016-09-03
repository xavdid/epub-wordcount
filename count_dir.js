const wc = require('./wc')

// const title = 'Cline - Ready Player One (2011).epub'
// const title = 'Rothfuss - The Name of the Wind (2007).epub'
const title2 = 'Gaiman - American Gods (2002).epub'
// // const title = 'Priest - The Adjacent (2013).epub'
// let p = `/Users/david/Dropbox/Ebooks/Singles/${title}`
// countWords(p)

const title = 'Priest - The Adjacent (2013).epub'
const p = `/Users/david/Dropbox/Ebooks/Singles/${title}`
const p2 = `/Users/david/Dropbox/Ebooks/Singles/${title2}`
wc(p, {print: false}).then((res) => console.log('res', res))
wc(p2, {print: true})
