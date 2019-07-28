'use strict'

/* UI script */

// TODO:
// - bgscript retrieve configs from locale storage on init
// - show existing confs & handle checkbox
// - delete conf
// - style

// start
console.log('open editor')
addRow()

const configs = retrieveConfs()

// add new config (handler)
async function addConfig(e){
  let src = e.currentTarget.parentElement.getElementsByClassName('src')[0].value.trim(),
      dest = e.currentTarget.parentElement.getElementsByClassName('dest')[0].value.trim()

    // TODO: validate values (via URL?)
   if (src && dest){
     configs.push({
       src: src, dest: dest
     })
     // TODO: else: bold border on offender
     // TODO: update local storage

     // Update background script
     try{
       await browser.runtime.sendMessage(configs)
     }
     catch(ex){
       console.error(ex)
     }
   }
}

// TODO: get from locale storage
function retrieveConfs(){
  return  []
}

// inserts row in ui, bind controls
function addRow(data){
  const checkOrButton = function(hasData){
    if (hasData)
      return '<input type="checkbox"><label>Enabled</label>'
    else
      return '<button id="add-btn">Add</button>'
  }

  const hasData = !!data
  data = data || {}
  const nd = document.createElement('div')
  nd.classList.add('row')
  const tmpl = `
    <input type="text" class="src" placeholder="source host"></input>
    →
    <input type="text" class="dest" placeholder="destination host"></input>
    ${checkOrButton(hasData)}
  `
  nd.innerHTML = tmpl

  const ctnr = document.getElementById('row-ctnr')
  ctnr.appendChild(nd)
  document.getElementById('add-btn').addEventListener('click', addConfig)
}
