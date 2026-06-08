let balance = 1000
let bet = 10

async function spin(){

if(bet > balance){
alert("Not enough balance")
return
}

balance -= bet

startSpin()

    const res = await fetch("/spin",{
        method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({bet})
})

const data = await res.json()

stopReels(data.grid,data.win)

}

function startSpin(){

for(let r=0;r<3;r++){

const reel=document.getElementById("reel"+r)

reel.innerHTML=""

for(let i=0;i<6;i++){

const div=document.createElement("div")

div.className="symbol spinSymbol"

div.innerHTML=`<img src="symbols/${randomSymbol()}.png">`

reel.appendChild(div)

}

}

}

function randomSymbol(){

const symbols=["HV1","HV2","HV3","LV1","LV2","LV3","WILD"]

return symbols[Math.floor(Math.random()*symbols.length)]

}

function stopReels(grid,win){

for(let r=0;r<3;r++){

setTimeout(()=>{

drawReel(r,grid)

if(r===2){

finishSpin(win)

}

},r*600)

}

}

function drawReel(reelIndex,grid){

const reel=document.getElementById("reel"+reelIndex)

reel.innerHTML=""

for(let row=0;row<3;row++){

const symbol=grid[reelIndex][row]

const div=document.createElement("div")

div.className="symbol"

div.innerHTML=`<img src="symbols/${symbol}.png">`

reel.appendChild(div)

}

}

function finishSpin(win){

balance += win

document.getElementById("balance").innerText="Balance: "+balance

document.getElementById("result").innerText="Win: "+win

celebrate(win)

}

function celebrate(win){

if(win > 0){

document.body.classList.add("winFlash")

setTimeout(()=>{
document.body.classList.remove("winFlash")
},1500)

}

if(win > 50){

document.body.classList.add("bigWin")

setTimeout(()=>{
document.body.classList.remove("bigWin")
},2000)

}

}

function setBet(value){

bet = value

document.getElementById("currentBet").innerText = value

}