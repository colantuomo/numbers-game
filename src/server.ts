import * as path from 'path'
import { createServer } from 'http'
import * as express from 'express'
import { Server, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const server = createServer(app)
const io = new Server(server)

app.use('/', express.static(path.join(__dirname, 'public')))

interface PlayerInfo {
    skt: Socket
    name: string
    hasPlayed: boolean
    valueInputed?: number
    valueGuessed?: number
}

interface Room {
    id: string
    players: PlayerInfo[]
}

const AVAILABLE_PLAYERS: PlayerInfo[] = []
const ROOMS: Room[] = []

const findAPlayer = () =>
    AVAILABLE_PLAYERS.length > 0 ? AVAILABLE_PLAYERS.shift() : false

const createARoom = (player1: PlayerInfo, player2: PlayerInfo): Room => {
    // create a room
    const room = { id: uuidv4(), players: [player1, player2] }
    ROOMS.push(room)
    console.log(room)
    return room
}

io.on('connection', (socket: Socket) => {
    console.log('User has connected')
    socket.on('findMatch', ({ nickname }) => {
        console.log(`${nickname} is looking for a match...`)
        const playerOne: PlayerInfo = {
            name: nickname,
            skt: socket,
            hasPlayed: false,
        }
        const playerFounded = findAPlayer()
        if (!playerFounded) {
            AVAILABLE_PLAYERS.push(playerOne)
            return
        }
        console.log('Match founded!! - Creating a room..')
        const room = createARoom(playerOne, playerFounded)
        let players = []
        room.players.forEach(({ skt, name }) => {
            skt.join(room.id)
            players.push(name)
        })
        // emit events just for a specific room
        io.to(room.id).emit('matchFounded', {
            roomId: room.id,
            players,
        })
    })
    const formatWinnerMessage = ({
        player1,
        player2,
    }: {
        player1
        player2
    }) => {
        if (player1 && player1) {
            return 'Os 2 venceram'
        }
        if (player1 && !player2) {
            return 'Player 1 venceu'
        }
        if (player2 && !player1) {
            return 'Player 2 venceu'
        }
        if (!player1 && !player2) {
            return 'Ninguem ganhou!'
        }
    }
    const matchIsOver = (room: Room) =>
        !room.players.map((player) => player.hasPlayed).includes(false)
    const getTheWinner = (room: Room) => {
        const pl1 = room.players[0]
        const pl2 = room.players[1]
        const winners = { player1: false, player2: false }
        if (pl1.valueGuessed === pl2.valueInputed) {
            winners.player1 = true
        }
        if (pl2.valueGuessed === pl1.valueInputed) {
            winners.player2 = true
        }
        return formatWinnerMessage(winners)
    }
    socket.on('finishPlay', (msg) => {
        const room = ROOMS.find((e) => msg.roomId === e.id)
        room.players.forEach((player) => {
            if (player.skt.id === socket.id) {
                player.hasPlayed = true
                player.valueGuessed = msg.guessedValue
                player.valueInputed = msg.inputedValue
            }
        })
        if (matchIsOver(room)) {
            const msg = getTheWinner(room)
            io.to(room.id).emit('matchIsOver', { msg })
            return
        }
    })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
