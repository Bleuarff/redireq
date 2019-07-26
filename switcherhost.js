'use strict'

// hosts redirections
const mapping = {
  '//news.ycombinator.com': '//www.discoverdev.io'
}

const sources = Object.keys(mapping)

// handler when a request matches the url filter.
// looks for host to replace, build new url and return
function redirect(details){
  let newUrl

  for (let i = 0; i < sources.length; i++){
    const src = sources[i]
    if (details.url.indexOf(src) > -1){
      newUrl = details.url.replace(src, mapping[src])
      break
    }
  }

  if (newUrl){
    console.log(`${Date.now()} ${details.url} -> ${newUrl}`)
    return {
      redirectUrl: newUrl
    }
  }
}

function start(){
  console.log(Date.now() + ' Switcherhost start...')

  // build filter list for source hosts, so as to not watchvor every request
  const urlFilter = sources.map(x => '*:' + x + '/*')

  browser.webRequest.onBeforeRequest.addListener(
    redirect,
    {urls: urlFilter},
    ["blocking"]
  )
}

// function stop(){
//   console.log(Date.now() + ' stop.')
//
//   const bound = browser.webRequest.onBeforeRequest.hasListener(start)
//   console.log('listener bound: ' + bound)
//
//   browser.webRequest.onBeforeRequest.removeListener(start)
//
//   bound = browser.webRequest.onBeforeRequest.hasListener(start)
//   console.log('listener bound: ' + bound)
// }

start()
