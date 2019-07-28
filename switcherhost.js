'use strict'

// handler when a request matches the url filter.
// looks for host to replace, build new url and return.
// outside of class so that there's no issue with `this` ref when calling it
function redirect(details){
  let newUrl

  for (let i = 0; i < swh.sources.length; i++){
    const src = swh.sources[i]
    if (details.url.indexOf(src) > -1){
      newUrl = details.url.replace(src, swh.mapping[src])
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

// handles binding onBeforeRequest & redirections
class Switcherhost{
  constructor(){
    // hosts redirections
    this.mapping = {
      // '//news.ycombinator.com': '//www.discoverdev.io'
      // '//coin.fr': '//www.pouet.com'
    }
    this.sources = Object.keys(this.mapping)
  }

  start(){
    if (this.sources.length === 0){
      console.log('no host to redirect')
      return
    }

    console.log(Date.now() + ' Switcherhost start...')
    console.log(this.mapping)

    // build filter list for source hosts, so as to not watch for every request
    const urlFilter = this.sources.map(x => '*:' + x + '/*')

    browser.webRequest.onBeforeRequest.addListener(
      redirect,
      {urls: urlFilter},
      ["blocking"]
    )
  }

  // overwrite configs with provided data, stops listener & reattach it
  restart(configs){
    try{
      this.updateConfigs(configs)
      const bound = browser.webRequest.onBeforeRequest.hasListener(redirect)
      if (bound){
        browser.webRequest.onBeforeRequest.removeListener(redirect)
        console.debug('stop listener')
      }
      this.start()
    }
    catch(ex){
      console.log(ex)
    }
  }

  updateConfigs(configs){
    const mapping = {}
    configs.forEach(({src, dest}) => {
      mapping['//' + src] = '//' + dest
    })
    this.mapping = mapping
    this.sources = Object.keys(this.mapping)
  }
}

const swh = new Switcherhost()
swh.start()
browser.runtime.onMessage.addListener(data => {swh.restart(data)})
