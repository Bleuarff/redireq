function logURL(details){
  console.log('test: before request')
}

browser.webRequest.onBeforeRequest.addListener(
  logURL,
  {urls: ['https*://*']}
)

console.log('Switcherhost start...')
