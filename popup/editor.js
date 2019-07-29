'use strict'

/* UI script */

// TODO:
// - delete conf
// - handle checkbox
// - edition
// - style
// - icon on button to show how many enabled configs

// start
console.log('open editor')
const STORAGE_KEY = 'configs'
const configs = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')

init()

function init(){
  console.debug(`found ${configs.length} configs stored.`)

  // show all configs
  configs.forEach((cfg, i) => {
    addRow(cfg, i)
  })

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
       addRow(newConf, configs.length - 1) // add row to list
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
function addRow(data = { src: '', dest: '', enabled: true}, idx){
  const nd = document.createElement('div')
  nd.classList.add('row')
  nd.dataset.idx = idx
  const tmpl = `
    <input type="text" class="src" value="${data.src}" disabled placeholder="source host"></input>
    →
    <input type="text" class="dest" value="${data.dest}" disabled placeholder="destination host"></input>
    <input type="checkbox" ${data.enabled ? 'checked' : ''} class="state"><label>Enabled</label>
    <button class="edit">Edit</button>
  `
  nd.innerHTML = tmpl
  nd.getElementsByClassName('edit')[0].addEventListener('click', edit)
  const ctnr = document.getElementById('row-ctnr')
  ctnr.appendChild(nd)

}

// edit/save button handler: make editable or save modifs
function edit(e){
  const srcNd = e.currentTarget.parentElement.getElementsByClassName('src')[0],
        destNd = e.currentTarget.parentElement.getElementsByClassName('dest')[0]

  // checks for class on row block
  if (e.currentTarget.parentElement.classList.contains('edit')){
    // save
    if (srcNd.value && destNd.value){
      const idx = parseInt(e.currentTarget.parentElement.dataset.idx, 10),
            conf = configs[idx]
      conf.src = srcNd.value
      conf.dest = destNd.value
      conf.enabled = !e.currentTarget.parentElement.getElementsByClassName('state')[0].checked

      srcNd.disabled = true
      destNd.disabled = true
      e.currentTarget.innerText = 'Edit'
    }
  }
  else{
    // make editable
    srcNd.disabled = false
    destNd.disabled = false
    srcNd.focus()
    e.currentTarget.innerText = 'Save'
  }
  e.currentTarget.parentElement.classList.toggle('edit')
}
