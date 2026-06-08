const engine = require("../server/spin")

const SPINS = 1000000
const BET = 1

let totalBet = 0
let totalWin = 0
let hitCount = 0
let maxWin = 0

let winDistribution = {}

for(let i=0;i<SPINS;i++){

    const grid = engine.spin()

    const win = engine.evaluate(grid, BET)

    totalBet += BET
    totalWin += win

    if(win > 0){

        hitCount++

        if(win > maxWin){
            maxWin = win
        }

        if(!winDistribution[win]){
            winDistribution[win] = 0
        }

        winDistribution[win]++

    }

}

const RTP = (totalWin / totalBet) * 100
const hitFrequency = (hitCount / SPINS) * 100

console.log("Spins:", SPINS)
console.log("Total Bet:", totalBet)
console.log("Total Win:", totalWin)

console.log("RTP:", RTP.toFixed(2) + "%")
console.log("Hit Frequency:", hitFrequency.toFixed(2) + "%")

console.log("Max Win:", maxWin + "x")

console.log("\nWin Distribution:")

console.log(winDistribution)