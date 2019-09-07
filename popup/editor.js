'use strict'

/* UI script */

const STORAGE_KEY = 'configs'
const configs = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')

init()

function init(){
  console.debug(`popup: ${configs.length} configs stored.`)
  document.getElementsByClassName('src')[0].focus()
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

    srcNd.focus()

    const err = validateConfig(src, dest)
    if (err){
      showError(err)
      return
    }

   const newConf = { src: src, dest: dest, enabled: true }
   configs.push(newConf)

   try{
     await save() // Update background script
     addRow(newConf, configs.length - 1) // add row to table
     srcNd.value = '' // empty inputs
     destNd.value = ''
     document.getElementById('add-error').classList.add('hidden')
   }
   catch(ex){
     console.error(ex)
     showError('Save error.')
   }

}

// Validation: returns an error message or nothing
function validateConfig(src, dest, idx = -1){
  if (!src || !dest)
    return `Empty field${!src && !dest ?'s':''}.`

  // check duplicate source: if new conf or if existing conf w/ changed source value (otherwise matches itself).
  if ((idx === -1 || idx !== -1 && src !== configs[idx].src) && configs.some(cfg => src === cfg.src))
    return 'Duplicate source host.'

  return null
}

// show given error message in given node id
function showError(msg, id = 'add-error'){
  const errNd = document.getElementById(id)
  errNd.innerText = msg
  errNd.classList.remove('hidden')
}

// saves state
async function save(){
  await browser.runtime.sendMessage(configs) // update bg script
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(configs)) // update local storage
}

// inserts row in ui, bind controls
function addRow(data = { src: '', dest: '', enabled: true}, idx, parent){
  const nd = document.createElement('tr')
  nd.classList.add('row')
  nd.dataset.idx = idx
  const tmpl = `
    <td>
      <input type="text" class="src" value="${data.src}" disabled placeholder="source host"></input>
    </td>
    <td class="separator">→</td>
    <td>
      <input type="text" class="dest" value="${data.dest}" disabled placeholder="destination host"></input>
    </td>
    <td class="action">
      <span class="edit picto" title="edit/save">&#9998;</span>
    </td>
    <td class="action">
      <span id="row-${idx}" class="state picto" data-enabled="${data.enabled ? 'true' : 'false'}" title="enable/disable">✓</span>
    </td>
    <td class="action">
      <span class="delete picto" title="delete">&#x2715;</span>
    </td>
  `
  nd.innerHTML = tmpl
  nd.getElementsByClassName('edit')[0].addEventListener('click', edit)
  nd.getElementsByClassName('state')[0].addEventListener('click', toggleEnable)
  nd.getElementsByClassName('delete')[0].addEventListener('click', deleteConfig)

  parent = parent || document.getElementById('row-ctnr')
  parent.appendChild(nd)

}

// edit/save button handler: make editable or save modifs
async function edit(e){
  const srcNd = e.currentTarget.parentElement.parentElement.getElementsByClassName('src')[0],
        destNd = e.currentTarget.parentElement.parentElement.getElementsByClassName('dest')[0],
        target = e.currentTarget,
        idx = parseInt(target.parentElement.parentElement.dataset.idx, 10)

  // checks for class on row block
  if (e.currentTarget.parentElement.parentElement.classList.contains('edit')){
    // save

    // validation
    const err = validateConfig(srcNd.value, destNd.value, idx)
    if (err){
      showError(err, 'edit-error')
      return
    }

    const conf = configs[idx]
    conf.src = srcNd.value
    conf.dest = destNd.value
    conf.enabled = (e.currentTarget.parentElement.parentElement.getElementsByClassName('state')[0].dataset.enabled === 'true')

    try{
      await save()

      // revert editing mode
      srcNd.disabled = true
      destNd.disabled = true
      target.dataset.edit = 'false'
      document.getElementById('edit-error').classList.add('hidden')
    }
    catch(ex){
      console.error(ex)
      showError('Save error.', 'edit-error')
    }
  }
  else{
    // make editable
    srcNd.disabled = false
    destNd.disabled = false
    srcNd.focus()
    target.dataset.edit = 'true'
  }
  target.parentElement.parentElement.classList.toggle('edit')
}

// delete button handler
async function deleteConfig(e){
  const idx = parseInt(e.currentTarget.parentElement.parentElement.dataset.idx, 10)
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
  const idx = parseInt(e.currentTarget.parentElement.parentElement.dataset.idx, 10),
        conf = configs[idx],
        enabled = !(e.currentTarget.dataset.enabled === 'true') // click event changes the state

  // set new state
  conf.enabled = enabled
  e.currentTarget.dataset.enabled = enabled
  try{
    await save()
  }
  catch(ex){
    console.log(ex)
  }
}
