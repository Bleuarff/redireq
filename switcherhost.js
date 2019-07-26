'use strict'

// hosts redirections
const mapping = {
  '//news.ycombinator.com': '//www.discoverdev.io'
}
const sources = Object.keys(mapping)

function logURL(details){
  for (let i = 0; i < sources.length; i++){
    const src = sources[i]
    if (details.url.indexOf(src) > -1){
      const newUrl = details.url.replace(src, mapping[src])
      console.log(`${Date.now()} ${details.url} -> ${newUrl}`)
      return {
        redirectUrl: newUrl
      }
    }
  }
}

function start(){
  console.log(Date.now() + ' Switcherhost start...')
  browser.webRequest.onBeforeRequest.addListener(
    logURL,
    {urls: ['<all_urls>']},
    ["blocking"]
  )
}

start()
