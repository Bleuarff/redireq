'use strict'

// handles binding onBeforeRequest & redirections
class Switcherhost{
  constructor(){
    // hosts redirections
    this.mapping = {
      '//news.ycombinator.com': '//www.discoverdev.io'
    }
    this.sources = Object.keys(this.mapping)
  }


  // handler when a request matches the url filter.
  // looks for host to replace, build new url and return
  redirect(details){
    let newUrl

    for (let i = 0; i < this.sources.length; i++){
      const src = this.sources[i]
      if (details.url.indexOf(src) > -1){
        newUrl = details.url.replace(src, this.mapping[src])
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

  start(){
    console.log(Date.now() + ' Switcherhost start...')

    // build filter list for source hosts, so as to not watch for every request
    const urlFilter = this.sources.map(x => '*:' + x + '/*')

    browser.webRequest.onBeforeRequest.addListener(
      (details) => {return this.redirect(details)},
      {urls: urlFilter},
      ["blocking"]
    )
  }

  // stop(){
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
}

const swh = new Switcherhost()
swh.start()
