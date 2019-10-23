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
class Redireq{
  constructor(){
    this.mapping = null // [{src: dest}] mapping
    this.sources = null // array of source hosts
    const STORAGE_KEY = 'configs'

    // retrieve from storage & transform to internal format
    const configs = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    this.updateConfigs(configs)
    console.debug(`found ${Object.keys(this.mapping).length} configs stored.`)

    browser.browserAction.setBadgeTextColor({color: 'white'})
    browser.browserAction.setBadgeBackgroundColor({color: '#666666'})
  }

  start(){
    this.updateBadge()

    if (this.sources.length === 0){
      console.debug('Redireq start: no host to redirect, cancel.')
      return
    }

    console.log(Date.now() + ` Redireq start: ${this.sources.length} host${this.sources.length > 1 ? 's': ''}`)

    // build hosts list filter from sources, so as to not watch for every request
    const urlFilter = this.buildHostList()
    // console.log('filter: ' + urlFilter)

    browser.webRequest.onHeadersReceived.addListener(
      redirect,
      {urls: urlFilter},
      ['blocking']
    )
  }

  // overwrite configs with provided data, stops listener & reattach it
  restart(configs){
    try{
      this.updateConfigs(configs)
      const bound = browser.webRequest.onHeadersReceived.hasListener(redirect)
      if (bound){
        browser.webRequest.onHeadersReceived.removeListener(redirect)
      }
      this.start()
    }
    catch(ex){
      console.log(ex)
    }
  }

  // updates mapping from [{src, dest, enabled}] array of objects
  updateConfigs(configs){
    const mapping = {}
    configs.filter(x => x.enabled).forEach(({src, dest}) => {
      mapping['//' + src] = '//' + dest
    })
    this.mapping = mapping
    this.sources = Object.keys(this.mapping)
  }

  updateBadge(){
    const count = this.sources.length
    browser.browserAction.setBadgeText({text: count ? count.toString() : ''})
  }

  // parse source list items to get only the host part to build filter list
  buildHostList(){
    const hosts = this.sources.reduce((hosts, src) => {
      try{
        const uri = new URL(`https://${src}`)
        hosts.push(`*://${uri.host}/*`)
      }
      catch(ex){ // can't parse, don't add to list
        console.log('error parsing ' + src)
      }
      return hosts
    }, [])

    return hosts
  }
}

const swh = new Redireq()
swh.start()
browser.runtime.onMessage.addListener(data => {swh.restart(data)})
