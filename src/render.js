const { desktopCapturer, remote } = require('electron')
const { Menu } = remote
const { dialog } = remote
const { writeFile } = require("fs")

let mediaRecorder
const recordedChunks = []

// Buttons
const start = document.getElementById('start')
start.onclick = e => {
    if(mediaRecorder){
        mediaRecorder.start()
        start.classList.add('is-danger')
        start.innerText = 'Recording'
    } else{
        dialog.showMessageBox(null, {
            message: "Please select Source first"
        })
    }
}

const stop = document.getElementById('stop')
stop.onclick = e => {
    if(mediaRecorder){   
        if(mediaRecorder.state == "inactive"){
            dialog.showMessageBox(null, {
                message: "Please select Start to Start Recording"
            })
        } else {
            mediaRecorder.stop()
            start.classList.remove('is-danger')
            start.innerText = 'Start'
        }
    } else {
        dialog.showMessageBox(null, {
            message: "Please select Source first"
        })
    }
}

const pause = document.getElementById('pause')
pause.onclick = e => {
    if(mediaRecorder){  
        mediaRecorder.pause()
        pause.innerText = 'Recording Paused'
    } else {
        dialog.showMessageBox(null, {
            message: "Please select Source first"
        })
    }
}

const videoElement = document.querySelector('video')
const videoSelect = document.getElementById('videoSelect')
videoSelect.onclick = getVideoSources

async function getVideoSources(){
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    })

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map( source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            }
        })
    )

    videoOptionsMenu.popup()
}

async function selectSource(source) {
    videoSelect.innerText = source.name

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    }
    
    // create the stream
    const stream = await navigator.mediaDevices
        .getUserMedia(constraints);

    // Preview the video
    videoElement.srcObject = stream
    videoElement.play()

    const options = { mimeType : 'video/webm; codecs=vp9' }
    mediaRecorder = new MediaRecorder(stream, options)

    // Register event handlers. These will be invoked on the start() and stop() methods
    mediaRecorder.ondataavailable = handleDataAvailable
    mediaRecorder.onstop = handleStop
}

// Capture all recorded chunks
function handleDataAvailable(e){
    console.log("video data available")
    recordedChunks.push(e.data)
}

async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
    })

    // Buffer    
    const buf = await blob.arrayBuffer()
    const buffer = Buffer.from( buf )

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save Video',
        defaultPath: `vid-${Date.now()}.webm`
    })

    console.log(filePath)

    if(filePath){
        writeFile(filePath, buffer, () => console.log('Video saved') )
    }
}
