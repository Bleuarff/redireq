'use strict'

/* UI script */

// TODO:
// - bgscript retrieve configs from locale storage on init
// - show existing confs & handle checkbox
// - delete conf
// - style

// start
console.log('open editor')
const STORAGE_KEY = 'configs'
const configs = JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || []

init()

function init(){
  console.debug(`found ${configs.length} configs stored.`)
  configs.forEach(cfg => {
    addRow(cfg)
  })
  // bind add config button
  document.getElementById('add-btn').addEventListener('click', addConfig)
}

// add button handler: create new config
async function addConfig(e){
  const srcNd = e.currentTarget.parentElement.getElementsByClassName('src')[0],
        src = srcNd.value.trim(),
        destNd = e.currentTarget.parentElement.getElementsByClassName('dest')[0],
        dest = destNd.value.trim()


    // TODO: validate values (via URL?)
   if (src && dest){
     const newConf = { src: src, dest: dest, enabled: true }
     configs.push(newConf)

     // Update background script
     try{
       await browser.runtime.sendMessage(configs)
       // update local storage
       window.localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
       addRow(newConf) // add row to list
       srcNd.value = '' // empty new row fields
       destNd.value = ''
     }
     catch(ex){
       console.error(ex)
       // TODO: show error message
     }
   }
   // TODO: else: bold red border on offender
}

// inserts row in ui, bind controls
function addRow(data = { src: '', dest: '', enabled: true}){
  const nd = document.createElement('div')
  nd.classList.add('row')
  const tmpl = `
    <input type="text" class="src" placeholder="source host" value="${data.src}"></input>
    →
    <input type="text" class="dest" placeholder="destination host" value="${data.dest}"></input>
    <input type="checkbox" ${data.enabled ? 'checked' : ''}><label>Enabled</label>
  `
  nd.innerHTML = tmpl

  const ctnr = document.getElementById('row-ctnr')
  ctnr.appendChild(nd)

}
