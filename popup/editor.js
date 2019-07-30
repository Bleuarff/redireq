'use strict'

/* UI script */

// TODO:
// - style
// - icon in address bar for redirected urls (page action)

const STORAGE_KEY = 'configs'
const configs = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')

init()

function init(){
  console.debug(`popup: ${configs.length} configs stored.`)
  refresh()
  document.getElementById('add-btn').addEventListener('click', addConfig)
}

// clear container & show all configs
function refresh(){
  const ctnr = document.getElementById('row-ctnr'),
        clone = ctnr.cloneNode(false)

  configs.forEach((cfg, i) => {
    addRow(cfg, i, clone)
  })

  ctnr.parentElement.replaceChild(clone, ctnr)
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

     try{
       await save() // Update background script
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

// saves state
async function save(){
  await browser.runtime.sendMessage(configs) // update bg script
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(configs)) // update local storage
}

// inserts row in ui, bind controls
function addRow(data = { src: '', dest: '', enabled: true}, idx, parent){
  const nd = document.createElement('div')
  nd.classList.add('row')
  nd.dataset.idx = idx
  const tmpl = `
    <input type="text" class="src" value="${data.src}" disabled placeholder="source host"></input>
    →
    <input type="text" class="dest" value="${data.dest}" disabled placeholder="destination host"></input>
    <button class="edit">Edit</button>
    <input type="checkbox" id="row-${idx}"class="state" ${data.enabled ? 'checked' : ''}><label for="row-${idx}">Enabled</label>

  `
  nd.innerHTML = tmpl
  nd.getElementsByClassName('edit')[0].addEventListener('click', edit)
  nd.getElementsByClassName('state')[0].addEventListener('click', toggleEnable)

  parent = parent || document.getElementById('row-ctnr')
  parent.appendChild(nd)

}

// edit/save button handler: make editable or save modifs
async function edit(e){
  const srcNd = e.currentTarget.parentElement.getElementsByClassName('src')[0],
        destNd = e.currentTarget.parentElement.getElementsByClassName('dest')[0],
        target = e.currentTarget,
        idx = parseInt(target.parentElement.dataset.idx, 10)

  // checks for class on row block
  if (e.currentTarget.parentElement.classList.contains('edit')){
    // save
    // TODO: more validation? tryparse?
    if (srcNd.value && destNd.value){
      const conf = configs[idx]
      conf.src = srcNd.value
      conf.dest = destNd.value
      conf.enabled = !!e.currentTarget.parentElement.getElementsByClassName('state')[0].checked

      try{
        await save()

        // revert editing mode
        srcNd.disabled = true
        destNd.disabled = true
        target.innerText = 'Edit'
        const delNd = target.parentElement.lastElementChild
        target.parentElement.removeChild(delNd)

      }catch(ex){
        // TODO: show error
        console.error(ex)
      }
    }
  }
  else{
    // make editable
    srcNd.disabled = false
    destNd.disabled = false
    srcNd.focus()
    target.innerText = 'Save'

    // add delete button
    const delNd = document.createElement('button')
    delNd.classList.add('delete')
    delNd.innerHTML = 'X'
    delNd.addEventListener('click', deleteConfig)
    target.parentElement.appendChild(delNd)
  }
  target.parentElement.classList.toggle('edit')
}

// delete button handler
async function deleteConfig(e){
  const idx = parseInt(e.currentTarget.parentElement.dataset.idx, 10)
  try{
    configs.splice(idx, 1)
    await save()
    refresh()
  }
  catch(ex){
    console.error(ex)
  }

}

// checkbox change handler: update state
async function toggleEnable(e){
  const idx = parseInt(e.currentTarget.parentElement.dataset.idx, 10),
        conf = configs[idx],
        enabled = e.currentTarget.checked

  conf.enabled = enabled
  try{
    await save()
  }
  catch(ex){
    console.log(ex)
  }
}
