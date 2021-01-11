const socket = io()
const nameInput = document.getElementById('name-input')
const findGameBtn = document.getElementById('find-game-btn')

socket.on('matchFounded', (msg) => {
    console.log('matchFounded', msg)
    const waitPlayerEl = document.getElementById('waitingPlayer')
    document.querySelector('#messages').removeChild(waitPlayerEl)
    // const h2 = document.createElement('h2')
    // h2.innerText = msg.roomId
    // document.querySelector('#messages').appendChild(h2)
    const button = document.createElement('button')
    const inputedValue = document.createElement('input')
    const guessedValue = document.createElement('input')
    inputedValue.setAttribute('placeholder', 'Coloque seu valor')
    guessedValue.setAttribute(
        'placeholder',
        'Coloque o valor do seu adversário'
    )
    button.innerText = 'Finish your play'
    document.querySelector('#messages').appendChild(button)
    document.querySelector('#messages').appendChild(inputedValue)
    document.querySelector('#messages').appendChild(guessedValue)
    button.addEventListener('click', () => {
        socket.emit('finishPlay', {
            roomId: msg.roomId,
            guessedValue: guessedValue.value,
            inputedValue: inputedValue.value,
        })
    })
})

socket.on('matchIsOver', ({ msg }) => {
    console.log('Match is over: ', msg)
    const h2 = document.createElement('h2')
    h2.innerText = msg
    document.querySelector('#messages').appendChild(h2)
    setTimeout(() => {
        location.reload()
    }, 3000)
})

function findMatch() {
    socket.emit('findMatch', { nickname: nameInput.value })
    const h2 = document.createElement('h2')
    h2.setAttribute('id', 'waitingPlayer')
    h2.innerText = 'Waiting for a player...'
    findGameBtn.disabled = true
    document.querySelector('#messages').appendChild(h2)
    // window.location.href = 'waiting-room.html'
}
