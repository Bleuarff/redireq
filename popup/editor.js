'use strict'

/* UI script */

const STORAGE_KEY = 'configs'
const configs = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')

init()

function init(){
  configs.sort(sortFunction)
  console.debug(`popup: ${configs.length} configs stored.`)
  document.getElementsByClassName('src')[0].focus()
  refresh()
  document.getElementById('add-btn').addEventListener('click', addConfig)

  document.getElementById('version').innerText = 'v' + browser.runtime.getManifest().version
  refreshHeader()
}

// sort configs by source host, alphabetically
function sortFunction(a, b){
  if (a.src < b.src) return -1
  else if (a.src > b.src) return 1
  else { // if same source, sort by dest
    if (a.dest < b.dest) return -1
    else if (a.dest > b.dest) return 1
    else return 0 // means source and dest are identical, should not happen BTW.
  }
}

// clear container & show all configs
function refresh(){
  const ctnr = document.getElementById('row-ctnr'),
        clone = ctnr.cloneNode(false)

  configs.forEach((cfg, i) => {
    const lastOfGroup = configs[i+1] && cfg.src !== configs[i+1].src // checks if conf if last for host: whether next conf has a different host
    addRow(cfg, i, lastOfGroup, clone)
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

  const validStatus = validateConfig(src, dest)
  if (validStatus){
    showError(getErrorMessage(validStatus))
    if (validStatus > 0)
      return
  }

  const newConf = { src: src, dest: dest, enabled: validStatus === 0 }
  configs.push(newConf)
  configs.sort(sortFunction)

  try{
    await save() // Update background script
    refresh()
    srcNd.value = '' // empty inputs
    destNd.value = ''
    if (validStatus === 0)
      document.getElementById('add-error').classList.add('hidden')
  }
  catch(ex){
    console.error(ex)
    showError('Save error.')
  }

}

// Validation: returns error code
// 0: OK
// 1: missing field
// 2: duplicate rule
// -1: disable rule
function validateConfig(src, dest, idx = -1){
  if (!src || !dest)
    return 1 // Empty field, fail --${!src && !dest ?'s':''}

  // Fail is same rule (source & dest) is already present
  const hasDuplicate = configs.some((x, i) => src === x.src && dest === x.dest && i !== idx)
  if (hasDuplicate)
    return 2 // Duplicate entry, fail

  //  Same source is allowed, but rule is disabled if same source host is already enabled
  const dupSource = configs.some((x, i) => src === x.src && x.enabled && i !== idx)
  if (dupSource)
    return -1

  return 0
}

function getErrorMessage(status){
  let msg
  switch (status){
    case 1: msg = 'Missing field'; break;
    case 2: msg = 'Duplicate rule'; break;
    case -1: msg = 'Rule disabled (duplicate source host)'; break;
  }
  return msg
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

  refreshHeader()
}

// inserts row in ui, bind controls
function addRow(data = { src: '', dest: '', enabled: true}, idx, lastOfGroup = false, parent){
  const nd = document.createElement('tr')
  nd.classList.add('row')
  if (lastOfGroup)
    nd.classList.add('lastOfGroup')
  nd.dataset.idx = idx

  const tmpl = `
    <td>
      <input type="text" class="src" value="" disabled placeholder="source host"></input>
    </td>
    <td class="separator">→</td>
    <td>
      <input type="text" class="dest" value="" disabled placeholder="destination host"></input>
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

  // innerHTML assignment can lead to security issues (HTML injection) if it contains unsanitized user input.
  // No risk here, user input consists only of text field values that are set afterwards.
  nd.innerHTML = tmpl
  nd.getElementsByClassName('src')[0].value = data.src
  nd.getElementsByClassName('dest')[0].value = data.dest
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

  document.getElementById('add-error').classList.add('hidden')

  // checks for class on row block
  if (e.currentTarget.parentElement.parentElement.classList.contains('edit')){
    // save

    // validation
    const validStatus = validateConfig(srcNd.value, destNd.value, idx)
    if (validStatus){
      showError(getErrorMessage(validStatus), 'edit-error')
      if (validStatus > 0) // failure
        return
    }

    const conf = configs[idx]
    conf.src = srcNd.value
    conf.dest = destNd.value
    conf.enabled = (e.currentTarget.parentElement.parentElement.getElementsByClassName('state')[0].dataset.enabled === 'true' && validStatus === 0)

    try{
      await save()

      // revert editing mode
      srcNd.disabled = true
      destNd.disabled = true
      target.dataset.edit = 'false'
      if (validStatus === 0)
        document.getElementById('edit-error').classList.add('hidden')
      refresh()
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

  // source host can only be enabled for one rule; disable other rules.
  if (conf.enabled)
    configs.filter((x, i) => x.src === conf.src && x.enabled && i !== idx).forEach(x => x.enabled = false)

  try{
    await save()
    refresh()
  }
  catch(ex){
    console.log(ex)
  }
}

// show table header only if table is not empty
function refreshHeader(){
  document.getElementsByTagName('thead')[0].classList[configs.length?'remove':'add']('hidden')
}
