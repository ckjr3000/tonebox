// Module for creating and maniopulating an oscillator
const ctx = new AudioContext();
const createOsc = document.getElementById('create-osc');
const oscChannel = document.getElementById('osc-channel');

createOsc.addEventListener('click', () => {
    createOsc.classList.add('hidden');
    oscChannel.classList.remove('hidden');
    let osc;
    let gain = ctx.createGain();

    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', () => {
        osc = ctx.createOscillator();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
    });

    const stopBtn = document.getElementById('stop-btn');
    stopBtn.addEventListener('click', () => {
        osc.stop();
        osc = null;
    });

    const muteBtn = document.getElementById('mute-btn');
    muteBtn.addEventListener('click', () => {
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
    });

    const gainCtrl = document.getElementById('gain-ctrl');
    gainCtrl.addEventListener('change', (e) => {
        let gainVal = e.target.value;
        gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + 0.05);
    });

    const waveTypeSelect = document.getElementById('wave-type-select');
    waveTypeSelect.addEventListener('change', (e) => {
        let shape = e.target.value;
        osc.type = shape;
    });

    const freqCtrl = document.getElementById('frequency-ctrl');
    freqCtrl.addEventListener('change', (e) => {
        let freqVal = e.target.value;
        osc.frequency.linearRampToValueAtTime(freqVal, ctx.currentTime + 0.05);
    })
})

